import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { GoogleGenerativeAI, Part, SchemaType } from '@google/generative-ai';
import { environment } from '@env/environment';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { Order } from '@core/models/order';
import { Product } from '@core/models/product';

export interface Message {
    role: 'user' | 'model';
    content: string;
    timestamp: Date;
}

@Injectable({
    providedIn: 'root',
})
export class AiAssistantService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);
    private readonly genAI = new GoogleGenerativeAI(environment.geminiApiKey);

    private readonly model = this.genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
        systemInstruction: `You are an expert assistant in e-commerce management. 
  The current date is ${new Date().toISOString()}. 
  Use the provided tools to give answers based on real data. 
  If the user asks for a report, summarize the data professionally in Markdown format.`,
        tools: [
            {
                functionDeclarations: [
                    {
                        name: 'get_sales_stats',
                        description: 'Get sales statistics for a specific period of time.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                startDate: { type: SchemaType.STRING, description: 'ISO date string (YYYY-MM-DD)' },
                                endDate: { type: SchemaType.STRING, description: 'ISO date string (YYYY-MM-DD)' },
                                category: { type: SchemaType.STRING, description: 'Optional category name to filter sales' }
                            }
                        }
                    },
                    {
                        name: 'get_orders',
                        description: 'Get orders by status, customer name or date range.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                status: { type: SchemaType.STRING, description: 'Order status (pending, processing, shipped, delivered, cancelled)' },
                                customerName: { type: SchemaType.STRING, description: 'Name of the customer' },
                                startDate: { type: SchemaType.STRING, description: 'ISO date string' }
                            }
                        }
                    },
                    {
                        name: 'get_products',
                        description: 'Get product information including stock levels and prices.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                search: { type: SchemaType.STRING, description: 'Product name or SKU' },
                                lowStock: { type: SchemaType.BOOLEAN, description: 'If true, only returns products with low stock' }
                            }
                        }
                    },
                    {
                        name: 'get_order_details',
                        description: 'Gets all detailed information for a specific order, including purchased products, payment status, and shipping data.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                orderNumber: { type: SchemaType.STRING, description: 'The order number (e.g., STORE-2024-0001)' }
                            },
                            required: ['orderNumber']
                        }
                    },
                    {
                        name: 'get_sales_metrics',
                        description: 'Gets aggregated sales metrics (total revenue, number of orders) for a period of time. Useful for answering "how much did we sell yesterday" or "this month comparison".',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                period: {
                                    type: SchemaType.STRING,
                                    enum: ['today', 'yesterday', 'this_week', 'this_month', 'last_month'],
                                    description: 'The time period to query',
                                }
                            },
                            required: ['period']
                        } as any
                    },
                    {
                        name: 'get_inventory_alerts',
                        description: 'Lists products that are out of stock or below the low stock threshold. Responds to "What products should I restock?"',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                onlyOutOfStock: { type: SchemaType.BOOLEAN, description: 'If true, only shows those with 0 stock' }
                            }
                        } as any
                    },
                    {
                        name: 'get_product_performance',
                        description: 'Identifies top selling products and those generating the most revenue in the last 30 days.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                limit: { type: SchemaType.NUMBER, description: 'Number of products to show (default 5)' }
                            }
                        } as any
                    },
                    {
                        name: 'analyze_customer_segment',
                        description: 'Search customers by segment (VIP, Loyal, Repeat, New) or by email. Useful for "Who are my VIP customers?" or "When was this customer\'s last purchase?"',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                segment: {
                                    type: SchemaType.STRING,
                                    enum: ['VIP', 'Loyal', 'Repeat', 'New', 'Prospect'],
                                    description: 'The customer segment to filter',
                                },
                                email: { type: SchemaType.STRING, description: 'Optional email to search for a specific customer' }
                            }
                        } as any
                    },
                    {
                        name: 'get_active_promotions',
                        description: 'Lists active discount codes, their validity, and how many times they have been used.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {}
                        }
                    },
                    {
                        name: 'get_recent_audit_logs',
                        description: 'Queries the latest important changes on the platform (product creation, price changes, refunds). Useful for technical audit.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                resourceType: { type: SchemaType.STRING, description: 'Filter by resource type: product, order, tenant, payment' },
                                limit: { type: SchemaType.NUMBER, description: 'Number of records to fetch' }
                            }
                        } as any
                    },
                    {
                        name: 'get_app_guide',
                        description: 'Queries the user manual and system navigation guide. Useful for answering "How do I do X?", "Where do I find Y?" or "What is this screen for?".',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                topic: { type: SchemaType.STRING, description: 'The topic or functionality the user has doubts about (e.g., "status history", "branding", "sales")' }
                            }
                        }
                    },
                    {
                        name: 'navigate_to',
                        description: 'Automatically redirects the user to a specific section of the system. Useful when the user says "take me to...", "I want to see...", or when the assistant suggests going to a screen to perform an action.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                page: {
                                    type: SchemaType.STRING,
                                    enum: ['dashboard', 'products', 'orders', 'customers', 'members', 'settings'],
                                    description: 'The page to navigate to'
                                }
                            },
                            required: ['page']
                        } as any
                    }
                ]
            }
        ]
    });

    private readonly STORAGE_KEY = 'venti_ai_chat_history';
    private readonly HISTORY_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    readonly navigationRequest$ = new Subject<string>();

    messages = signal<Message[]>(this.loadMessages());
    isLoading = signal<boolean>(false);
    isVisible = signal<boolean>(true);

    hide() {
        this.isVisible.set(false);
    }

    show() {
        this.isVisible.set(true);
    }

    private loadMessages(): Message[] {
        const defaultMessage: Message = {
            role: 'model',
            content: 'Hello! I am your Venti assistant. I can help you with information about your sales, orders, and products. How can I help you today?',
            timestamp: new Date()
        };

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) return [defaultMessage];

            const parsed = JSON.parse(stored);
            const messages: Message[] = parsed.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp)
            }));

            // Check expiration (24h)
            if (Date.now() - parsed.timestamp > this.HISTORY_EXPIRATION_MS) {
                localStorage.removeItem(this.STORAGE_KEY);
                return [defaultMessage];
            }

            return messages;
        } catch (e) {
            console.error('Error loading chat history:', e);
            return [defaultMessage];
        }
    }

    private saveMessages(messages: Message[]) {
        try {
            const data = {
                timestamp: Date.now(),
                messages
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving chat history:', e);
        }
    }

    async sendMessage(text: string) {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        // Update UI state
        const newMessage: Message = { role: 'user', content: text, timestamp: new Date() };
        this.messages.update(msgs => {
            const updated = [...msgs, newMessage];
            this.saveMessages(updated);
            return updated;
        });
        this.isLoading.set(true);

        try {
            // We filter out the initial model welcome message if it's the first one.
            const history = this.messages()
                .map(m => ({
                    role: m.role === 'model' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }))
                .filter((m, i) => !(i === 0 && m.role === 'model'));

            const chat = this.model.startChat({
                history: history.slice(0, -1), // Exclude the user message we just added
                generationConfig: {
                    maxOutputTokens: 1000,
                }
            });

            let result = await chat.sendMessage(text);
            let response = result.response;

            // Handle tool calls recursively
            let toolCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);
            while (toolCalls && toolCalls.length > 0) {
                const toolResults: Part[] = [];

                for (const call of toolCalls) {
                    if (call.functionCall) {
                        const { name, args } = call.functionCall;
                        const data = await this.executeTool(name, args as any);
                        toolResults.push({
                            functionResponse: {
                                name,
                                response: { content: data }
                            }
                        });
                    }
                }

                const nextResult = await chat.sendMessage(toolResults);
                response = nextResult.response;
                toolCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);
            }

            // Final text extraction
            const modelText = response.candidates?.[0]?.content?.parts
                ?.map(p => p.text || '')
                .join('') || 'Sorry, I could not generate a text response.';

            this.messages.update(msgs => {
                const updated = [...msgs, {
                    role: 'model' as const,
                    content: modelText,
                    timestamp: new Date()
                }];
                this.saveMessages(updated);
                return updated;
            });

        } catch (error) {
            console.error('AI Assistant Error:', error);
            this.messages.update(msgs => {
                const updated = [...msgs, {
                    role: 'model' as const,
                    content: 'Sorry, an error occurred while processing your request. Could you try again?',
                    timestamp: new Date()
                }];
                this.saveMessages(updated);
                return updated;
            });
        } finally {
            this.isLoading.set(false);
        }
    }

    private async executeTool(name: string, args: any): Promise<any> {
        const tenantId = this.tenantService.tenantId();

        switch (name) {
            case 'get_sales_stats':
                return this.handleGetSalesStats(tenantId!, args);
            case 'get_orders':
                return this.handleGetOrders(tenantId!, args);
            case 'get_products':
                return this.handleGetProducts(tenantId!, args);
            case 'get_order_details':
                return this.handleGetOrderDetails(tenantId!, args);
            case 'get_sales_metrics':
                return this.handleGetSalesMetrics(tenantId!, args);
            case 'get_inventory_alerts':
                return this.handleGetInventoryAlerts(tenantId!, args);
            case 'get_product_performance':
                return this.handleGetProductPerformance(tenantId!, args);
            case 'analyze_customer_segment':
                return this.handleAnalyzeCustomerSegment(tenantId!, args);
            case 'get_active_promotions':
                return this.handleGetActivePromotions(tenantId!, args);
            case 'get_recent_audit_logs':
                return this.handleGetRecentAuditLogs(tenantId!, args);
            case 'get_app_guide':
                return this.handleGetAppGuide(args);
            case 'navigate_to':
                return this.handleNavigateTo(args);
            default:
                return { error: 'Unknown tool' };
        }
    }

    private async handleGetOrderDetails(tenantId: string, args: any) {
        const { data, error } = await this.supabase.client
            .from('orders')
            .select('*, items:order_items(*)')
            .eq('tenant_id', tenantId)
            .eq('order_number', args.orderNumber)
            .single();
        if (error) return { error: error.message };
        return data;
    }

    private async handleGetSalesMetrics(tenantId: string, args: any) {
        // Simple mock for now, actual implementation would aggregate data
        return { message: `Calculating metrics for ${args.period}... Feature coming soon.` };
    }

    private async handleGetInventoryAlerts(tenantId: string, args: any) {
        let query = this.supabase.client
            .from('products')
            .select('name, sku, stock_quantity')
            .eq('tenant_id', tenantId);

        if (args.onlyOutOfStock) query = query.eq('stock_quantity', 0);
        else query = query.lt('stock_quantity', 10);

        const { data, error } = await query;
        if (error) return { error: error.message };
        return data;
    }

    private async handleGetProductPerformance(tenantId: string, args: any) {
        return { message: "Identifying top performers... Feature coming soon." };
    }

    private async handleAnalyzeCustomerSegment(tenantId: string, args: any) {
        return { message: `Analyzing segment ${args.segment}... Feature coming soon.` };
    }

    private async handleGetActivePromotions(tenantId: string, args: any) {
        const { data, error } = await this.supabase.client
            .from('discount_codes')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('status', 'active');
        if (error) return { error: error.message };
        return data;
    }

    private async handleGetRecentAuditLogs(tenantId: string, args: any) {
        return { message: "Checking audit logs... Feature coming soon." };
    }


    private async handleGetSalesStats(tenantId: string, args: any) {
        let query = this.supabase.client
            .from('orders')
            .select('total_amount, created_at')
            .eq('tenant_id', tenantId)
            .not('status', 'in', '("cancelled", "refunded")');

        if (args.startDate) query = query.gte('created_at', args.startDate);
        if (args.endDate) query = query.lte('created_at', args.endDate);

        const { data, error } = await query;
        if (error) return { error: error.message };

        const total = (data || []).reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
        return {
            total_sales: total,
            count: data?.length || 0,
            period: `${args.startDate || 'all'} to ${args.endDate || 'now'}`
        };
    }

    private async handleGetOrders(tenantId: string, args: any) {
        let query = this.supabase.client
            .from('orders')
            .select('order_number, status, total_amount, customer_first_name, customer_last_name, created_at')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (args.status) query = query.eq('status', args.status);
        if (args.startDate) query = query.gte('created_at', args.startDate);
        if (args.customerName) {
            query = query.or(`customer_first_name.ilike.%${args.customerName}%,customer_last_name.ilike.%${args.customerName}%`);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };

        return data;
    }

    private async handleGetProducts(tenantId: string, args: any) {
        let query = this.supabase.client
            .from('products')
            .select('name, sku, price, stock_quantity, status')
            .eq('tenant_id', tenantId)
            .is('deleted_at', null);

        if (args.search) query = query.ilike('name', `%${args.search}%`);
        if (args.lowStock) query = query.lt('stock_quantity', 10);

        const { data, error } = await query;
        if (error) return { error: error.message };

        return data;
    }

    private async handleGetAppGuide(args: any) {
        const guides: Record<string, string> = {
            'dashboard': 'The main Dashboard shows a summary of monthly sales, order statuses, and quick access to key functions.',
            'products': 'In the Product Catalog, you can create, edit, and manage the stock of your items. It is found in the side menu.',
            'orders': 'The Orders section shows all placed orders. Here you can filter by status, customer, or date.',
            'order-history': 'To view the status history of an order: 1. Go to "Orders". 2. Click on the order you want to consult. 3. Scroll down until you find the "Status History" section.',
            'branding': 'You can customize your store logo and colors in Settings -> Branding.',
            'settings': 'In Settings, you can manage store settings, branding, taxes, and shipping methods.'
        };

        const topic = args.topic?.toLowerCase() || '';
        const guide = guides[topic] || Object.values(guides).join('\n\n');
        return { guide };
    }

    private async handleNavigateTo(args: any) {
        const pages: Record<string, string> = {
            'dashboard': '/dashboard',
            'products': '/products',
            'orders': '/orders',
            'customers': '/customers',
            'members': '/members',
            'settings': '/settings'
        };

        const path = pages[args.page];
        if (path) {
            this.navigationRequest$.next(path);
            return { success: true, message: `Navigating to the ${args.page} section...` };
        }
        return { success: false, error: 'Invalid page' };
    }
}
