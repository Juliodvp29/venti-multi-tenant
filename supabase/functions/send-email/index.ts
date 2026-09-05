// supabase/functions/send-email/index.ts
// Deploy with: supabase functions deploy send-email
//
// Required Environment Variables (configure in Supabase Dashboard -> Settings -> Edge Functions -> Secrets):
//   RESEND_API_KEY      - Your Resend API Key (https://resend.com)
//   RESEND_FROM_EMAIL   - Optional sender address (default: onboarding@resend.dev)
//
// Automatically injected by Supabase:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendEmailPayload {
  tenant_id: string;
  to_email: string;
  template_key?: string;
  variables?: Record<string, string | number>;
  subject?: string;
  body_html?: string;
  body_text?: string;
  from_name?: string;
  related_customer_id?: string;
  related_order_id?: string;
}

const replacePlaceholders = (
  text: string,
  variables: Record<string, string | number> = {}
): string => {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    // Matches both {{key}} and {{ key }}
    const regex = new RegExp(`{{\\s*${key.replace(/[{}]/g, '')}\\s*}}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }
  return result;
};

Deno.serve(async (req: Request) => {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const configuredFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing Supabase server configuration' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let payload: SendEmailPayload;
  try {
    payload = await req.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload', details: String(err) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const {
    tenant_id,
    to_email,
    template_key,
    variables = {},
    subject: explicitSubject,
    body_html: explicitBodyHtml,
    body_text: explicitBodyText,
    from_name,
    related_customer_id,
    related_order_id,
  } = payload;

  if (!tenant_id || !to_email) {
    return new Response(
      JSON.stringify({ error: 'tenant_id and to_email are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let finalSubject = explicitSubject || '';
  let finalBodyHtml = explicitBodyHtml || '';
  let finalBodyText = explicitBodyText || '';

const VENTI_STYLES = {
  wrapper: 'background-color:#f1f5f9;padding:32px 16px;margin:0;',
  card: 'background-color:#ffffff;border-radius:16px;max-width:600px;margin:0 auto;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);',
  header: 'background:linear-gradient(135deg,#0369a1 0%,#0284c7 60%,#38bdf8 100%);padding:32px 40px;',
  headerTitle: 'color:#ffffff;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.3px;font-family:sans-serif;',
  headerSub: 'color:#bae6fd;font-size:13px;margin:6px 0 0;font-family:sans-serif;',
  body: 'padding:36px 40px;',
  h2: 'color:#0f172a;font-size:20px;font-weight:700;margin:0 0 12px;font-family:sans-serif;',
  p: 'color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px;font-family:sans-serif;',
  infoBox: 'background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:20px 0;',
  infoRow: 'display:flex;justify-content:space-between;margin-bottom:8px;',
  infoLabel: 'color:#64748b;font-size:13px;font-family:sans-serif;',
  infoValue: 'color:#0f172a;font-size:13px;font-weight:600;font-family:sans-serif;',
  btn: 'display:inline-block;background-color:#0284c7;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;font-family:sans-serif;letter-spacing:0.1px;',
  btnRow: 'margin:28px 0;',
  divider: 'border:none;border-top:1px solid #e2e8f0;margin:24px 0;',
  footer: 'background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;',
  footerText: 'color:#94a3b8;font-size:12px;font-family:sans-serif;line-height:1.6;margin:0;',
  tag: 'display:inline-block;background-color:#e0f2fe;color:#0369a1;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;font-family:sans-serif;margin-bottom:20px;',
};

const buildEmail = (tagText: string, title: string, body: string, store: string = '{{store_name}}') => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="${VENTI_STYLES.wrapper}">
  <div style="${VENTI_STYLES.card}">
    <!-- Header -->
    <div style="${VENTI_STYLES.header}">
      <p style="${VENTI_STYLES.headerTitle}">✦ Venti Shop</p>
      <p style="${VENTI_STYLES.headerSub}">${store}</p>
    </div>
    <!-- Body -->
    <div style="${VENTI_STYLES.body}">
      <span style="${VENTI_STYLES.tag}">${tagText}</span>
      ${body}
    </div>
    <!-- Footer -->
    <div style="${VENTI_STYLES.footer}">
      <p style="${VENTI_STYLES.footerText}">Este correo fue enviado automáticamente por <strong>${store}</strong> a través de Venti Shop.<br>Si no lo esperabas, puedes ignorarlo sin problema.</p>
    </div>
  </div>
</body>
</html>`;

const DEFAULT_TEMPLATES: Record<string, { subject: string; body_html: string; body_text?: string }> = {
  order_confirmation: {
    subject: 'Confirmación de tu compra - {{order_number}}',
    body_html: buildEmail('Pedido Confirmado', 'Confirmación de Compra', `
      <h2 style="${VENTI_STYLES.h2}">¡Gracias por tu compra, {{customer_name}}!</h2>
      <p style="${VENTI_STYLES.p}">Hemos recibido y confirmado tu pedido. Estamos preparándolo con cuidado para que llegue en perfectas condiciones.</p>
      <div style="${VENTI_STYLES.infoBox}">
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Número de pedido</span><span style="${VENTI_STYLES.infoValue}">{{order_number}}</span></div>
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Total pagado</span><span style="${VENTI_STYLES.infoValue}">{{order_total}}</span></div>
        <div style="margin-bottom:0;display:flex;justify-content:space-between;"><span style="${VENTI_STYLES.infoLabel}">Estado</span><span style="color:#16a34a;font-size:13px;font-weight:600;font-family:sans-serif;">✓ Confirmado</span></div>
      </div>
      <div style="${VENTI_STYLES.btnRow}">
        <a href="{{order_url}}" style="${VENTI_STYLES.btn}">Ver mi pedido →</a>
      </div>
      <p style="color:#64748b;font-size:13px;font-family:sans-serif;margin:0;">¿Tienes alguna duda? Responde este correo y te ayudaremos.</p>
    `),
  },

  shipping_notification: {
    subject: 'Tu pedido {{order_number}} va en camino 🚚',
    body_html: buildEmail('En Camino', 'Pedido Despachado', `
      <h2 style="${VENTI_STYLES.h2}">¡Tu pedido está en camino, {{customer_name}}!</h2>
      <p style="${VENTI_STYLES.p}">Tu paquete fue entregado a la empresa transportadora y está en ruta hacia tu dirección. Puedes rastrear tu envío en tiempo real.</p>
      <div style="${VENTI_STYLES.infoBox}">
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Número de pedido</span><span style="${VENTI_STYLES.infoValue}">{{order_number}}</span></div>
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Transportadora</span><span style="${VENTI_STYLES.infoValue}">{{carrier}}</span></div>
        <div style="margin-bottom:0;display:flex;justify-content:space-between;"><span style="${VENTI_STYLES.infoLabel}">Número de guía</span><span style="${VENTI_STYLES.infoValue}">{{tracking_number}}</span></div>
      </div>
      <div style="${VENTI_STYLES.btnRow}">
        <a href="{{tracking_url}}" style="${VENTI_STYLES.btn}">Rastrear mi envío →</a>
      </div>
      <p style="color:#64748b;font-size:13px;font-family:sans-serif;margin:0;">Los tiempos de entrega pueden variar según la zona de destino.</p>
    `),
  },

  customer_welcome: {
    subject: '¡Bienvenido/a a {{store_name}}! 🎉',
    body_html: buildEmail('Bienvenida', 'Bienvenido/a', `
      <h2 style="${VENTI_STYLES.h2}">¡Hola, {{customer_name}}! Nos alegra tenerte aquí.</h2>
      <p style="${VENTI_STYLES.p}">Tu cuenta ha sido creada exitosamente en <strong>{{store_name}}</strong>. Ya puedes explorar nuestro catálogo, guardar favoritos y hacer tus compras de manera rápida y segura.</p>
      <div style="background:linear-gradient(135deg,#e0f2fe,#f0f9ff);border-radius:10px;padding:20px 24px;margin:20px 0;border:1px solid #bae6fd;">
        <p style="color:#0369a1;font-size:14px;font-weight:600;margin:0;font-family:sans-serif;">✦ Tu cuenta incluye</p>
        <p style="color:#0f172a;font-size:13px;margin:8px 0 0;font-family:sans-serif;line-height:1.7;">Historial de pedidos · Direcciones guardadas · Notificaciones de despacho · Soporte prioritario</p>
      </div>
      <div style="${VENTI_STYLES.btnRow}">
        <a href="#" style="${VENTI_STYLES.btn}">Explorar la tienda →</a>
      </div>
    `),
  },

  order_cancelled: {
    subject: 'Tu pedido {{order_number}} fue cancelado',
    body_html: buildEmail('Pedido Cancelado', 'Cancelación de Pedido', `
      <h2 style="${VENTI_STYLES.h2}">Tu pedido ha sido cancelado</h2>
      <p style="${VENTI_STYLES.p}">Hola <strong>{{customer_name}}</strong>, confirmamos que el pedido <strong>{{order_number}}</strong> fue cancelado correctamente.</p>
      <div style="${VENTI_STYLES.infoBox}">
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Número de pedido</span><span style="${VENTI_STYLES.infoValue}">{{order_number}}</span></div>
        <div style="margin-bottom:0;display:flex;justify-content:space-between;"><span style="${VENTI_STYLES.infoLabel}">Motivo</span><span style="${VENTI_STYLES.infoValue}">{{cancel_reason}}</span></div>
      </div>
      <p style="${VENTI_STYLES.p}">Si realizaste algún pago, será revertido en los próximos días hábiles según tu método de pago. ¿Tienes alguna pregunta? Estamos para ayudarte.</p>
      <hr style="${VENTI_STYLES.divider}">
      <p style="color:#64748b;font-size:13px;font-family:sans-serif;margin:0;">Puedes crear un nuevo pedido cuando lo desees desde nuestra tienda.</p>
    `),
  },

  refund_processed: {
    subject: 'Reembolso procesado para el pedido {{order_number}}',
    body_html: buildEmail('Reembolso', 'Reembolso Procesado', `
      <h2 style="${VENTI_STYLES.h2}">Tu reembolso está en camino ✓</h2>
      <p style="${VENTI_STYLES.p}">Hola <strong>{{customer_name}}</strong>, hemos procesado exitosamente el reembolso para tu pedido.</p>
      <div style="${VENTI_STYLES.infoBox}">
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Número de pedido</span><span style="${VENTI_STYLES.infoValue}">{{order_number}}</span></div>
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Monto reembolsado</span><span style="color:#16a34a;font-size:13px;font-weight:700;font-family:sans-serif;">{{refund_amount}}</span></div>
        <div style="margin-bottom:0;display:flex;justify-content:space-between;"><span style="${VENTI_STYLES.infoLabel}">Motivo</span><span style="${VENTI_STYLES.infoValue}">{{refund_reason}}</span></div>
      </div>
      <p style="${VENTI_STYLES.p}">El tiempo de acreditación puede variar entre 3 y 10 días hábiles dependiendo de tu banco o método de pago.</p>
      <p style="color:#64748b;font-size:13px;font-family:sans-serif;margin:0;">Si tienes dudas sobre el estado de tu reembolso, contáctanos y te ayudaremos con mucho gusto.</p>
    `),
  },

  member_invitation: {
    subject: 'Has sido invitado a colaborar en {{store_name}}',
    body_html: buildEmail('Invitación al Equipo', 'Invitación de Colaboración', `
      <h2 style="${VENTI_STYLES.h2}">¡Te han invitado al equipo!</h2>
      <p style="${VENTI_STYLES.p}"><strong>{{invited_by_email}}</strong> te ha invitado a colaborar en la tienda <strong>{{store_name}}</strong> con el rol de <strong>{{role}}</strong>.</p>
      <div style="${VENTI_STYLES.infoBox}">
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Tienda</span><span style="${VENTI_STYLES.infoValue}">{{store_name}}</span></div>
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Invitado por</span><span style="${VENTI_STYLES.infoValue}">{{invited_by_email}}</span></div>
        <div style="margin-bottom:0;display:flex;justify-content:space-between;"><span style="${VENTI_STYLES.infoLabel}">Tu rol</span><span style="color:#0284c7;font-size:13px;font-weight:700;font-family:sans-serif;">{{role}}</span></div>
      </div>
      <div style="${VENTI_STYLES.btnRow}">
        <a href="{{invite_link}}" style="${VENTI_STYLES.btn}">Aceptar Invitación →</a>
      </div>
      <p style="color:#64748b;font-size:13px;font-family:sans-serif;margin:0;">Si no esperabas esta invitación, puedes ignorar este correo con total tranquilidad.</p>
    `),
  },

  member_invitation_new_user: {
    subject: 'Únete al equipo de {{store_name}} en Venti',
    body_html: buildEmail('Nueva Cuenta', '¡Bienvenido a Venti!', `
      <h2 style="${VENTI_STYLES.h2}">¡Te esperamos en el equipo!</h2>
      <p style="${VENTI_STYLES.p}"><strong>{{invited_by_email}}</strong> te ha invitado a unirte a la tienda <strong>{{store_name}}</strong> como <strong>{{role}}</strong>. Para empezar, crea tu cuenta gratuita en Venti.</p>
      <div style="${VENTI_STYLES.infoBox}">
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Tienda</span><span style="${VENTI_STYLES.infoValue}">{{store_name}}</span></div>
        <div style="${VENTI_STYLES.infoRow}"><span style="${VENTI_STYLES.infoLabel}">Invitado por</span><span style="${VENTI_STYLES.infoValue}">{{invited_by_email}}</span></div>
        <div style="margin-bottom:0;display:flex;justify-content:space-between;"><span style="${VENTI_STYLES.infoLabel}">Tu rol</span><span style="color:#0284c7;font-size:13px;font-weight:700;font-family:sans-serif;">{{role}}</span></div>
      </div>
      <div style="${VENTI_STYLES.btnRow}">
        <a href="{{invite_link}}" style="${VENTI_STYLES.btn}">Crear cuenta y unirme →</a>
      </div>
      <p style="color:#64748b;font-size:13px;font-family:sans-serif;margin:0;">Si no esperabas esta invitación, puedes ignorar este correo. No se creará ninguna cuenta sin tu acción.</p>
    `),
  },
};

  // 2. Resolve template from database if template_key is provided
  if (template_key) {
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('subject, body_html, body_text')
      .eq('tenant_id', tenant_id)
      .eq('template_key', template_key)
      .eq('is_active', true)
      .maybeSingle();

    if (templateError) {
      console.error(`Error querying template "${template_key}":`, templateError);
      return new Response(
        JSON.stringify({ error: 'Database error fetching email template', details: templateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (template) {
      finalSubject = template.subject || finalSubject;
      finalBodyHtml = template.body_html || finalBodyHtml;
      finalBodyText = template.body_text || finalBodyText;
    } else if (DEFAULT_TEMPLATES[template_key]) {
      finalSubject = DEFAULT_TEMPLATES[template_key].subject;
      finalBodyHtml = DEFAULT_TEMPLATES[template_key].body_html;
      finalBodyText = DEFAULT_TEMPLATES[template_key].body_text || '';
    } else if (!finalSubject || !finalBodyHtml) {
      console.warn(`Template "${template_key}" not found or inactive for tenant ${tenant_id}`);
      return new Response(
        JSON.stringify({ error: `Email template "${template_key}" not found or inactive` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  if (!finalSubject || !finalBodyHtml) {
    return new Response(
      JSON.stringify({ error: 'Email must have both a subject and an HTML body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 3. Interpolate variables
  finalSubject = replacePlaceholders(finalSubject, variables);
  finalBodyHtml = replacePlaceholders(finalBodyHtml, variables);
  if (finalBodyText) {
    finalBodyText = replacePlaceholders(finalBodyText, variables);
  }

  // Sender display configuration
  const displayName = from_name || (variables['store_name'] as string) || 'Venti Shop';
  const fromHeader = `${displayName} <${configuredFromEmail}>`;

  // 4. Send via Resend or Fallback (Development Mode)
  let emailId: string | null = null;
  let isSuccess = false;
  let errorMessage: string | null = null;

  if (!resendApiKey) {
    console.warn('⚠️ [DEV MODE] No RESEND_API_KEY configured. Simulating email dispatch:');
    console.warn(`  To: ${to_email}`);
    console.warn(`  Subject: ${finalSubject}`);
    console.warn(`  Template: ${template_key ?? 'Custom'}`);
    console.warn(`  Variables:`, variables);

    emailId = `dev-simulated-${crypto.randomUUID()}`;
    isSuccess = true;
  } else {
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromHeader,
          to: [to_email],
          subject: finalSubject,
          html: finalBodyHtml,
          text: finalBodyText || undefined,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error('Resend API error response:', errorText);
        errorMessage = `Resend error (${resendResponse.status}): ${errorText}`;
      } else {
        const resendData = await resendResponse.json();
        emailId = resendData.id;
        isSuccess = true;
      }
    } catch (sendError) {
      console.error('Exception calling Resend API:', sendError);
      errorMessage = String(sendError);
    }
  }

  // 5. Audit Logging to email_logs
  try {
    await supabase.from('email_logs').insert({
      tenant_id,
      template_key: template_key ?? null,
      recipient_email: to_email,
      subject: finalSubject,
      status: isSuccess ? 'sent' : 'failed',
      provider: 'resend',
      provider_message_id: emailId,
      error_message: errorMessage,
      related_customer_id: related_customer_id ?? null,
      related_order_id: related_order_id ?? null,
      sent_at: isSuccess ? new Date().toISOString() : null,
    });
  } catch (logError) {
    console.error('Error recording email log to database:', logError);
  }

  // 6. Return response
  if (!isSuccess) {
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      email_id: emailId,
      dev_mode: !resendApiKey,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
