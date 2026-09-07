import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { ToastService } from './toast';
import { Order } from '@core/models/order';
import { Product } from '@core/models/product';
import { StorefrontSection, ThemePresetId, ThemeTokens, ThemeDesignSnapshot } from '@core/models';
import { THEME_PRESETS, AVAILABLE_FONTS } from '@core/constants/theme-presets';

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface AiRequestUsage {
  allowed: boolean;
  reason?: 'daily_limit_reached' | 'subscription_inactive' | 'unauthorized' | 'tenant_not_found';
  used?: number;
  limit?: number;
}

interface AiContentPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, any> };
  functionResponse?: { name: string; response?: unknown };
}

interface AiContent {
  role: 'user' | 'model';
  parts: AiContentPart[];
}

interface AiGenerateResponse {
  candidates?: Array<{ content?: { parts?: AiContentPart[] } }>;
}

export interface UpdateStoreDesignArgs {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  headerColor?: string;
  footerColor?: string;
  fontFamily?: string;
  themePreset?: string;
  tagline?: string;
  businessName?: string;
}

export interface UpdateStorefrontSectionsArgs {
  action?: string;
  sectionType?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiAssistantService {
  private readonly supabase = inject(Supabase);
  private readonly tenantService = inject(TenantService);
  private readonly toast = inject(ToastService);

  // Esquemas de herramientas (públicos, sin secretos): el modelo, el system
  // prompt y los límites se fijan en la Edge Function ai-chat, que guarda la
  // API key de Gemini como secreto del servidor. El navegador jamás la ve.
  private readonly aiTools = [
    {
      functionDeclarations: [
        {
          name: 'get_sales_stats',
          description: 'Get sales statistics for a specific period of time.',
          parameters: {
            type: 'OBJECT',
            properties: {
              startDate: { type: 'STRING', description: 'ISO date string (YYYY-MM-DD)' },
              endDate: { type: 'STRING', description: 'ISO date string (YYYY-MM-DD)' },
              category: { type: 'STRING', description: 'Optional category name to filter sales' },
            },
          },
        },
        {
          name: 'get_orders',
          description: 'Get orders by status, customer name or date range.',
          parameters: {
            type: 'OBJECT',
            properties: {
              status: {
                type: 'STRING',
                description: 'Order status (pending, processing, shipped, delivered, cancelled)',
              },
              customerName: { type: 'STRING', description: 'Name of the customer' },
              startDate: { type: 'STRING', description: 'ISO date string' },
            },
          },
        },
        {
          name: 'get_products',
          description: 'Get product information including stock levels and prices.',
          parameters: {
            type: 'OBJECT',
            properties: {
              search: { type: 'STRING', description: 'Product name or SKU' },
              lowStock: {
                type: 'BOOLEAN',
                description: 'If true, only returns products with low stock',
              },
            },
          },
        },
        {
          name: 'get_order_details',
          description:
            'Gets all detailed information for a specific order, including purchased products, payment status, and shipping data.',
          parameters: {
            type: 'OBJECT',
            properties: {
              orderNumber: {
                type: 'STRING',
                description: 'The order number (e.g., STORE-2024-0001)',
              },
            },
            required: ['orderNumber'],
          },
        },
        {
          name: 'get_sales_metrics',
          description:
            'Gets aggregated sales metrics (total revenue, number of orders) for a period of time. Useful for answering "how much did we sell yesterday" or "this month comparison".',
          parameters: {
            type: 'OBJECT',
            properties: {
              period: {
                type: 'STRING',
                description:
                  'The time period to query: today, yesterday, this_week, this_month, last_month',
              },
            },
            required: ['period'],
          },
        },
        {
          name: 'get_inventory_alerts',
          description:
            'Lists products that are out of stock or below the low stock threshold. Responds to "What products should I restock?"',
          parameters: {
            type: 'OBJECT',
            properties: {
              onlyOutOfStock: {
                type: 'BOOLEAN',
                description: 'If true, only shows those with 0 stock',
              },
            },
          },
        },
        {
          name: 'get_product_performance',
          description:
            'Identifies top selling products and those generating the most revenue in the last 30 days.',
          parameters: {
            type: 'OBJECT',
            properties: {
              limit: { type: 'NUMBER', description: 'Number of products to show (default 5)' },
            },
          },
        },
        {
          name: 'analyze_customer_segment',
          description:
            'Search customers by segment (VIP, Loyal, Repeat, New) or by email. Useful for "Who are my VIP customers?" or "When was this customer\'s last purchase?"',
          parameters: {
            type: 'OBJECT',
            properties: {
              segment: {
                type: 'STRING',
                description: 'The customer segment to filter (VIP, Loyal, Repeat, New, Prospect)',
              },
              email: {
                type: 'STRING',
                description: 'Optional email to search for a specific customer',
              },
            },
          },
        },
        {
          name: 'get_active_promotions',
          description:
            'Lists active discount codes, their validity, and how many times they have been used.',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
          name: 'get_recent_audit_logs',
          description:
            'Queries the latest important changes on the platform (product creation, price changes, refunds). Useful for technical audit.',
          parameters: {
            type: 'OBJECT',
            properties: {
              resourceType: {
                type: 'STRING',
                description: 'Filter by resource type: product, order, tenant, payment',
              },
              limit: { type: 'NUMBER', description: 'Number of records to fetch' },
            },
          },
        },
        {
          name: 'get_app_guide',
          description:
            'Queries the user manual and system navigation guide. Useful for answering "How do I do X?", "Where do I find Y?" or "What is this screen for?".',
          parameters: {
            type: 'OBJECT',
            properties: {
              topic: {
                type: 'STRING',
                description:
                  'The topic or functionality the user has doubts about (e.g., "status history", "branding", "sales")',
              },
            },
          },
        },
        {
          name: 'navigate_to',
          description:
            'Automatically redirects the user to a specific section of the system. Useful when the user says "take me to...", "I want to see...", or when the assistant suggests going to a screen to perform an action.',
          parameters: {
            type: 'OBJECT',
            properties: {
              page: {
                type: 'STRING',
                description:
                  'The page to navigate to: dashboard, products, orders, customers, members, settings, reviews, coupons, subscription, commissions, inventory, carts, reports, integrations',
              },
            },
            required: ['page'],
          },
        },
        {
          name: 'get_customers',
          description: 'Search customers by name or email, or list top customers by total spent.',
          parameters: {
            type: 'OBJECT',
            properties: {
              search: {
                type: 'STRING',
                description: 'Customer first name, last name or email to search',
              },
              limit: {
                type: 'NUMBER',
                description: 'Max number of customers to return (default 10)',
              },
            },
          },
        },
        {
          name: 'get_customer_details',
          description:
            'Gets full details of one customer: profile, addresses and recent orders. Identify the customer by email or id.',
          parameters: {
            type: 'OBJECT',
            properties: {
              email: { type: 'STRING', description: 'Customer email' },
              customerId: { type: 'STRING', description: 'Customer id (alternative to email)' },
            },
          },
        },
        {
          name: 'get_reviews',
          description:
            'Lists product reviews. Useful for "latest reviews", "bad reviews" or "reviews pending moderation".',
          parameters: {
            type: 'OBJECT',
            properties: {
              maxRating: {
                type: 'NUMBER',
                description:
                  'Only return reviews with rating up to this value (e.g. 3 for 1-3 star reviews)',
              },
              onlyPending: {
                type: 'BOOLEAN',
                description: 'If true, only reviews awaiting moderation',
              },
              limit: { type: 'NUMBER', description: 'Max number of reviews (default 10)' },
            },
          },
        },
        {
          name: 'get_coupon_performance',
          description:
            'Lists discount codes with their usage count. Useful for "which coupons work best".',
          parameters: {
            type: 'OBJECT',
            properties: {
              onlyActive: { type: 'BOOLEAN', description: 'If true, only active codes' },
              limit: { type: 'NUMBER', description: 'Max number of codes (default 10)' },
            },
          },
        },
        {
          name: 'get_commission_summary',
          description:
            'Gets a summary of platform commissions: pending and paid counts and amounts, including this month.',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
          name: 'get_subscription_status',
          description:
            'Gets the current subscription plan, its status, expiration date and the latest billing history record.',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
          name: 'get_team_members',
          description: 'Lists the active team members of the store with their roles.',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
          name: 'get_order_history',
          description: 'Gets the status change history of a specific order.',
          parameters: {
            type: 'OBJECT',
            properties: {
              orderNumber: {
                type: 'STRING',
                description: 'The order number (e.g., STORE-2024-0001)',
              },
            },
            required: ['orderNumber'],
          },
        },
        {
          name: 'get_payments_summary',
          description: 'Summarizes payments grouped by status and refunds totals for a period.',
          parameters: {
            type: 'OBJECT',
            properties: {
              period: {
                type: 'STRING',
                description:
                  'The time period: today, yesterday, this_week, this_month, last_month (default this_month)',
              },
            },
          },
        },
        {
          name: 'get_inventory_movements',
          description: 'Lists recent inventory movements (stock changes in products and variants).',
          parameters: {
            type: 'OBJECT',
            properties: {
              limit: { type: 'NUMBER', description: 'Max number of movements (default 10)' },
              startDate: { type: 'STRING', description: 'ISO date string to filter from' },
            },
          },
        },
        {
          name: 'get_store_profile',
          description:
            'Gets the store identity and contact configuration: business name, email, phone, address, domains and locale (currency, timezone).',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
          name: 'get_branding_config',
          description:
            'Gets the store visual identity: colors, fonts, logos, layout and social links.',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
          name: 'get_shipping_config',
          description:
            'Lists the configured shipping zones with their rates and covered countries.',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
          name: 'get_tax_config',
          description: 'Lists the configured tax rates.',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
          name: 'get_payment_methods',
          description:
            'Lists which payment methods are enabled in the store (credit card, cash on delivery, PSE, bank transfer, etc.).',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
          name: 'update_store_design',
          description:
            'Updates the store visual branding and design tokens in real time. Use this when the user asks to change font, change colors (primary, background, header, accent, etc.), change theme preset, or change store tagline/slogan.',
          parameters: {
            type: 'OBJECT',
            properties: {
              primaryColor: {
                type: 'STRING',
                description:
                  'Primary brand color (hex code like #2563eb or color name in Spanish like azul, rojo, verde, negro)',
              },
              secondaryColor: {
                type: 'STRING',
                description: 'Secondary brand color (hex code or color name)',
              },
              accentColor: {
                type: 'STRING',
                description: 'Accent / highlight color (hex code or color name)',
              },
              backgroundColor: {
                type: 'STRING',
                description:
                  'Main background color (hex code like #ffffff or #0f172a, or color name like blanco, crema, oscuro)',
              },
              headerColor: {
                type: 'STRING',
                description: 'Header / navbar background color (hex code or color name)',
              },
              footerColor: {
                type: 'STRING',
                description: 'Footer background color (hex code or color name)',
              },
              fontFamily: {
                type: 'STRING',
                description:
                  'Font family name: Outfit, Inter, Poppins, Playfair Display, Space Grotesk, Montserrat, Cinzel, Roboto, Plus Jakarta Sans, Merriweather',
              },
              themePreset: {
                type: 'STRING',
                description:
                  'Theme preset ID if changing whole theme: minimalist, modern, brutalist, luxury, warm, vibrant',
              },
              tagline: {
                type: 'STRING',
                description: 'Store slogan or tagline',
              },
            },
          },
        },
        {
          name: 'update_storefront_sections',
          description:
            'Adds, removes, toggles or modifies sections on the storefront homepage (hero banner, benefits, products, categories, testimonials, offers, faq, newsletter).',
          parameters: {
            type: 'OBJECT',
            properties: {
              action: {
                type: 'STRING',
                description:
                  'Action to perform: add_section, remove_section, toggle_section, update_hero',
              },
              sectionType: {
                type: 'STRING',
                description:
                  'Section type: hero, benefits, categories, product_grid, testimonials, offers, faq, newsletter, about_us',
              },
              title: {
                type: 'STRING',
                description: 'Title for the section or hero banner',
              },
              subtitle: {
                type: 'STRING',
                description: 'Subtitle, story, or description for the section or hero banner',
              },
              buttonText: {
                type: 'STRING',
                description: 'Call-to-action button text (e.g., Ver Productos, Comprar Ahora)',
              },
            },
            required: ['action'],
          },
        },
      ],
    },
  ];

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

  clearConversation(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.messages.set([this.createWelcomeMessage()]);
  }

  private createWelcomeMessage(): Message {
    return {
      role: 'model',
      content:
        '¡Hola! Soy tu asistente Venti. Puedo ayudarte a consultar ventas, pedidos y productos, o personalizar el diseño de tu tienda en tiempo real (cambiar colores, fuentes, temas o agregar secciones como testimonios, FAQ y ofertas). ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    };
  }

  private loadMessages(): Message[] {
    const defaultMessage = this.createWelcomeMessage();

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [defaultMessage];

      const parsed = JSON.parse(stored);
      const messages: Message[] = parsed.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
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
        messages,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  }

  async sendMessage(text: string) {
    if (text.trim().toLowerCase() === '/clear') {
      this.clearConversation();
      return;
    }

    const tenantId = this.tenantService.tenantId();
    if (!tenantId) throw new Error('Tenant not selected');

    this.isLoading.set(true);

    try {
      const usage = await this.consumeAiRequest(tenantId);
      if (!usage.allowed) {
        const content =
          usage.reason === 'daily_limit_reached'
            ? `Has alcanzado el límite diario de Venti AI (${usage.used ?? usage.limit}/${usage.limit} solicitudes). Podrás volver a usarlo mañana.`
            : 'Venti AI no está disponible para tu suscripción actual.';
        this.appendMessage({ role: 'model', content, timestamp: new Date() });
        return;
      }

      const newMessage: Message = { role: 'user', content: text, timestamp: new Date() };
      this.appendMessage(newMessage);

      // We filter out the initial model welcome message if it's the first one.
      const history: AiContent[] = this.messages()
        .map((m) => ({
          role: (m.role === 'model' ? 'model' : 'user') as 'user' | 'model',
          parts: [{ text: m.content }],
        }))
        .filter((m, i) => !(i === 0 && m.role === 'model'));

      // Chat sin estado: cada turno envía el historial completo a la Edge
      // Function ai-chat (la API key vive solo en el servidor).
      const contents: AiContent[] = [...history];
      let response = await this.generateContent(tenantId, contents);

      // Handle tool calls recursively
      let toolCalls = response.candidates?.[0]?.content?.parts?.filter((p) => p.functionCall);
      let toolTurns = 0;
      while (toolCalls && toolCalls.length > 0) {
        // Tope de seguridad: evita un bucle infinito de llamadas al modelo.
        if (toolTurns++ >= 5) break;
        const modelParts = response.candidates?.[0]?.content?.parts ?? [];
        const toolResults: AiContentPart[] = [];

        for (const call of toolCalls) {
          if (call.functionCall) {
            const { name, args } = call.functionCall;
            const data = await this.executeTool(name, args || {});
            toolResults.push({
              functionResponse: {
                name,
                response: { content: data },
              },
            });
          }
        }

        contents.push({ role: 'model', parts: modelParts }, { role: 'user', parts: toolResults });
        response = await this.generateContent(tenantId, contents);
        toolCalls = response.candidates?.[0]?.content?.parts?.filter((p) => p.functionCall);
      }

      // Final text extraction
      const modelText =
        response.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ||
        'Lo siento, no pude generar una respuesta de texto.';

      this.appendMessage({
        role: 'model' as const,
        content: modelText,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('AI Assistant Error:', error);
      this.appendMessage({
        role: 'model' as const,
        content:
          'Lo siento, ocurrió un error al procesar tu solicitud. ¿Podrías intentarlo de nuevo?',
        timestamp: new Date(),
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Invoca el modelo Gemini a través de la Edge Function 'ai-chat' enviando la estructura
   * completa requerida (tenant_id, contents y tools), procesando function calls si ocurren,
   * y retornando el texto generado. Permite reutilizar de forma segura el proxy de IA en otros módulos.
   */
  async generateCompletion(prompt: string): Promise<string> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) throw new Error('Tenant not selected');

    const contents: AiContent[] = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    let response = await this.generateContent(tenantId, contents);

    let toolCalls = response.candidates?.[0]?.content?.parts?.filter((p) => p.functionCall);
    let toolTurns = 0;
    while (toolCalls && toolCalls.length > 0) {
      if (toolTurns++ >= 5) break;
      const modelParts = response.candidates?.[0]?.content?.parts ?? [];
      const toolResults: AiContentPart[] = [];

      for (const call of toolCalls) {
        if (call.functionCall) {
          const { name, args } = call.functionCall;
          const data = await this.executeTool(name, args || {});
          toolResults.push({
            functionResponse: {
              name,
              response: { content: data },
            },
          });
        }
      }

      contents.push({ role: 'model', parts: modelParts }, { role: 'user', parts: toolResults });
      response = await this.generateContent(tenantId, contents);
      toolCalls = response.candidates?.[0]?.content?.parts?.filter((p) => p.functionCall);
    }

    return response.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  }

  private async generateContent(
    tenantId: string,
    contents: AiContent[],
  ): Promise<AiGenerateResponse> {
    const { data, error } = await this.supabase.client.functions.invoke('ai-chat', {
      body: { tenant_id: tenantId, contents, tools: this.aiTools },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as AiGenerateResponse;
  }

  private async consumeAiRequest(tenantId: string): Promise<AiRequestUsage> {
    const { data, error } = await this.supabase.client.rpc('consume_ai_request', {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error('Error checking AI request limit:', error);
      throw error;
    }

    return data as unknown as AiRequestUsage;
  }

  private appendMessage(message: Message): void {
    this.messages.update((msgs) => {
      const updated = [...msgs, message];
      this.saveMessages(updated);
      return updated;
    });
  }

  private async executeTool(name: string, args: Record<string, any>): Promise<unknown> {
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
      case 'get_customers':
        return this.handleGetCustomers(tenantId!, args);
      case 'get_customer_details':
        return this.handleGetCustomerDetails(tenantId!, args);
      case 'get_reviews':
        return this.handleGetReviews(tenantId!, args);
      case 'get_coupon_performance':
        return this.handleGetCouponPerformance(tenantId!, args);
      case 'get_commission_summary':
        return this.handleGetCommissionSummary(tenantId!);
      case 'get_subscription_status':
        return this.handleGetSubscriptionStatus(tenantId!);
      case 'get_team_members':
        return this.handleGetTeamMembers(tenantId!);
      case 'get_order_history':
        return this.handleGetOrderHistory(tenantId!, args);
      case 'get_payments_summary':
        return this.handleGetPaymentsSummary(tenantId!, args);
      case 'get_inventory_movements':
        return this.handleGetInventoryMovements(tenantId!, args);
      case 'get_store_profile':
        return this.handleGetStoreProfile(tenantId!);
      case 'get_branding_config':
        return this.handleGetBrandingConfig(tenantId!);
      case 'get_shipping_config':
        return this.handleGetShippingConfig(tenantId!);
      case 'get_tax_config':
        return this.handleGetTaxConfig(tenantId!);
      case 'get_payment_methods':
        return this.handleGetPaymentMethods(tenantId!);
      case 'update_store_design':
        return this.handleUpdateStoreDesign(tenantId!, args);
      case 'update_storefront_sections':
        return this.handleUpdateStorefrontSections(tenantId!, args);
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

  private resolvePeriod(period?: string): { start: string; end: string } {
    const now = new Date();
    const startOfDay = (d: Date) => {
      const copy = new Date(d);
      copy.setHours(0, 0, 0, 0);
      return copy;
    };
    let start: Date;
    let end: Date = new Date(now);
    switch (period) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = startOfDay(yesterday);
        end = new Date(start);
        end.setDate(end.getDate() + 1);
        break;
      }
      case 'this_week':
        start = startOfDay(now);
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'this_month':
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  }

  private async handleGetSalesMetrics(tenantId: string, args: any) {
    const { start, end } = this.resolvePeriod(args.period);
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('total_amount')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("cancelled", "refunded")')
      .gte('created_at', start)
      .lt('created_at', end);
    if (error) return { error: error.message };
    const revenue = (data || []).reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    return { period: args.period || 'this_month', revenue, orders: data?.length || 0 };
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
    const limit = args.limit || 5;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data, error } = await this.supabase.client
      .from('order_items')
      .select('product_name, quantity, total_amount')
      .eq('tenant_id', tenantId)
      .gte('created_at', since.toISOString());
    if (error) return { error: error.message };
    const byProduct = new Map<string, { revenue: number; units: number }>();
    for (const item of data || []) {
      const name = item.product_name || 'Sin nombre';
      const entry = byProduct.get(name) || { revenue: 0, units: 0 };
      entry.revenue += item.total_amount || 0;
      entry.units += item.quantity || 0;
      byProduct.set(name, entry);
    }
    return [...byProduct.entries()]
      .map(([product, stats]) => ({ product, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  private async handleAnalyzeCustomerSegment(tenantId: string, args: any) {
    let query = this.supabase.client
      .from('customers')
      .select(
        'first_name, last_name, email, total_orders, total_spent, customer_segment, last_order_date',
      )
      .eq('tenant_id', tenantId);
    if (args.email) {
      query = query.ilike('email', `%${args.email}%`);
    } else if (args.segment) {
      query = query.eq('customer_segment', args.segment);
    } else {
      query = query.order('total_spent', { ascending: false });
    }
    const { data, error } = await query.limit(10);
    if (error) return { error: error.message };
    return data;
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
    let query = this.supabase.client
      .from('audit_logs')
      .select('action, resource_type, description, user_email, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (args.resourceType) {
      query = query.eq('resource_type', args.resourceType);
    }
    const { data, error } = await query.limit(args.limit || 10);
    if (error) return { error: error.message };
    return data;
  }

  private async handleGetCustomers(tenantId: string, args: any) {
    let query = this.supabase.client
      .from('customers')
      .select('first_name, last_name, email, total_orders, total_spent, customer_segment')
      .eq('tenant_id', tenantId)
      .order('total_spent', { ascending: false });
    if (args.search) {
      query = query.or(
        `first_name.ilike.%${args.search}%,last_name.ilike.%${args.search}%,email.ilike.%${args.search}%`,
      );
    }
    const { data, error } = await query.limit(args.limit || 10);
    if (error) return { error: error.message };
    return data;
  }

  private async handleGetCustomerDetails(tenantId: string, args: any) {
    if (!args.email && !args.customerId) {
      return { error: 'Provide a customer email or id' };
    }
    let query = this.supabase.client
      .from('customers')
      .select('*, addresses:customer_addresses(*)')
      .eq('tenant_id', tenantId);
    if (args.customerId) query = query.eq('id', args.customerId);
    else query = query.eq('email', args.email);
    const { data: customer, error } = await query.maybeSingle();
    if (error) return { error: error.message };
    if (!customer) return { error: 'Customer not found' };
    const { data: orders } = await this.supabase.client
      .from('orders')
      .select('order_number, status, total_amount, created_at')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(5);
    return { customer, recent_orders: orders || [] };
  }

  private async handleGetReviews(tenantId: string, args: any) {
    let query = this.supabase.client
      .from('product_reviews')
      .select(
        'rating, title, review, status, created_at, customer:customers(first_name, last_name), product:products(name)',
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (args.onlyPending) query = query.eq('status', 'pending');
    if (args.maxRating) query = query.lte('rating', args.maxRating);
    const { data, error } = await query.limit(args.limit || 10);
    if (error) return { error: error.message };
    return data;
  }

  private async handleGetCouponPerformance(tenantId: string, args: any) {
    let query = this.supabase.client
      .from('discount_codes')
      .select('id, code, is_active, usage_count')
      .eq('tenant_id', tenantId)
      .order('usage_count', { ascending: false });
    if (args.onlyActive) query = query.eq('is_active', true);
    const { data: codes, error } = await query.limit(args.limit || 10);
    if (error) return { error: error.message };
    const { data: usageRows } = await this.supabase.client
      .from('discount_usage')
      .select('discount_code_id')
      .eq('tenant_id', tenantId);
    const usageMap = new Map<string, number>();
    for (const row of usageRows || []) {
      usageMap.set(row.discount_code_id, (usageMap.get(row.discount_code_id) ?? 0) + 1);
    }
    return (codes || []).map((coupon) => ({
      ...coupon,
      real_usage: usageMap.get(coupon.id) ?? coupon.usage_count ?? 0,
    }));
  }

  private async handleGetCommissionSummary(tenantId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { data, error } = await this.supabase.client
      .from('commissions')
      .select('commission_amount, status, created_at')
      .eq('tenant_id', tenantId);
    if (error) return { error: error.message };
    const rows = data || [];
    const sum = (list: typeof rows) =>
      list.reduce((acc, c) => acc + Number(c.commission_amount ?? 0), 0);
    const pending = rows.filter((c) => c.status === 'pending');
    const paid = rows.filter((c) => c.status === 'paid');
    const month = rows.filter((c) => c.created_at && c.created_at >= startOfMonth.toISOString());
    return {
      pending_count: pending.length,
      pending_amount: sum(pending),
      paid_count: paid.length,
      paid_amount: sum(paid),
      this_month_amount: sum(month),
    };
  }

  private async handleGetSubscriptionStatus(tenantId: string) {
    const { data: tenant, error } = await this.supabase.client
      .from('tenants')
      .select('plan, plan_status, subscription_ends_at')
      .eq('id', tenantId)
      .maybeSingle();
    if (error) return { error: error.message };
    const { data: history } = await this.supabase.client
      .from('subscription_history')
      .select('plan, status, amount, currency, billing_period_end, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { current: tenant, latest_billing_record: history || null };
  }

  private async handleGetTeamMembers(tenantId: string) {
    const { data, error } = await this.supabase.client
      .from('tenant_members')
      .select('user_id, role, is_active, created_at')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    if (error) return { error: error.message };
    return data;
  }

  private async handleGetOrderHistory(tenantId: string, args: any) {
    const { data: order, error: orderError } = await this.supabase.client
      .from('orders')
      .select('id, order_number, status')
      .eq('tenant_id', tenantId)
      .eq('order_number', args.orderNumber)
      .maybeSingle();
    if (orderError) return { error: orderError.message };
    if (!order) return { error: 'Order not found' };
    const { data, error } = await this.supabase.client
      .from('order_status_history')
      .select('old_status, new_status, note, customer_notified, created_at')
      .eq('tenant_id', tenantId)
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });
    if (error) return { error: error.message };
    return { order_number: order.order_number, current_status: order.status, history: data };
  }

  private async handleGetPaymentsSummary(tenantId: string, args: any) {
    const period = args.period || 'this_month';
    const { start, end } = this.resolvePeriod(period);
    const { data: payments, error } = await this.supabase.client
      .from('payments')
      .select('amount, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', start)
      .lt('created_at', end);
    if (error) return { error: error.message };
    const byStatus: Record<string, { count: number; amount: number }> = {};
    for (const payment of payments || []) {
      const status = payment.status || 'unknown';
      byStatus[status] = byStatus[status] || { count: 0, amount: 0 };
      byStatus[status].count += 1;
      byStatus[status].amount += payment.amount || 0;
    }
    const { data: refunds } = await this.supabase.client
      .from('refunds')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('created_at', start)
      .lt('created_at', end);
    const refundTotal = (refunds || []).reduce((acc, r) => acc + (r.amount || 0), 0);
    return {
      period,
      by_status: byStatus,
      refunds_count: refunds?.length || 0,
      refunds_total: refundTotal,
    };
  }

  private async handleGetInventoryMovements(tenantId: string, args: any) {
    let query = this.supabase.client
      .from('audit_logs')
      .select('action, description, created_at')
      .eq('tenant_id', tenantId)
      .in('resource_type', ['products', 'product_variants'])
      .order('created_at', { ascending: false });
    if (args.startDate) query = query.gte('created_at', args.startDate);
    const { data, error } = await query.limit(args.limit || 10);
    if (error) return { error: error.message };
    return data;
  }

  private async handleGetStoreProfile(tenantId: string) {
    const { data: tenant, error } = await this.supabase.client
      .from('tenants')
      .select(
        'business_name, contact_email, contact_phone, address_line1, address_line2, city, state, postal_code, country, subdomain, custom_domain, plan, plan_status, settings',
      )
      .eq('id', tenantId)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!tenant) return { error: 'Store not found' };
    const settings = (
      tenant.settings && typeof tenant.settings === 'object' ? tenant.settings : {}
    ) as Record<string, unknown>;
    return {
      business_name: tenant.business_name,
      contact_email: tenant.contact_email,
      contact_phone: tenant.contact_phone,
      address: {
        address_line1: tenant.address_line1,
        address_line2: tenant.address_line2,
        city: tenant.city,
        state: tenant.state,
        postal_code: tenant.postal_code,
        country: tenant.country,
      },
      subdomain: tenant.subdomain,
      custom_domain: tenant.custom_domain,
      custom_domain_status: settings['custom_domain_status'] || null,
      currency: settings['currency'] || 'USD',
      timezone: settings['timezone'] || 'America/New_York',
      plan: tenant.plan,
      plan_status: tenant.plan_status,
      seo: {
        title: settings['seo_title'] || null,
        description: settings['seo_description'] || null,
        keywords: settings['seo_keywords'] || null,
        og_image: settings['seo_og_image'] || null,
      },
    };
  }

  private async handleGetBrandingConfig(tenantId: string) {
    const { data: tenant, error } = await this.supabase.client
      .from('tenants')
      .select(
        'business_name, logo_url, favicon_url, primary_color, secondary_color, accent_color, font_family, background_color, header_color, footer_color, layout, social_links',
      )
      .eq('id', tenantId)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!tenant) return { error: 'Store not found' };
    return tenant;
  }

  private async handleGetShippingConfig(tenantId: string) {
    const { data, error } = await this.supabase.client
      .from('shipping_zones')
      .select('*, rates:shipping_rates(*)')
      .eq('tenant_id', tenantId);
    if (error) return { error: error.message };
    return data;
  }

  private async handleGetTaxConfig(tenantId: string) {
    const { data, error } = await this.supabase.client
      .from('tax_rates')
      .select('*')
      .eq('tenant_id', tenantId);
    if (error) return { error: error.message };
    return data;
  }

  private async handleGetPaymentMethods(tenantId: string) {
    const { data: tenant, error } = await this.supabase.client
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .maybeSingle();
    if (error) return { error: error.message };
    const settings = (
      tenant?.settings && typeof tenant.settings === 'object' ? tenant.settings : {}
    ) as Record<string, unknown>;
    const paymentMethods = (
      settings['payment_methods'] && typeof settings['payment_methods'] === 'object'
        ? settings['payment_methods']
        : {}
    ) as Record<string, { enabled?: boolean }>;
    const methods = Object.entries(paymentMethods).map(([method, config]) => ({
      method,
      enabled: config?.enabled ?? true,
    }));
    return {
      enabled: methods.filter((m) => m.enabled).map((m) => m.method),
      disabled: methods.filter((m) => !m.enabled).map((m) => m.method),
    };
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
      period: `${args.startDate || 'all'} to ${args.endDate || 'now'}`,
    };
  }

  private async handleGetOrders(tenantId: string, args: any) {
    let query = this.supabase.client
      .from('orders')
      .select(
        'order_number, status, total_amount, customer_first_name, customer_last_name, created_at',
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (args.status) query = query.eq('status', args.status);
    if (args.startDate) query = query.gte('created_at', args.startDate);
    if (args.customerName) {
      query = query.or(
        `customer_first_name.ilike.%${args.customerName}%,customer_last_name.ilike.%${args.customerName}%`,
      );
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
      dashboard:
        'El Dashboard muestra el resumen de ventas del mes, estados de pedidos y accesos rápidos. Está en el menú lateral.',
      products:
        'En el Catálogo de Productos puedes crear, editar y gestionar el stock. Está en el menú lateral.',
      orders: 'En Pedidos ves todos los pedidos. Puedes filtrar por estado, cliente o fecha.',
      'order-history':
        'Para ver el historial de un pedido: 1. Ve a "Pedidos". 2. Haz clic en el pedido. 3. Baja hasta la sección "Historial de estados".',
      branding: 'Puedes personalizar el logo y los colores en Ajustes -> Marca.',
      settings: 'En Ajustes gestionas la tienda, marca, impuestos y envíos.',
      reviews:
        'En Reseñas (menú lateral) puedes ver las opiniones de clientes y aprobar o rechazar las pendientes de moderación.',
      coupons:
        'En Cupones puedes crear códigos de descuento, ver cuántas veces se usó cada uno y activarlos o desactivarlos.',
      subscription:
        'En Suscripción ves tu plan actual, su estado y el historial de facturación. Ahí puedes cambiar o reactivar tu plan.',
      commissions:
        'En Comisiones ves el resumen de comisiones pendientes y pagadas de la plataforma.',
      'abandoned-carts':
        'En Carritos Abandonados ves los carritos que no se convirtieron en pedido para darles seguimiento.',
      members: 'En Miembros puedes invitar a tu equipo y gestionar sus roles.',
      inventory:
        'En Historial de Inventario ves los movimientos de stock de productos y variantes.',
      reports: 'En Reportes puedes exportar la información de ventas y pedidos.',
    };

    const topic = args.topic?.toLowerCase() || '';
    const guide = guides[topic] || Object.values(guides).join('\n\n');
    return { guide };
  }

  private async handleNavigateTo(args: any) {
    const pages: Record<string, string> = {
      dashboard: '/dashboard',
      products: '/products',
      orders: '/orders',
      customers: '/customers',
      members: '/members',
      settings: '/settings',
      reviews: '/reviews',
      coupons: '/coupons',
      subscription: '/subscription',
      commissions: '/commissions',
      inventory: '/inventory-history',
      carts: '/abandoned-carts',
      reports: '/reports',
      integrations: '/integrations',
    };

    const path = pages[args.page];
    if (path) {
      this.navigationRequest$.next(path);
      return { success: true, message: `Navigating to the ${args.page} section...` };
    }
    return { success: false, error: 'Invalid page' };
  }

  private resolveColor(input?: string): string | undefined {
    if (!input) return undefined;
    const trimmed = input.trim().toLowerCase();
    if (trimmed.startsWith('#')) {
      return trimmed;
    }
    const colorMap: Record<string, string> = {
      azul: '#2563eb',
      'azul oscuro': '#1e3a8a',
      'azul marino': '#0f172a',
      celeste: '#0ea5e9',
      sky: '#0284c7',
      rojo: '#dc2626',
      carmesi: '#b91c1c',
      verde: '#16a34a',
      esmeralda: '#059669',
      oliva: '#65a30d',
      negro: '#09090b',
      oscuro: '#09090b',
      blanco: '#ffffff',
      claro: '#ffffff',
      gris: '#64748b',
      'gris oscuro': '#334155',
      'gris claro': '#f1f5f9',
      amarillo: '#eab308',
      dorado: '#d97706',
      naranja: '#ea580c',
      morado: '#9333ea',
      purpura: '#7c3aed',
      violeta: '#8b5cf6',
      rosa: '#ec4899',
      rosado: '#f43f5e',
      marron: '#78350f',
      cafe: '#78350f',
      beige: '#f5f5dc',
      crema: '#fefce8',
    };
    if (colorMap[trimmed]) return colorMap[trimmed];
    if (trimmed.length === 6 && /^[0-9a-f]{6}$/i.test(trimmed)) return `#${trimmed}`;
    return undefined;
  }

  private resolveFont(input?: string): string | undefined {
    if (!input) return undefined;
    const trimmed = input.trim();
    const match = AVAILABLE_FONTS.find(
      (f) =>
        f.name.toLowerCase() === trimmed.toLowerCase() ||
        f.family.toLowerCase().includes(trimmed.toLowerCase()),
    );
    if (match) return match.family;
    if (trimmed.includes('sans-serif') || trimmed.includes('serif')) return trimmed;
    return `"${trimmed}", sans-serif`;
  }

  private async handleUpdateStoreDesign(
    tenantId: string,
    args: UpdateStoreDesignArgs,
  ): Promise<unknown> {
    try {
      const currentTenant = this.tenantService.currentTenant();
      const currentSettings = (currentTenant?.settings || {}) as Record<string, unknown>;

      let primaryColor = this.resolveColor(args.primaryColor);
      let secondaryColor = this.resolveColor(args.secondaryColor);
      let accentColor = this.resolveColor(args.accentColor);
      let backgroundColor = this.resolveColor(args.backgroundColor);
      let headerColor = this.resolveColor(args.headerColor);
      let footerColor = this.resolveColor(args.footerColor);
      let fontFamily = this.resolveFont(args.fontFamily);

      // Si se pasa un preset temático completo
      if (args.themePreset && THEME_PRESETS[args.themePreset as ThemePresetId]) {
        const preset = THEME_PRESETS[args.themePreset as ThemePresetId];
        primaryColor = primaryColor || preset.tokens.colors.primary;
        secondaryColor = secondaryColor || preset.tokens.colors.secondary;
        accentColor = accentColor || preset.tokens.colors.accent;
        backgroundColor = backgroundColor || preset.tokens.colors.background;
        headerColor = headerColor || preset.tokens.colors.header;
        footerColor = footerColor || preset.tokens.colors.footer;
        fontFamily = fontFamily || preset.tokens.font_heading;
      }

      const updates: Partial<Record<string, unknown>> = {};
      if (primaryColor) updates['primary_color'] = primaryColor;
      if (secondaryColor) updates['secondary_color'] = secondaryColor;
      if (accentColor) updates['accent_color'] = accentColor;
      if (backgroundColor) updates['background_color'] = backgroundColor;
      if (headerColor) updates['header_color'] = headerColor;
      if (footerColor) updates['footer_color'] = footerColor;
      if (fontFamily) updates['font_family'] = fontFamily;

      const updatedSettings: Record<string, unknown> = { ...currentSettings };
      if (args.tagline) {
        updatedSettings['tagline'] = args.tagline;
        updatedSettings['seo_title'] =
          `${args.tagline} | ${currentTenant?.business_name || 'Tienda'}`;
      }
      if (args.themePreset) {
        updatedSettings['theme_id'] = args.themePreset;
      }
      updates['settings'] = updatedSettings;

      if (args.businessName) {
        updates['business_name'] = args.businessName;
      }

      await this.tenantService.updateTenant(tenantId, updates as any);

      // Sincronizar themeTokens en store_design_state si existe borrador/publicado
      const designState = this.tenantService.storeDesignState();
      if (designState && designState.draft) {
        const updatedTokens: ThemeTokens = {
          ...designState.draft.theme_tokens,
          colors: {
            ...designState.draft.theme_tokens?.colors,
            ...(primaryColor ? { primary: primaryColor } : {}),
            ...(secondaryColor ? { secondary: secondaryColor } : {}),
            ...(accentColor ? { accent: accentColor } : {}),
            ...(backgroundColor ? { background: backgroundColor } : {}),
            ...(headerColor ? { header: headerColor } : {}),
            ...(footerColor ? { footer: footerColor } : {}),
          },
          ...(fontFamily ? { font_heading: fontFamily, font_body: fontFamily } : {}),
        };

        const updatedSnapshot: ThemeDesignSnapshot = {
          ...designState.draft,
          theme_tokens: updatedTokens,
        };
        await this.tenantService.saveDraft(updatedSnapshot);
        await this.tenantService.publishDesign('Ajuste de diseño aplicado con Venti AI');
      }

      this.toast.success('Diseño de tienda actualizado por Venti AI');
      return {
        success: true,
        message: 'El diseño de la tienda fue actualizado exitosamente.',
        updatedFields: updates,
      };
    } catch (err: any) {
      console.error('Error in handleUpdateStoreDesign:', err);
      return { success: false, error: err?.message || 'Error al actualizar el diseño' };
    }
  }

  private async handleUpdateStorefrontSections(
    tenantId: string,
    args: UpdateStorefrontSectionsArgs,
  ): Promise<unknown> {
    try {
      const currentLayout = this.tenantService.storefrontLayout() || { sections: [] };
      let sections: StorefrontSection[] = [...(currentLayout.sections || [])];
      const action = args.action || 'add_section';
      const sectionType = args.sectionType || 'testimonials';

      if (action === 'update_hero') {
        let hero = sections.find((s) => s.type === 'hero');
        if (!hero) {
          hero = {
            id: 'hero-main',
            type: 'hero',
            isActive: true,
            content: {
              title: args.title || 'Bienvenidos a nuestra tienda',
              subtitle: args.subtitle || 'Encuentra productos exclusivos con calidad garantizada.',
              buttonText: args.buttonText || 'Ver Catálogo',
              buttonLink: '/store/productos',
              alignment: 'center',
              compositionStyle: 'minimal-centered',
            },
          };
          sections.unshift(hero);
        } else {
          hero.content = {
            ...hero.content,
            ...(args.title ? { title: args.title } : {}),
            ...(args.subtitle ? { subtitle: args.subtitle } : {}),
            ...(args.buttonText ? { buttonText: args.buttonText } : {}),
          };
        }
      } else if (action === 'add_section') {
        const existingIdx = sections.findIndex((s) => s.type === sectionType);
        if (existingIdx >= 0) {
          sections[existingIdx].isActive = true;
          if (args.title) (sections[existingIdx].content as any).title = args.title;
          if (args.subtitle) (sections[existingIdx].content as any).subtitle = args.subtitle;
        } else {
          let newSection: StorefrontSection;
          const sectionId = `${sectionType}-${Date.now()}`;

          switch (sectionType) {
            case 'testimonials':
              newSection = {
                id: sectionId,
                type: 'testimonials',
                isActive: true,
                content: {
                  title: args.title || 'Lo que dicen nuestros clientes',
                  subtitle: args.subtitle || 'Historias reales de personas que confían en nosotros',
                  items: [
                    {
                      id: 'test-1',
                      author: 'Valentina Restrepo',
                      role: 'Cliente verificada',
                      content:
                        'Excelente atención y los productos superaron mis expectativas. 100% recomendado.',
                      rating: 5,
                      avatar:
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
                    },
                    {
                      id: 'test-2',
                      author: 'Andrés Gómez',
                      role: 'Comprador frecuente',
                      content:
                        'El pedido llegó en tiempo récord y el empaque impecable. Volveré a comprar seguro.',
                      rating: 5,
                      avatar:
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
                    },
                    {
                      id: 'test-3',
                      author: 'Mariana Silva',
                      role: 'Cliente satisfecha',
                      content:
                        'La calidad es increíble y la experiencia de compra fue muy fluida y rápida.',
                      rating: 5,
                      avatar:
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                    },
                  ],
                },
              };
              break;

            case 'faq':
              newSection = {
                id: sectionId,
                type: 'faq',
                isActive: true,
                content: {
                  title: args.title || 'Preguntas Frecuentes',
                  subtitle:
                    args.subtitle || 'Resolvemos tus dudas habituales sobre compras y entregas',
                  items: [
                    {
                      id: 'faq-1',
                      question: '¿Cuánto tiempo tarda en llegar mi pedido?',
                      answer:
                        'Despachamos en menos de 24 horas y las entregas toman entre 1 a 3 días hábiles según tu ubicación.',
                    },
                    {
                      id: 'faq-2',
                      question: '¿Qué medios de pago aceptan?',
                      answer:
                        'Aceptamos tarjetas de crédito, débito, transferencias y pagos contra entrega según tu ciudad.',
                    },
                    {
                      id: 'faq-3',
                      question: '¿Puedo solicitar cambios o devoluciones?',
                      answer:
                        'Sí, tienes hasta 30 días calendario tras recibir tu producto para solicitar un cambio sin complicaciones.',
                    },
                  ],
                },
              };
              break;

            case 'offers':
              newSection = {
                id: sectionId,
                type: 'offers',
                isActive: true,
                content: {
                  title: args.title || 'Ofertas Flash de Temporada',
                  description:
                    args.subtitle ||
                    'Aprovecha descuentos de hasta el 40% en artículos seleccionados',
                  badge: 'TIEMPO LIMITADO',
                  discountBadge: 'HASTA -40%',
                  buttonText: args.buttonText || 'Ver Ofertas',
                  buttonLink: '/store/productos',
                },
              };
              break;

            case 'newsletter':
              newSection = {
                id: sectionId,
                type: 'newsletter',
                isActive: true,
                content: {
                  title: args.title || 'Únete a nuestra comunidad exclusiva',
                  description:
                    args.subtitle ||
                    'Recibe ofertas relámpago, cupones de bienvenida y nuevos lanzamientos.',
                  buttonText: args.buttonText || 'Suscribirme',
                  disclaimer: 'Cero spam. Puedes cancelar tu suscripción en cualquier momento.',
                },
              };
              break;

            case 'about_us':
              newSection = {
                id: sectionId,
                type: 'about_us',
                isActive: true,
                content: {
                  badge: 'Nuestra Historia',
                  title: args.title || `Conoce nuestra marca`,
                  story:
                    args.subtitle ||
                    'Nos apasiona ofrecer productos innovadores de la más alta calidad para enriquecer tu día a día.',
                  highlightText:
                    'Calidad superior, compromiso con el cliente y entrega garantizada.',
                  layout: 'split',
                },
              };
              break;

            case 'benefits':
              newSection = {
                id: sectionId,
                type: 'benefits',
                isActive: true,
                content: {
                  title: args.title || '¿Por qué elegirnos?',
                  subtitle: args.subtitle || 'Comprometidos con tu tranquilidad',
                  columns: 3,
                  items: [
                    {
                      id: 'b-1',
                      icon: 'truck',
                      title: 'Envíos Rápidos',
                      description: 'Despacho seguro en 24-48h',
                    },
                    {
                      id: 'b-2',
                      icon: 'shield',
                      title: 'Garantía Total',
                      description: 'Productos 100% originales',
                    },
                    {
                      id: 'b-3',
                      icon: 'heartHandshake',
                      title: 'Soporte Dedicado',
                      description: 'Atención personalizada vía chat',
                    },
                  ],
                },
              };
              break;

            default:
              newSection = {
                id: sectionId,
                type: sectionType as any,
                isActive: true,
                content: {
                  title: args.title || `Sección ${sectionType}`,
                  subtitle: args.subtitle || '',
                },
              };
              break;
          }

          sections.push(newSection);
        }
      } else if (action === 'remove_section') {
        sections = sections.filter((s) => s.type !== sectionType && s.id !== sectionType);
      } else if (action === 'toggle_section') {
        const target = sections.find((s) => s.type === sectionType || s.id === sectionType);
        if (target) {
          target.isActive = !target.isActive;
        }
      }

      await this.tenantService.updateStorefrontLayout({ ...currentLayout, sections });

      // Guardar también en borrador y publicar si existe storeDesignState
      const designState = this.tenantService.storeDesignState();
      if (designState && designState.draft) {
        const updatedSnapshot: ThemeDesignSnapshot = {
          ...designState.draft,
          storefront_layout: { sections },
        };
        await this.tenantService.saveDraft(updatedSnapshot);
        await this.tenantService.publishDesign('Estructura de tienda actualizada con Venti AI');
      }

      this.toast.success('Estructura de tienda actualizada por Venti AI');
      return {
        success: true,
        action,
        sectionType,
        totalSections: sections.length,
        message: 'La estructura y secciones de la tienda fueron actualizadas.',
      };
    } catch (err: any) {
      console.error('Error in handleUpdateStorefrontSections:', err);
      return { success: false, error: err?.message || 'Error al actualizar las secciones' };
    }
  }
}
