/**
 * Sistema de Plantillas y Temas Oficiales para Venti eCommerce.
 * Proporciona 4 estilos prediseñados listos para producción:
 * 1. Venti Oficial (Azul Cielo & Moderno)
 * 2. Minimalista (Editorial & Blanco y Negro)
 * 3. Pro Corporativo (Índigo & Ejecutivo)
 * 4. Cálido & Cercano (Terracota & Retail)
 */

export type EmailThemeId = 'venti' | 'minimalist' | 'pro' | 'warm';

export interface EmailThemeMeta {
  id: EmailThemeId;
  name: string;
  badge: string;
  description: string;
  dotColor: string;
  pillClasses: string;
}

export const EMAIL_THEMES: EmailThemeMeta[] = [
  {
    id: 'venti',
    name: 'Venti Oficial',
    badge: 'Moderno',
    description: 'Degradado azul cielo, tarjetas redondeadas y estilo UI moderno.',
    dotColor: '#0284c7',
    pillClasses: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    badge: 'Editorial',
    description: 'Blanco y negro, tipografía limpia, líneas sutiles y mucho espacio.',
    dotColor: '#171717',
    pillClasses: 'border-gray-300 bg-gray-100 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
  },
  {
    id: 'pro',
    name: 'Pro Corporativo',
    badge: 'Fintech',
    description: 'Azul marino e índigo, tablas estructuradas y formato ejecutivo.',
    dotColor: '#4f46e5',
    pillClasses: 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300',
  },
  {
    id: 'warm',
    name: 'Cálido & Cercano',
    badge: 'Retail',
    description: 'Tonos terracota y ámbar, acogedor, ideal para moda, café y regalos.',
    dotColor: '#ea580c',
    pillClasses: 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
  },
];

