import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  description?: string | null;
  subject: string;
  body_html: string;
  body_text?: string | null;
  available_variables?: Record<string, unknown> | null;
  is_active?: boolean;
}

export interface SendEmailOptions {
  to: string;
  templateKey?: string;
  variables?: Record<string, string | number>;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  fromName?: string;
  customerId?: string;
  orderId?: string;
}

export interface SendEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
  devMode?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private readonly supabase = inject(Supabase);
  private readonly tenantService = inject(TenantService);

  /**
   * Obtiene todas las plantillas del tenant actual para gestión o configuración
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return [];

    const { data, error } = await this.supabase.client
      .from('email_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }

    return (data as EmailTemplate[]) || [];
  }

  /**
   * Obtiene una plantilla específica por su clave única
   */
  async getTemplate(key: string): Promise<EmailTemplate | null> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return null;

    const { data, error } = await this.supabase.client
      .from('email_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('template_key', key)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching email template:', error);
      return null;
    }

    return (data as EmailTemplate) || null;
  }

  /**
   * Actualiza el asunto, contenido HTML o estado de una plantilla
   */
  async updateTemplate(
    id: string,
    updates: Partial<Pick<EmailTemplate, 'subject' | 'body_html' | 'body_text' | 'is_active'>>
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.client
      .from('email_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /**
   * Envía un correo invocando la Edge Function unificada send-email
   */
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) {
      return { success: false, error: 'No tenant selected' };
    }

    const payload = {
      tenant_id: tenantId,
      to_email: options.to,
      template_key: options.templateKey,
      variables: options.variables ?? {},
      subject: options.subject,
      body_html: options.bodyHtml,
      body_text: options.bodyText,
      from_name: options.fromName,
      related_customer_id: options.customerId,
      related_order_id: options.orderId,
    };

    try {
      const { data, error } = await this.supabase.client.functions.invoke('send-email', {
        body: payload,
      });

      if (error) {
        console.error('Error invoking send-email Edge Function:', error);
        return { success: false, error: error.message || 'Error sending email' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Email delivery failed' };
      }

      return {
        success: true,
        emailId: data.email_id,
        devMode: data.dev_mode,
      };
    } catch (err) {
      console.error('Unexpected error sending email:', err);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Atajo para enviar confirmación de pedido
   */
  async sendOrderConfirmation(params: {
    to: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    totalFormatted?: string;
    storeName?: string;
    extraVariables?: Record<string, string | number>;
  }): Promise<SendEmailResult> {
    return this.sendEmail({
      to: params.to,
      templateKey: 'order_confirmation',
      orderId: params.orderId,
      variables: {
        order_number: params.orderNumber,
        customer_name: params.customerName,
        total: params.totalFormatted ?? '',
        store_name: params.storeName ?? '',
        ...(params.extraVariables ?? {}),
      },
    });
  }

  /**
   * Atajo para enviar notificación de despacho con tracking
   */
  async sendShippingNotification(params: {
    to: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    trackingNumber?: string;
    carrier?: string;
    trackingUrl?: string;
    storeName?: string;
  }): Promise<SendEmailResult> {
    return this.sendEmail({
      to: params.to,
      templateKey: 'shipping_notification',
      orderId: params.orderId,
      variables: {
        order_number: params.orderNumber,
        customer_name: params.customerName,
        tracking_number: params.trackingNumber ?? '',
        carrier: params.carrier ?? '',
        tracking_url: params.trackingUrl ?? '',
        store_name: params.storeName ?? '',
      },
    });
  }

  /**
   * Atajo para enviar correo de bienvenida a clientes del Storefront
   */
  async sendCustomerWelcome(params: {
    to: string;
    customerName: string;
    storeName?: string;
    customerId?: string;
  }): Promise<SendEmailResult> {
    return this.sendEmail({
      to: params.to,
      templateKey: 'customer_welcome',
      customerId: params.customerId,
      variables: {
        customer_name: params.customerName,
        store_name: params.storeName ?? '',
      },
    });
  }

  /**
   * Reemplazo local de variables en strings de plantilla
   */
  replacePlaceholders(content: string, variables: Record<string, string>): string {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key.replace(/[{}]/g, '')}\\s*}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }
}
