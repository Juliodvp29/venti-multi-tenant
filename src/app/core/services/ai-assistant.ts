import { inject, Injectable, signal } from '@angular/core';
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
        systemInstruction: `Eres un asistente experto en gestión de e-commerce. 
  La fecha actual es ${new Date().toISOString()}. 
  Usa las herramientas proporcionadas para dar respuestas basadas en datos reales. 
  Si el usuario pide un reporte, resume los datos de forma profesional en formato Markdown.`,
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
                        description: 'Obtiene toda la información detallada de una orden específica, incluyendo productos comprados, estado de pago y datos de envío.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                orderNumber: { type: SchemaType.STRING, description: 'El número de orden (ej: STORE-2024-0001)' }
                            },
                            required: ['orderNumber']
                        }
                    },
                    {
                        name: 'get_sales_metrics',
                        description: 'Obtiene métricas de ventas agregadas (ingresos totales, número de órdenes) para un periodo de tiempo. Útil para responder "cuánto vendimos ayer" o "comparativa de este mes".',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                period: {
                                    type: SchemaType.STRING,
                                    enum: ['today', 'yesterday', 'this_week', 'this_month', 'last_month'],
                                    description: 'El periodo de tiempo a consultar',
                                }
                            },
                            required: ['period']
                        } as any
                    },
                    {
                        name: 'get_inventory_alerts',
                        description: 'Lista los productos que están agotados o por debajo del umbral de stock bajo. Responde a "¿Qué productos debo reponer?"',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                onlyOutOfStock: { type: SchemaType.BOOLEAN, description: 'Si es true, solo muestra los que tienen stock 0' }
                            }
                        } as any
                    },
                    {
                        name: 'get_product_performance',
                        description: 'Identifica los productos más vendidos (top sellers) y los que generan más ingresos en los últimos 30 días.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                limit: { type: SchemaType.NUMBER, description: 'Cantidad de productos a mostrar (defecto 5)' }
                            }
                        } as any
                    },
                    {
                        name: 'analyze_customer_segment',
                        description: 'Busca clientes por segmento (VIP, Loyal, Repeat, New) o por correo. Útil para "¿Quiénes son mis clientes VIP?" o "¿Cuándo fue la última compra de este cliente?"',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                segment: {
                                    type: SchemaType.STRING,
                                    enum: ['VIP', 'Loyal', 'Repeat', 'New', 'Prospect'],
                                    description: 'El segmento de clientes a filtrar',
                                },
                                email: { type: SchemaType.STRING, description: 'Email opcional para buscar un cliente específico' }
                            }
                        } as any
                    },
                    {
                        name: 'get_active_promotions',
                        description: 'Lista los códigos de descuento activos, su validez y cuántas veces se han usado.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {}
                        }
                    },
                    {
                        name: 'get_recent_audit_logs',
                        description: 'Consulta los últimos cambios importantes en la plataforma (creación de productos, cambios de precios, reembolsos). Útil para auditoría técnica.',
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                resourceType: { type: SchemaType.STRING, description: 'Filtrar por tipo de recurso: product, order, tenant, payment' },
                                limit: { type: SchemaType.NUMBER, description: 'Número de registros a traer' }
                            }
                        } as any
                    }
                ]
            }
        ]
    });

    private readonly STORAGE_KEY = 'venti_ai_chat_history';
    private readonly HISTORY_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    messages = signal<Message[]>(this.loadMessages());
    isLoading = signal<boolean>(false);

    private loadMessages(): Message[] {
        const defaultMessage: Message = {
            role: 'model',
            content: '¡Hola! Soy tu asistente de Venti. Puedo ayudarte con información sobre tus ventas, órdenes y productos. ¿En qué puedo ayudarte hoy?',
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
            // Gemini history must start with 'user' role.
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
                .join('') || 'Lo siento, no pude generar una respuesta de texto.';

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
                    content: 'Lo siento, ocurrió un error al procesar tu solicitud. ¿Podrías intentar de nuevo?',
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
            .from('discounts')
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
}
