// Supabase Edge Function: mcp
// Implements the Model Context Protocol (MCP) server for Venti Multi-Tenant eCommerce.
// Supports:
// 1. JSON-RPC 2.0 over HTTP POST & Server-Sent Events (SSE) for Claude Desktop, Gemini CLI, Cursor, Windsurf
// 2. Direct REST endpoints (/tools/:toolName) & OpenAPI 3.1 specification for ChatGPT Actions & OpenAI Codex
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-api-key, mcp-session-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: Record<string, unknown> | Array<unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// SHA-256 hash helper
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Extract API Key from headers or query params
function extractApiKey(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const xApiKey = req.headers.get('x-api-key');
  if (xApiKey) return xApiKey.trim();

  const url = new URL(req.url);
  const queryKey = url.searchParams.get('key') || url.searchParams.get('api_key');
  if (queryKey) return queryKey.trim();

  return null;
}

// Tool definitions for MCP & OpenAPI
const ALL_TOOLS = [
  {
    name: 'get_sales_overview',
    description:
      'Obtiene resumen de ventas, volumen de pedidos y ticket promedio de la tienda en un período determinado.',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'custom'],
          description: "Período predefinido. Si es 'custom', especifica startDate y endDate.",
        },
        startDate: {
          type: 'string',
          description: 'Fecha de inicio (YYYY-MM-DD), necesaria para period=custom',
        },
        endDate: {
          type: 'string',
          description: 'Fecha de fin (YYYY-MM-DD), necesaria para period=custom',
        },
      },
    },
    scope: 'read:analytics',
  },
  {
    name: 'list_orders',
    description:
      'Lista los pedidos recientes de la tienda con filtros opcionales por estado, cliente o límite.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          description: 'Filtrar por estado del pedido',
        },
        limit: {
          type: 'integer',
          description: 'Máximo número de pedidos a devolver (1-50, por defecto 10)',
        },
        search: {
          type: 'string',
          description: 'Buscar por número de pedido (#ORD-...) o datos del cliente',
        },
      },
    },
    scope: 'read:orders',
  },
  {
    name: 'get_order_details',
    description:
      'Obtiene el detalle completo de un pedido, incluyendo los productos comprados, datos de envío y pago.',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'ID o número de pedido (ej: "ORD-00123" o UUID)',
        },
      },
      required: ['orderId'],
    },
    scope: 'read:orders',
  },
  {
    name: 'get_inventory_alerts',
    description:
      'Lista productos y variantes con bajo inventario (stock por debajo del umbral) o agotados.',
    inputSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'integer',
          description: 'Umbral de unidades para considerar stock bajo (por defecto 5)',
        },
      },
    },
    scope: 'read:inventory',
  },
  {
    name: 'list_products',
    description:
      'Busca y consulta productos del catálogo de la tienda, con precios, stock y categorías.',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Texto para buscar por nombre o descripción',
        },
        limit: {
          type: 'integer',
          description: 'Máximo de productos a devolver (por defecto 15)',
        },
      },
    },
    scope: 'read:products',
  },
  {
    name: 'list_top_customers',
    description:
      'Obtiene los mejores clientes de la tienda según su gasto acumulado o número de pedidos.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Número de clientes a retornar (máximo 25, por defecto 10)',
        },
        search: {
          type: 'string',
          description: 'Buscar por nombre o correo de cliente',
        },
      },
    },
    scope: 'read:customers',
  },
  {
    name: 'get_store_summary',
    description:
      'Obtiene la información general de la tienda: nombre, moneda, total de productos, pedidos pendientes y configuración básica.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    scope: 'read:analytics',
  },
];