const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// ============================================================================
// THEME 1: VENTI OFICIAL (Sky Blue Modern)
// ============================================================================
function buildVentiTemplate(tag: string, title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:${FONT_SANS};-webkit-font-smoothing:antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#0369a1 0%,#0284c7 60%,#38bdf8 100%);padding:32px 36px;">
              <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">✦ Venti Shop</div>
              <div style="font-size:13px;color:#bae6fd;margin-top:4px;font-weight:500;">{{store_name}}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 28px 36px;background-color:#ffffff;">
              <div style="display:inline-block;background-color:#e0f2fe;color:#0369a1;font-size:11px;font-weight:700;padding:4px 12px;border-radius:9999px;margin-bottom:20px;text-transform:uppercase;letter-spacing:0.5px;">${tag}</div>
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 36px;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">Este correo fue generado automáticamente por <strong>{{store_name}}</strong> a través de Venti.</p>
              <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">Si recibiste este correo por error, puedes descartarlo con tranquilidad.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// THEME 2: MINIMALISTA (Editorial Black & White)
// ============================================================================
function buildMinimalistTemplate(tag: string, title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:${FONT_SANS};-webkit-font-smoothing:antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;background-color:#ffffff;padding:24px 0;">
          <tr>
            <td style="padding-bottom:32px;border-bottom:1px solid #171717;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#171717;">{{store_name}}</td>
                  <td align="right" style="font-size:11px;color:#737373;letter-spacing:1px;text-transform:uppercase;">${tag}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 0 32px 0;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;border-top:1px solid #e5e5e5;text-align:left;">
              <p style="margin:0;font-size:11px;color:#737373;line-height:1.7;letter-spacing:0.3px;">
                Notificación oficial de <strong>{{store_name}}</strong> · Enviado mediante tecnología Venti Commerce.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// THEME 3: PRO CORPORATIVO (Fintech & Indigo Executive)
// ============================================================================
function buildProTemplate(tag: string, title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:${FONT_SANS};-webkit-font-smoothing:antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.25);border-top:4px solid #6366f1;">
          <tr>
            <td style="background-color:#1e293b;padding:24px 36px;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:#334155;color:#e2e8f0;font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;letter-spacing:0.5px;text-transform:uppercase;">Venti Enterprise</span>
                    <div style="font-size:18px;font-weight:700;color:#ffffff;margin-top:6px;">{{store_name}}</div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;letter-spacing:0.5px;">${tag}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 28px 36px;background-color:#ffffff;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="font-size:11px;color:#64748b;line-height:1.6;">
                    ID de Registro Automatizado · <strong>{{store_name}}</strong> · Plataforma Venti
                  </td>
                  <td align="right" style="font-size:11px;color:#94a3b8;">
                    Cifrado Seguro TLS
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// THEME 4: CÁLIDO & CERCANO (Warm Terracotta & Friendly Retail)
// ============================================================================
function buildWarmTemplate(tag: string, title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#fffbeb;font-family:${FONT_SANS};-webkit-font-smoothing:antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fffbeb;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(234,88,12,0.08);border:1px solid #fed7aa;">
          <tr>
            <td style="background:linear-gradient(135deg,#c2410c 0%,#ea580c 50%,#f97316 100%);padding:32px 36px;">
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">✨ {{store_name}}</div>
              <div style="font-size:13px;color:#ffedd5;margin-top:4px;">Hecho con dedicación para ti</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 28px 36px;background-color:#ffffff;">
              <div style="display:inline-block;background-color:#ffedd5;color:#c2410c;font-size:11px;font-weight:800;padding:4px 14px;border-radius:9999px;margin-bottom:20px;text-transform:uppercase;letter-spacing:0.5px;">${tag}</div>
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="background-color:#fff7ed;border-top:1px solid #fed7aa;padding:24px 36px;text-align:center;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#9a3412;">
                Gracias por apoyar a <strong>{{store_name}}</strong> ❤️
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#c2410c;">
                Enviado a través de tu tienda online en Venti
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// DICTIONARY OF TEMPLATES PER THEME
// ============================================================================
export const THEMES_CATALOG: Record<EmailThemeId, Record<string, { subject: string; body_html: string }>> = {
  // --------------------------------------------------------------------------
  // THEME: VENTI
  // --------------------------------------------------------------------------
  venti: {
    order_confirmation: {
      subject: 'Confirmación de tu compra {{order_number}} - {{store_name}}',
      body_html: buildVentiTemplate(
        '✓ Compra Confirmada',
        'Confirmación de Pedido',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">¡Gracias por tu compra, {{customer_name}}!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">Hemos recibido tu pedido con éxito y ya lo estamos alistando para despacho.</p>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;padding:20px;">
          <tr>
            <td style="padding-bottom:12px;border-bottom:1px dashed #e2e8f0;">
              <table role="presentation" width="100%"><tr><td style="font-size:13px;color:#64748b;">Número de Pedido:</td><td align="right" style="font-size:14px;font-weight:700;color:#0284c7;font-family:monospace;">{{order_number}}</td></tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px dashed #e2e8f0;">
              <table role="presentation" width="100%"><tr><td style="font-size:13px;color:#64748b;">Tienda:</td><td align="right" style="font-size:13px;font-weight:600;color:#0f172a;">{{store_name}}</td></tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;">
              <table role="presentation" width="100%"><tr><td style="font-size:14px;font-weight:700;color:#0f172a;">Total Pagado:</td><td align="right" style="font-size:18px;font-weight:800;color:#16a34a;">{{order_total}}</td></tr></table>
            </td>
          </tr>
        </table>
        <div style="text-align:center;margin:32px 0 24px;">
          <a href="{{order_url}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0284c7,#0369a1);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 12px rgba(2,132,199,0.35);">Ver Estado de mi Pedido →</a>
        </div>
        <p style="margin:0;font-size:13px;color:#64748b;text-align:center;">¿Preguntas sobre tu compra? Responde directamente a este correo.</p>
        `
      ),
    },
    shipping_notification: {
      subject: '¡Tu pedido {{order_number}} va en camino! 🚚 - {{store_name}}',
      body_html: buildVentiTemplate(
        '🚚 En Camino',
        'Pedido Despachado',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">¡Tu paquete va en camino, {{customer_name}}!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">Tu orden ya fue entregada a la empresa transportadora y viaja hacia tu dirección.</p>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;padding:20px;">
          <tr>
            <td style="padding-bottom:12px;border-bottom:1px dashed #e2e8f0;">
              <table role="presentation" width="100%"><tr><td style="font-size:13px;color:#64748b;">No. de Pedido:</td><td align="right" style="font-size:14px;font-weight:700;color:#0f172a;">{{order_number}}</td></tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px dashed #e2e8f0;">
              <table role="presentation" width="100%"><tr><td style="font-size:13px;color:#64748b;">Transportadora:</td><td align="right" style="font-size:13px;font-weight:600;color:#0284c7;">{{carrier}}</td></tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;">
              <table role="presentation" width="100%"><tr><td style="font-size:13px;color:#64748b;">Número de Guía:</td><td align="right" style="font-size:14px;font-weight:700;color:#0f172a;font-family:monospace;">{{tracking_number}}</td></tr></table>
            </td>
          </tr>
        </table>
        <div style="text-align:center;margin:32px 0 24px;">
          <a href="{{tracking_url}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0284c7,#0369a1);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 12px rgba(2,132,199,0.35);">Rastrear Envío en Vivo →</a>
        </div>
        `
      ),
    },
    customer_welcome: {
      subject: '¡Te damos la bienvenida a {{store_name}}! 🎉',
      body_html: buildVentiTemplate(
        '🎉 Bienvenido/a',
        'Bienvenida',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">¡Hola, {{customer_name}}!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">Nos emociona tenerte con nosotros en <strong>{{store_name}}</strong>. Tu cuenta está activa y lista para tus compras.</p>
        <div style="text-align:center;margin:32px 0 24px;">
          <a href="#" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0284c7,#0369a1);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">Explorar Catálogo →</a>
        </div>
        `
      ),
    },
    order_cancelled: {
      subject: 'Pedido {{order_number}} cancelado - {{store_name}}',
      body_html: buildVentiTemplate(
        'Pedido Cancelado',
        'Cancelación',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">Tu pedido fue cancelado</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;">Hola {{customer_name}}, confirmamos que el pedido {{order_number}} ha sido cancelado por: <strong>{{cancel_reason}}</strong>.</p>
        `
      ),
    },
    refund_processed: {
      subject: 'Reembolso procesado para tu pedido {{order_number}} - {{store_name}}',
      body_html: buildVentiTemplate(
        '✓ Reembolso Exitoso',
        'Reembolso',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">Tu reembolso fue procesado</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;">Hola {{customer_name}}, hemos devuelto el importe de <strong>{{refund_amount}}</strong> por concepto de {{refund_reason}}.</p>
        `
      ),
    },
    member_invitation: {
      subject: 'Has sido invitado a colaborar en {{store_name}}',
      body_html: buildVentiTemplate(
        'Equipo',
        'Invitación',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">¡Te invitaron al equipo!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;"><strong>{{invited_by_email}}</strong> te ha asignado el rol de <strong>{{role}}</strong> en {{store_name}}.</p>
        <div style="text-align:center;margin:32px 0 24px;">
          <a href="{{invite_link}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0284c7,#0369a1);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">Aceptar y Acceder →</a>
        </div>
        `
      ),
    },
    member_invitation_new_user: {
      subject: 'Únete al equipo de {{store_name}} en Venti',
      body_html: buildVentiTemplate(
        'Nueva Cuenta',
        'Registro de Colaborador',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">¡Te esperamos en el equipo!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;"><strong>{{invited_by_email}}</strong> te invitó a colaborar en {{store_name}} como <strong>{{role}}</strong>. Crea tu cuenta gratuita para comenzar.</p>
        <div style="text-align:center;margin:32px 0 24px;">
          <a href="{{invite_link}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0284c7,#0369a1);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">Crear Cuenta y Unirme →</a>
        </div>
        `
      ),
    },
  },

  // --------------------------------------------------------------------------
  // THEME: MINIMALISTA
  // --------------------------------------------------------------------------
  minimalist: {
    order_confirmation: {
      subject: 'Pedido {{order_number}} confirmado · {{store_name}}',
      body_html: buildMinimalistTemplate(
        'Confirmado',
        'Confirmación de Pedido',
        `
        <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#737373;margin-bottom:8px;">Orden de Compra</div>
        <h1 style="margin:0 0 20px;font-size:28px;font-weight:400;letter-spacing:-0.5px;color:#171717;line-height:1.2;">Gracias por tu compra, {{customer_name}}.</h1>
        <p style="margin:0 0 32px;font-size:14px;color:#525252;line-height:1.8;">Tu pedido <strong>#{{order_number}}</strong> ha sido registrado correctamente. En cuanto esté listo para despacho, recibirás los detalles del envío.</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #171717;border-bottom:1px solid #171717;margin-bottom:36px;">
          <tr>
            <td style="padding:16px 0;font-size:12px;color:#737373;letter-spacing:1px;text-transform:uppercase;">No. Pedido</td>
            <td align="right" style="padding:16px 0;font-size:14px;font-weight:600;color:#171717;">{{order_number}}</td>
          </tr>
          <tr>
            <td style="padding:16px 0;border-top:1px solid #f5f5f5;font-size:12px;color:#737373;letter-spacing:1px;text-transform:uppercase;">Importe Total</td>
            <td align="right" style="padding:16px 0;border-top:1px solid #f5f5f5;font-size:16px;font-weight:700;color:#171717;">{{order_total}}</td>
          </tr>
        </table>

        <div style="margin:36px 0;">
          <a href="{{order_url}}" target="_blank" style="display:inline-block;background-color:#171717;color:#ffffff;padding:14px 32px;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.5px;border-radius:2px;">Ver detalles del pedido</a>
        </div>
        `
      ),
    },
    shipping_notification: {
      subject: 'Tu pedido {{order_number}} ha sido despachado · {{store_name}}',
      body_html: buildMinimalistTemplate(
        'En Ruta',
        'Despacho de Pedido',
        `
        <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#737373;margin-bottom:8px;">Seguimiento de Envío</div>
        <h1 style="margin:0 0 20px;font-size:28px;font-weight:400;letter-spacing:-0.5px;color:#171717;line-height:1.2;">Tu pedido está en camino.</h1>
        <p style="margin:0 0 32px;font-size:14px;color:#525252;line-height:1.8;">Hola {{customer_name}}, tu paquete correspondiente a la orden <strong>{{order_number}}</strong> ya se encuentra en manos de {{carrier}}.</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #171717;border-bottom:1px solid #171717;margin-bottom:36px;">
          <tr>
            <td style="padding:16px 0;font-size:12px;color:#737373;letter-spacing:1px;text-transform:uppercase;">Empresa</td>
            <td align="right" style="padding:16px 0;font-size:14px;font-weight:600;color:#171717;">{{carrier}}</td>
          </tr>
          <tr>
            <td style="padding:16px 0;border-top:1px solid #f5f5f5;font-size:12px;color:#737373;letter-spacing:1px;text-transform:uppercase;">Guía de Rastreo</td>
            <td align="right" style="padding:16px 0;border-top:1px solid #f5f5f5;font-size:14px;font-weight:600;color:#171717;font-family:monospace;">{{tracking_number}}</td>
          </tr>
        </table>

        <div style="margin:36px 0;">
          <a href="{{tracking_url}}" target="_blank" style="display:inline-block;background-color:#171717;color:#ffffff;padding:14px 32px;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.5px;border-radius:2px;">Rastrear paquete</a>
        </div>
        `
      ),
    },
    customer_welcome: {
      subject: 'Bienvenido/a a {{store_name}}',
      body_html: buildMinimalistTemplate(
        'Cuenta Creada',
        'Bienvenida',
        `
        <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#737373;margin-bottom:8px;">Bienvenido</div>
        <h1 style="margin:0 0 20px;font-size:28px;font-weight:400;letter-spacing:-0.5px;color:#171717;">Nos alegra tenerte, {{customer_name}}.</h1>
        <p style="margin:0 0 32px;font-size:14px;color:#525252;line-height:1.8;">Tu perfil en {{store_name}} ha sido configurado con éxito. Ahora puedes acceder a tu historial de compras y realizar pedidos de forma simplificada.</p>
        <div style="margin:36px 0;">
          <a href="#" target="_blank" style="display:inline-block;background-color:#171717;color:#ffffff;padding:14px 32px;text-decoration:none;font-size:13px;font-weight:500;border-radius:2px;">Visitar la tienda</a>
        </div>
        `
      ),
    },
    order_cancelled: {
      subject: 'Cancelación de pedido {{order_number}} · {{store_name}}',
      body_html: buildMinimalistTemplate(
        'Cancelado',
        'Pedido Cancelado',
        `
        <h1 style="margin:0 0 20px;font-size:26px;font-weight:400;color:#171717;">Pedido cancelado</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#525252;line-height:1.8;">Hola {{customer_name}}, confirmamos la cancelación del pedido <strong>{{order_number}}</strong>.<br>Motivo: {{cancel_reason}}.</p>
        `
      ),
    },
    refund_processed: {
      subject: 'Reembolso procesado {{order_number}} · {{store_name}}',
      body_html: buildMinimalistTemplate(
        'Reembolsado',
        'Reembolso',
        `
        <h1 style="margin:0 0 20px;font-size:26px;font-weight:400;color:#171717;">Reembolso procesado</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#525252;line-height:1.8;">Hola {{customer_name}}, se ha emitido un reembolso por valor de <strong>{{refund_amount}}</strong> para el pedido {{order_number}}.</p>
        `
      ),
    },
    member_invitation: {
      subject: 'Invitación a colaborar en {{store_name}}',
      body_html: buildMinimalistTemplate(
        'Invitación',
        'Invitación',
        `
        <h1 style="margin:0 0 20px;font-size:26px;font-weight:400;color:#171717;">Invitación de equipo</h1>
        <p style="margin:0 0 32px;font-size:14px;color:#525252;line-height:1.8;">Has sido invitado por {{invited_by_email}} a unirte al equipo de {{store_name}} con el rol de <strong>{{role}}</strong>.</p>
        <div><a href="{{invite_link}}" target="_blank" style="display:inline-block;background-color:#171717;color:#ffffff;padding:14px 32px;text-decoration:none;font-size:13px;border-radius:2px;">Aceptar invitación</a></div>
        `
      ),
    },
    member_invitation_new_user: {
      subject: 'Invitación para unirte a {{store_name}}',
      body_html: buildMinimalistTemplate(
        'Registro',
        'Invitación a nuevo usuario',
        `
        <h1 style="margin:0 0 20px;font-size:26px;font-weight:400;color:#171717;">Únete a {{store_name}}</h1>
        <p style="margin:0 0 32px;font-size:14px;color:#525252;line-height:1.8;">{{invited_by_email}} te ha concedido acceso como <strong>{{role}}</strong>. Crea tu cuenta para continuar.</p>
        <div><a href="{{invite_link}}" target="_blank" style="display:inline-block;background-color:#171717;color:#ffffff;padding:14px 32px;text-decoration:none;font-size:13px;border-radius:2px;">Crear cuenta y acceder</a></div>
        `
      ),
    },
  },

  // --------------------------------------------------------------------------
  // THEME: PRO CORPORATIVO
  // --------------------------------------------------------------------------
  pro: {
    order_confirmation: {
      subject: '[PRO] Notificación de Compra {{order_number}} - {{store_name}}',
      body_html: buildProTemplate(
        'Orden Aprobada',
        'Notificación de Compra',
        `
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Transacción Confirmada</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">Estimado/a <strong>{{customer_name}}</strong>, se ha procesado satisfactoriamente el registro de su orden.</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:24px;">
          <tr style="background-color:#f1f5f9;">
            <th align="left" style="padding:10px 16px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Parámetro</th>
            <th align="right" style="padding:10px 16px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Detalle</th>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#334155;border-top:1px solid #e2e8f0;">ID de Pedido</td>
            <td align="right" style="padding:12px 16px;font-size:13px;font-weight:700;color:#0f172a;border-top:1px solid #e2e8f0;font-family:monospace;">{{order_number}}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#334155;border-top:1px solid #e2e8f0;">Organización</td>
            <td align="right" style="padding:12px 16px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;">{{store_name}}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#0f172a;border-top:1px solid #e2e8f0;">Total Liquidado</td>
            <td align="right" style="padding:12px 16px;font-size:16px;font-weight:800;color:#4f46e5;border-top:1px solid #e2e8f0;">{{order_total}}</td>
          </tr>
        </table>

        <div style="text-align:left;margin:28px 0 16px;">
          <a href="{{order_url}}" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;">Acceder al Portal de Pedidos →</a>
        </div>
        `
      ),
    },
    shipping_notification: {
      subject: '[PRO] Notificación de Despacho {{order_number}} - {{store_name}}',
      body_html: buildProTemplate(
        'En Tránsito',
        'Despacho',
        `
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Manifiesto de Envío Emitido</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;">Estimado/a {{customer_name}}, el cargamento asociado a la orden {{order_number}} se encuentra en custodia del operador logístico.</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:24px;">
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#334155;">Operador</td>
            <td align="right" style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f172a;">{{carrier}}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#334155;border-top:1px solid #e2e8f0;">Guía Oficial</td>
            <td align="right" style="padding:12px 16px;font-size:13px;font-weight:700;color:#4f46e5;border-top:1px solid #e2e8f0;font-family:monospace;">{{tracking_number}}</td>
          </tr>
        </table>

        <div style="margin:28px 0;">
          <a href="{{tracking_url}}" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;">Consultar Guía Logística →</a>
        </div>
        `
      ),
    },
    customer_welcome: {
      subject: 'Registro Corporativo Exitoso - {{store_name}}',
      body_html: buildProTemplate(
        'Cuenta Activa',
        'Bienvenida',
        `
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Bienvenido a {{store_name}}</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;">Estimado/a {{customer_name}}, sus credenciales han sido verificadas correctamente en nuestra plataforma comercial.</p>
        <a href="#" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;">Ingresar al Panel de Cliente →</a>
        `
      ),
    },
    order_cancelled: {
      subject: '[PRO] Notificación de Anulación {{order_number}} - {{store_name}}',
      body_html: buildProTemplate(
        'Anulado',
        'Cancelación',
        `
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Notificación de Anulación</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#475569;">La orden {{order_number}} ha sido cancelada. Motivo registrado: {{cancel_reason}}.</p>
        `
      ),
    },
    refund_processed: {
      subject: '[PRO] Comprobante de Devolución {{order_number}} - {{store_name}}',
      body_html: buildProTemplate(
        'Liquidado',
        'Reembolso',
        `
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Liquidación de Reembolso</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#475569;">Se ha tramitado el reembolso por {{refund_amount}} asociado al pedido {{order_number}}.</p>
        `
      ),
    },
    member_invitation: {
      subject: 'Asignación de Permisos de Acceso - {{store_name}}',
      body_html: buildProTemplate(
        'Acceso Autorizado',
        'Invitación',
        `
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Asignación de Rol</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#475569;">{{invited_by_email}} le ha conferido el nivel de privilegios <strong>{{role}}</strong> en {{store_name}}.</p>
        <a href="{{invite_link}}" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;">Autenticar y Acceder →</a>
        `
      ),
    },
    member_invitation_new_user: {
      subject: 'Invitación de Registro Corporativo - {{store_name}}',
      body_html: buildProTemplate(
        'Alta de Usuario',
        'Invitación',
        `
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Invitación de Registro</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#475569;">Ha recibido invitación para crear credenciales en {{store_name}} con el rol <strong>{{role}}</strong>.</p>
        <a href="{{invite_link}}" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;">Completar Registro →</a>
        `
      ),
    },
  },

  // --------------------------------------------------------------------------
  // THEME: CÁLIDO & CERCANO
  // --------------------------------------------------------------------------
  warm: {
    order_confirmation: {
      subject: '¡Recibimos tu pedido {{order_number}}! 🧡 - {{store_name}}',
      body_html: buildWarmTemplate(
        '¡Pedido Listo!',
        'Confirmación de Compra',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#431407;">¡Muchísimas gracias, {{customer_name}}!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#7c2d12;line-height:1.6;">Nos alegra un montón que hayas comprado con nosotros. Ya tenemos tu orden en nuestras manos y la estamos preparando con todo el cariño.</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:14px;margin-bottom:28px;padding:20px;">
          <tr>
            <td style="padding-bottom:12px;border-bottom:1px dashed #fdba74;">
              <table role="presentation" width="100%"><tr><td style="font-size:13px;color:#9a3412;">Tu Pedido:</td><td align="right" style="font-size:14px;font-weight:800;color:#c2410c;">{{order_number}}</td></tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px dashed #fdba74;">
              <table role="presentation" width="100%"><tr><td style="font-size:13px;color:#9a3412;">Tienda:</td><td align="right" style="font-size:13px;font-weight:700;color:#431407;">{{store_name}}</td></tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;">
              <table role="presentation" width="100%"><tr><td style="font-size:14px;font-weight:700;color:#431407;">Total:</td><td align="right" style="font-size:18px;font-weight:800;color:#ea580c;">{{order_total}}</td></tr></table>
            </td>
          </tr>
        </table>

        <div style="text-align:center;margin:32px 0 24px;">
          <a href="{{order_url}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#c2410c);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 4px 14px rgba(234,88,12,0.35);">Ver el Estado de mi Pedido →</a>
        </div>
        <p style="margin:0;font-size:13px;color:#9a3412;text-align:center;">Cualquier duda o comentario que tengas, responde con total confianza a este correo.</p>
        `
      ),
    },
    shipping_notification: {
      subject: '¡Tu paquete va en camino! 📦💨 - {{store_name}}',
      body_html: buildWarmTemplate(
        '¡En Camino!',
        'Despacho',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#431407;">¡Buenas noticias, {{customer_name}}!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#7c2d12;line-height:1.6;">Tu paquete correspondiente al pedido <strong>{{order_number}}</strong> ya fue recogido por la transportadora y va volando hacia ti.</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:14px;margin-bottom:28px;padding:20px;">
          <tr>
            <td style="padding-bottom:12px;border-bottom:1px dashed #fdba74;">
              <table role="presentation" width="100%"><tr><td style="font-size:13px;color:#9a3412;">Empresa:</td><td align="right" style="font-size:13px;font-weight:700;color:#c2410c;">{{carrier}}</td></tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;">
              <table role="presentation" width="100%"><tr><td style="font-size:13px;color:#9a3412;">Número de Guía:</td><td align="right" style="font-size:14px;font-weight:800;color:#431407;font-family:monospace;">{{tracking_number}}</td></tr></table>
            </td>
          </tr>
        </table>

        <div style="text-align:center;margin:32px 0 24px;">
          <a href="{{tracking_url}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#c2410c);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 4px 14px rgba(234,88,12,0.35);">Rastrear mi paquete aquí →</a>
        </div>
        `
      ),
    },
    customer_welcome: {
      subject: '¡Qué alegría tenerte con nosotros! 🧡 - {{store_name}}',
      body_html: buildWarmTemplate(
        '¡Bienvenido/a!',
        'Bienvenida',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#431407;">¡Hola {{customer_name}}, qué alegría que estés aquí!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#7c2d12;line-height:1.6;">Te damos una muy cálida bienvenida a <strong>{{store_name}}</strong>. Queremos brindarte la mejor atención y los mejores productos.</p>
        <div style="text-align:center;margin:32px 0 24px;">
          <a href="#" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#c2410c);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">Ver qué hay de nuevo →</a>
        </div>
        `
      ),
    },
    order_cancelled: {
      subject: 'Actualización sobre tu pedido {{order_number}} - {{store_name}}',
      body_html: buildWarmTemplate(
        'Pedido Cancelado',
        'Cancelación',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#431407;">Tu pedido ha sido cancelado</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#7c2d12;">Hola {{customer_name}}, te confirmamos la cancelación del pedido {{order_number}}. Si tienes alguna inquietud, estamos aquí para ti.</p>
        `
      ),
    },
    refund_processed: {
      subject: 'Reembolso confirmado para tu compra {{order_number}} - {{store_name}}',
      body_html: buildWarmTemplate(
        'Reembolso Listo',
        'Reembolso',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#431407;">Tu reembolso está en camino</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#7c2d12;">Hola {{customer_name}}, te confirmamos la devolución de <strong>{{refund_amount}}</strong> por tu pedido {{order_number}}.</p>
        `
      ),
    },
    member_invitation: {
      subject: '¡Te invitaron a ser parte de {{store_name}}! 🧡',
      body_html: buildWarmTemplate(
        'Familia de Equipo',
        'Invitación',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#431407;">¡Únete a nosotros!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#7c2d12;">{{invited_by_email}} te ha invitado a colaborar en {{store_name}} como <strong>{{role}}</strong>.</p>
        <div style="text-align:center;margin:32px 0 24px;">
          <a href="{{invite_link}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#c2410c);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">Unirme al Equipo →</a>
        </div>
        `
      ),
    },
    member_invitation_new_user: {
      subject: '¡Te esperamos en el equipo de {{store_name}}! 🧡',
      body_html: buildWarmTemplate(
        'Nuevo Miembro',
        'Invitación',
        `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#431407;">¡Qué emoción tenerte!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#7c2d12;">{{invited_by_email}} te invitó a trabajar juntos en {{store_name}} con el rol de <strong>{{role}}</strong>. Regístrate gratis para empezar.</p>
        <div style="text-align:center;margin:32px 0 24px;">
          <a href="{{invite_link}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#c2410c);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">Crear Cuenta y Entrar →</a>
        </div>
        `
      ),
    },
  },
};

/**
 * Obtiene la plantilla prediseñada para un tema y clave específicos
 */
export function getTemplateByTheme(
  themeId: EmailThemeId,
  templateKey: string
): { subject: string; body_html: string } | null {
  const theme = THEMES_CATALOG[themeId];
  if (!theme) return null;
  return theme[templateKey] || null;
}

// Retrocompatibilidad
export const VENTI_ELEGANT_TEMPLATES = THEMES_CATALOG.venti;
