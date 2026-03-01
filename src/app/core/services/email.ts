import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';

export interface EmailTemplate {
    id: string;
    template_key: string;
    name: string;
    subject: string;
    body_html: string;
    body_text?: string;
    available_variables: any;
}

@Injectable({
    providedIn: 'root'
})
export class EmailService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getTemplate(key: string): Promise<EmailTemplate | null> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return null;

        const { data, error } = await this.supabase.client
            .from('email_templates')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('template_key', key)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Error fetching email template:', error);
            return null;
        }

        return data as EmailTemplate;
    }

    async sendEmail(params: {
        to: string;
        subject: string;
        bodyHtml: string;
        bodyText?: string;
        templateKey?: string;
        customerId?: string;
    }): Promise<{ success: boolean; error?: string }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return { success: false, error: 'No tenant selected' };

        this.supabase.client
            .from('email_logs')
            .insert({
                tenant_id: tenantId,
                recipient_email: params.to,
                subject: params.subject,
                template_key: params.templateKey,
                related_customer_id: params.customerId,
                status: 'sent', // Simulated sending
                sent_at: new Date().toISOString()
            })
            .then(({ error: logError }) => {
                if (logError) {
                    console.error('Error logging email (background):', logError);
                }
            });
        return { success: true };
    }

    replacePlaceholders(content: string, variables: Record<string, string>): string {
        let result = content;
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        });
        return result;
    }
}