// Helper to calculate date ranges
function getDateRange(
  period = 'today',
  startDate?: string,
  endDate?: string,
): { start: string; end: string } {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy.toISOString();
  };
  const endOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy.toISOString();
  };

  if (period === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
  }
  if (period === 'last_7_days') {
    const past = new Date(now);
    past.setDate(past.getDate() - 7);
    return { start: startOfDay(past), end: now.toISOString() };
  }
  if (period === 'last_30_days') {
    const past = new Date(now);
    past.setDate(past.getDate() - 30);
    return { start: startOfDay(past), end: now.toISOString() };
  }
  if (period === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: startOfDay(firstDay), end: now.toISOString() };
  }
  if (period === 'custom' && startDate) {
    const s = new Date(startDate);
    const e = endDate ? new Date(endDate) : now;
    return { start: startOfDay(s), end: endOfDay(e) };
  }
  // Default: today
  return { start: startOfDay(now), end: now.toISOString() };
}

// Generate OpenAPI 3.1 specification for ChatGPT Actions & OpenAPI clients
function generateOpenApiSpec(baseUrl: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Venti Store API',
      version: '1.0.0',
      description:
        'API oficial de Venti para conectar agentes de IA (ChatGPT Custom GPTs, OpenAI Codex, Gemini) con datos de pedidos, inventario, productos y ventas de tu tienda.',
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/tools/get_sales_overview': {
        post: {
          summary: 'Obtener resumen de ventas',
          description:
            'Calcula volumen de ventas, ingresos totales y ticket promedio según período (today, yesterday, last_7_days, last_30_days, this_month).',
          operationId: 'getSalesOverview',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    period: {
                      type: 'string',
                      enum: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month'],
                      default: 'today',
                    },
                    startDate: { type: 'string', description: 'YYYY-MM-DD' },
                    endDate: { type: 'string', description: 'YYYY-MM-DD' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Resumen de ventas obtenido exitosamente',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/tools/list_orders': {
        post: {
          summary: 'Listar pedidos recientes',
          description:
            'Consulta los pedidos recientes con filtros opcionales de estado o búsqueda.',
          operationId: 'listOrders',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
                    },
                    limit: { type: 'integer', default: 10 },
                    search: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Lista de pedidos',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/tools/get_order_details': {
        post: {
          summary: 'Detalle de un pedido',
          description:
            'Obtiene los productos, total, comprador y estado de entrega de una orden específica.',
          operationId: 'getOrderDetails',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['orderId'],
                  properties: {
                    orderId: { type: 'string', description: 'Número de orden (#ORD-...) o ID' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Detalle del pedido',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/tools/get_inventory_alerts': {
        post: {
          summary: 'Alertas de inventario y stock bajo',
          description:
            'Lista productos y variantes con existencias agotadas o inferiores al umbral mínimo.',
          operationId: 'getInventoryAlerts',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    threshold: { type: 'integer', default: 5 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Productos y variantes con stock bajo',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/tools/list_products': {
        post: {
          summary: 'Buscar y listar productos',
          description: 'Consulta el catálogo de productos disponibles, precios y existencias.',
          operationId: 'listProducts',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    search: { type: 'string', description: 'Término de búsqueda' },
                    limit: { type: 'integer', default: 15 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Lista de productos',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/tools/list_top_customers': {
        post: {
          summary: 'Listar mejores clientes',
          description:
            'Obtiene los clientes con mayor volumen de compras o gasto total en la tienda.',
          operationId: 'listTopCustomers',
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    limit: { type: 'integer', default: 10 },
                    search: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ranking de clientes',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/tools/get_store_summary': {
        post: {
          summary: 'Resumen y diagnóstico de la tienda',
          description:
            'Información general, moneda, conteo de productos activos y pedidos por despachar.',
          operationId: 'getStoreSummary',
          responses: {
            '200': {
              description: 'Diagnóstico general de la tienda',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Clave MCP generada en el panel de Venti (ej: vnt_mcp_live_...)',
        },
      },
    },
    security: [{ BearerAuth: [] }],
  };
}

// Business logic for executing tools
async function executeTool(
  toolName: string,
  toolArgs: Record<string, any>,
  tenantId: string,
  adminClient: any,
): Promise<any> {
  if (toolName === 'get_sales_overview') {
    const { start, end } = getDateRange(toolArgs.period, toolArgs.startDate, toolArgs.endDate);
    const { data: orders, error } = await adminClient
      .from('orders')
      .select('id, order_number, total_amount, currency, status, payment_status, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', start)
      .lte('created_at', end)
      .neq('status', 'cancelled');

    if (error) throw error;

    const totalRevenue = (orders || []).reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
    const totalOrders = orders?.length || 0;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const currency = orders?.[0]?.currency || 'COP';

    const statusCount: Record<string, number> = {};
    orders?.forEach((o) => {
      statusCount[o.status] = (statusCount[o.status] || 0) + 1;
    });

    return {
      period: toolArgs.period || 'today',
      date_range: { start, end },
      currency,
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      average_order_value: Math.round(aov * 100) / 100,
      orders_by_status: statusCount,
    };
  }

  if (toolName === 'list_orders') {
    const limit = Math.min(Math.max(Number(toolArgs.limit) || 10, 1), 50);
    let query = adminClient
      .from('orders')
      .select(
        'id, order_number, total_amount, currency, status, payment_status, customer_first_name, customer_last_name, customer_email, created_at',
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (toolArgs.status) {
      query = query.eq('status', toolArgs.status);
    }
    if (toolArgs.search) {
      const term = `%${toolArgs.search}%`;
      query = query.or(
        `order_number.ilike.${term},customer_first_name.ilike.${term},customer_last_name.ilike.${term},customer_email.ilike.${term}`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return { total_returned: data?.length || 0, orders: data || [] };
  }

  if (toolName === 'get_order_details') {
    const idOrNumber = String(toolArgs.orderId || '').trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);

    let orderQuery = adminClient.from('orders').select('*').eq('tenant_id', tenantId);

    if (isUuid) {
      orderQuery = orderQuery.eq('id', idOrNumber);
    } else {
      orderQuery = orderQuery.or(`order_number.eq.${idOrNumber},order_number.eq.#${idOrNumber}`);
    }

    const { data: order, error: orderErr } = await orderQuery.maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) {
      return { error: `No se encontró el pedido "${idOrNumber}"` };
    }

    const { data: items } = await adminClient
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    return {
      order,
      items: items || [],
    };
  }

  if (toolName === 'get_inventory_alerts') {
    const threshold = Number(toolArgs.threshold) ?? 5;

    const { data: products, error: prodErr } = await adminClient
      .from('products')
      .select('id, name, sku, stock_quantity, low_stock_threshold, price')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .eq('track_inventory', true)
      .lte('stock_quantity', threshold)
      .order('stock_quantity', { ascending: true })
      .limit(30);

    if (prodErr) throw prodErr;

    const { data: variants, error: varErr } = await adminClient
      .from('product_variants')
      .select('id, product_id, name, sku, stock_quantity, price, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .lte('stock_quantity', threshold)
      .order('stock_quantity', { ascending: true })
      .limit(30);

    if (varErr) throw varErr;

    return {
      threshold,
      out_of_stock_products: (products || []).filter((p) => (p.stock_quantity || 0) <= 0),
      low_stock_products: (products || []).filter((p) => (p.stock_quantity || 0) > 0),
      low_stock_variants: variants || [],
    };
  }

  if (toolName === 'list_products') {
    const limit = Math.min(Math.max(Number(toolArgs.limit) || 15, 1), 50);
    let query = adminClient
      .from('products')
      .select('id, name, slug, sku, price, compare_at_price, stock_quantity, status, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (toolArgs.search) {
      query = query.ilike('name', `%${toolArgs.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { total: data?.length || 0, products: data || [] };
  }

  if (toolName === 'list_top_customers') {
    const limit = Math.min(Math.max(Number(toolArgs.limit) || 10, 1), 25);
    let query = adminClient
      .from('customers')
      .select('id, first_name, last_name, email, phone, total_orders, total_spent')
      .eq('tenant_id', tenantId)
      .order('total_spent', { ascending: false })
      .limit(limit);

    if (toolArgs.search) {
      const term = `%${toolArgs.search}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { top_customers: data || [] };
  }

  if (toolName === 'get_store_summary') {
    const [tenantRes, prodCountRes, pendingOrdersRes, discountsCountRes] = await Promise.all([
      adminClient
        .from('tenants')
        .select('id, business_name, subdomain, created_at')
        .eq('id', tenantId)
        .single(),
      adminClient
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .is('deleted_at', null),
      adminClient
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'processing']),
      adminClient
        .from('discount_codes')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
    ]);

    return {
      store: tenantRes.data,
      active_products_count: prodCountRes.count || 0,
      pending_orders_count: pendingOrdersRes.count || 0,
      active_discounts_count: discountsCountRes.count || 0,
    };
  }

  throw new Error(`Herramienta no implementada: ${toolName}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://msjkjymlvjaliaztlbls.supabase.co';
  const baseUrl = `${supabaseUrl}/functions/v1/mcp`;

  // Public OpenAPI 3.1 schema endpoint (no auth needed for ChatGPT validator)
  if (
    req.method === 'GET' &&
    (url.pathname.endsWith('/openapi.json') ||
      url.pathname.endsWith('/openapi') ||
      url.searchParams.get('format') === 'openapi')
  ) {
    return json(generateOpenApiSpec(baseUrl));
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Configuración del servidor incompleta' }, 500);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Authentication via MCP API Key
  const rawKey = extractApiKey(req);
  if (!rawKey) {
    return json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message:
            'Autenticación requerida. Proporciona una clave MCP válida (Authorization: Bearer vnt_mcp_... o ?key=vnt_mcp_...)',
        },
      },
      401,
    );
  }

  const keyHash = await sha256(rawKey);
  const { data: tenantAuth, error: authError } = await adminClient.rpc('verify_mcp_api_key', {
    p_key_hash: keyHash,
  });

  if (authError || !tenantAuth || tenantAuth.length === 0) {
    return json(
      {
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Clave MCP no válida o revocada' },
      },
      401,
    );
  }

  const authData = tenantAuth[0];
  const tenantId = authData.tenant_id;
  const apiKeyId = authData.api_key_id;
  const grantedScopes: string[] = authData.scopes || [];

  // Filter tools matching granted scopes
  const availableTools = ALL_TOOLS.filter(
    (t) => !t.scope || grantedScopes.includes(t.scope) || grantedScopes.includes('*'),
  );

  // Handle direct REST POST to /tools/:toolName (for ChatGPT Custom GPT Actions & Codex REST API)
  if (url.pathname.includes('/tools/')) {
    const toolName = url.pathname.split('/tools/')[1].split('/')[0].split('?')[0];
    const toolDef = availableTools.find((t) => t.name === toolName);

    if (!toolDef) {
      return json({ error: `Herramienta no encontrada o no autorizada: ${toolName}` }, 404);
    }

    let toolArgs: Record<string, any> = {};
    if (req.method === 'POST') {
      try {
        toolArgs = (await req.json()) || {};
      } catch {
        toolArgs = {};
      }
    }

    const startTime = Date.now();
    let status = 'success';
    let errorMessage: string | null = null;
    let result: any;

    try {
      result = await executeTool(toolName, toolArgs, tenantId, adminClient);
    } catch (err: any) {
      status = 'error';
      errorMessage = err?.message || 'Error al ejecutar herramienta';
      result = { error: errorMessage };
    }

    const duration = Date.now() - startTime;
    void adminClient.from('mcp_audit_logs').insert({
      tenant_id: tenantId,
      api_key_id: apiKeyId,
      tool_name: toolName,
      params: toolArgs,
      status,
      execution_time_ms: duration,
      error_message: errorMessage,
    });

    return json(result, status === 'success' ? 200 : 400);
  }

  // Handle SSE (Server-Sent Events) GET request
  if (req.method === 'GET') {
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('text/event-stream') || url.pathname.endsWith('/sse')) {
      const sessionId = crypto.randomUUID();
      const bodyStream = new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          const postEndpoint = `${url.pathname}?session_id=${sessionId}&key=${encodeURIComponent(rawKey)}`;
          controller.enqueue(enc.encode(`event: endpoint\ndata: ${postEndpoint}\n\n`));
        },
      });

      return new Response(bodyStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Normal GET: status check
    return json({
      status: 'online',
      server: 'Venti MCP Server',
      tenant: authData.tenant_name,
      tools_available: availableTools.length,
      openapi_url: `${baseUrl}/openapi.json`,
    });
  }

  // Handle POST (JSON-RPC 2.0 for Claude, Cursor, Gemini CLI)
  if (req.method === 'POST') {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } }, 400);
    }

    const handleSingleRpc = async (rpc: any) => {
      const { id, method, params } = rpc || {};

      // 1. Initialize
      if (method === 'initialize') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            serverInfo: {
              name: 'venti-mcp-server',
              version: '1.0.0',
            },
            instructions: `Eres el asistente inteligente de la tienda "${authData.tenant_name}". Usa las herramientas disponibles para responder consultas sobre pedidos, ventas, inventario, productos y clientes. Siempre responde en español con formato Markdown claro y profesional.`,
          },
        };
      }

      // 2. Initialized Notification
      if (method === 'notifications/initialized') {
        return { jsonrpc: '2.0', id: null, result: {} };
      }

      // 3. Ping
      if (method === 'ping') {
        return { jsonrpc: '2.0', id, result: {} };
      }

      // 4. Tools list
      if (method === 'tools/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: availableTools.map(({ scope, ...rest }) => rest),
          },
        };
      }

      // 5. Resources list
      if (method === 'resources/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: [
              {
                uri: `venti://${authData.tenant_subdomain}/summary`,
                name: `Resumen de la tienda ${authData.tenant_name}`,
                mimeType: 'application/json',
                description: 'Datos generales y estado actual de la tienda',
              },
            ],
          },
        };
      }

      // 6. Resources read
      if (method === 'resources/read') {
        const { data: tenant } = await adminClient
          .from('tenants')
          .select('id, business_name, subdomain, created_at')
          .eq('id', tenantId)
          .single();

        return {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri: params?.uri,
                mimeType: 'application/json',
                text: JSON.stringify(tenant || {}, null, 2),
              },
            ],
          },
        };
      }

      // 7. Prompts list
      if (method === 'prompts/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            prompts: [
              {
                name: 'daily_briefing',
                description:
                  'Genera un reporte ejecutivo diario con ventas, pedidos pendientes y alertas de inventario.',
              },
              {
                name: 'inventory_health',
                description:
                  'Analiza el estado del inventario e identifica productos que requieren reposición.',
              },
            ],
          },
        };
      }

      // 8. Tool Call Execution
      if (method === 'tools/call') {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        const startTime = Date.now();

        const toolDef = availableTools.find((t) => t.name === toolName);
        if (!toolDef) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Herramienta desconocida o no autorizada: ${toolName}`,
            },
          };
        }

        let toolResult: any;
        let executionStatus = 'success';
        let errorMessage: string | null = null;

        try {
          toolResult = await executeTool(toolName, toolArgs, tenantId, adminClient);
        } catch (err: any) {
          executionStatus = 'error';
          errorMessage = err?.message || 'Error al ejecutar herramienta';
          toolResult = { error: errorMessage };
        }

        const executionDuration = Date.now() - startTime;
        void adminClient.from('mcp_audit_logs').insert({
          tenant_id: tenantId,
          api_key_id: apiKeyId,
          tool_name: toolName,
          params: toolArgs,
          status: executionStatus,
          execution_time_ms: executionDuration,
          error_message: errorMessage,
        });

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(toolResult, null, 2),
              },
            ],
          },
        };
      }

      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
    };

    if (Array.isArray(body)) {
      const results = await Promise.all(body.map(handleSingleRpc));
      return json(results);
    } else {
      const result = await handleSingleRpc(body);
      return json(result);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
});
