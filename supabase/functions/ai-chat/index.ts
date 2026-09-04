// Runtime: Supabase Edge Functions (Deno), checked when deployed with Supabase CLI.
// @ts-nocheck
//
// Proxy seguro hacia Gemini: la API key vive solo como secreto del proyecto
// (supabase secrets set GEMINI_API_KEY=...) y nunca viaja al navegador.
//
// El frontend envía:
//   { tenant_id, contents: [{ role, parts }], tools: [{ functionDeclarations }] }
// La función fija en servidor: modelo, systemInstruction y maxOutputTokens,
// verifica JWT + pertenencia al tenant y reenvía a Generative Language API.
//
// Despliegue:
//   supabase secrets set GEMINI_API_KEY=<nueva-key>
//   supabase functions deploy ai-chat
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Modelo permitido (allowlist fija: el cliente no puede elegir otro).
const MODEL = 'gemini-3-flash-preview';
const GEMINI_TIMEOUT_MS = 25000;
const MAX_CONTENTS = 40;
const MAX_PAYLOAD_CHARS = 24000;
const MAX_TOOLS = 30;
const MAX_OUTPUT_TOKENS = 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const buildSystemInstruction = () =>
  `Eres un asistente experto en gestión de comercio electrónico.
La fecha actual es ${new Date().toISOString()}.
Responde siempre en español.
Usa las herramientas proporcionadas para dar respuestas basadas en datos reales.
Tienes acceso a ventas, pedidos, productos, inventario, clientes, reseñas,
cupones, comisiones, pagos, suscripción, equipo, registros de auditoría
y configuración de la tienda (perfil, marca, envíos, impuestos y métodos de pago).
Si el usuario pide un reporte, resume los datos de forma profesional en formato Markdown.`;

const isValidContents = (contents: unknown): contents is Array<Record<string, unknown>> => {
  if (!Array.isArray(contents) || contents.length === 0 || contents.length > MAX_CONTENTS) {
    return false;
  }
  return contents.every((c) => {
    if (!c || typeof c !== 'object') return false;
    const role = (c as Record<string, unknown>).role;
    const parts = (c as Record<string, unknown>).parts;
    return (role === 'user' || role === 'model') && Array.isArray(parts) && parts.length > 0;
  });
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const authHeader = request.headers.get('Authorization');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Función mal configurada' }, 500);
    }
    if (!geminiApiKey) {
      return json({ error: 'Asistente IA no disponible temporalmente' }, 503);
    }
    if (!authHeader) return json({ error: 'Authentication required' }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Authentication required' }, 401);

    const body = await request.json();
    const tenantId = body?.tenant_id;
    const contents = body?.contents;
    const tools = body?.tools;

    if (typeof tenantId !== 'string' || !UUID_RE.test(tenantId)) {
      return json({ error: 'Invalid tenant' }, 400);
    }
    if (!isValidContents(contents)) {
      return json({ error: 'Historial de conversación inválido' }, 400);
    }
    if (tools !== undefined) {
      const decls = Array.isArray(tools) ? tools[0]?.functionDeclarations : undefined;
      if (
        !Array.isArray(tools) ||
        !Array.isArray(decls) ||
        decls.length === 0 ||
        decls.length > MAX_TOOLS
      ) {
        return json({ error: 'Herramientas inválidas' }, 400);
      }
    }
    if (JSON.stringify(contents).length > MAX_PAYLOAD_CHARS) {
      return json(
        { error: 'Conversación demasiado larga. Usa /clear para empezar de nuevo.' },
        413,
      );
    }

    // Pertenencia al tenant: miembro activo o propietario.
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const [memberRes, ownerRes] = await Promise.all([
      admin
        .from('tenant_members')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle(),
      admin.from('tenants').select('id').eq('id', tenantId).eq('owner_id', user.id).maybeSingle(),
    ]);
    if (memberRes.error) throw memberRes.error;
    if (ownerRes.error) throw ownerRes.error;
    if (!memberRes.data && !ownerRes.data) {
      return json({ error: 'Sin acceso a esta tienda' }, 403);
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemInstruction() }] },
          contents,
          tools,
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
        }),
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      },
    );

    if (!geminiRes.ok) {
      if (geminiRes.status === 429) {
        return json(
          { error: 'El asistente está saturado. Inténtalo de nuevo en unos segundos.' },
          429,
        );
      }
      console.error('Gemini API error:', geminiRes.status, await geminiRes.text());
      return json({ error: 'Error al generar la respuesta' }, 502);
    }

    return json(await geminiRes.json());
  } catch (error) {
    console.error('ai-chat error:', error);
    return json({ error: 'Error interno del asistente' }, 500);
  }
});
