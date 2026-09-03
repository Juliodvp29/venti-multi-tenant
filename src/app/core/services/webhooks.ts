import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { WebhookDelivery, WebhookEndpoint, WebhookEndpointSummary } from '@core/models';
import { WebhookEvent } from '@core/enums';

@Injectable({ providedIn: 'root' })
export class WebhooksService {
  private readonly supabase = inject(Supabase);
  private readonly tenantService = inject(TenantService);

  async listEndpoints(): Promise<WebhookEndpointSummary[]> {
    const tenantId = this.requireTenantId();
    const { data, error } = await (this.supabase.client.from as any)('webhook_endpoints')
      .select('id, tenant_id, url, subscribed_events, is_active, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as WebhookEndpointSummary[];
  }

  async createEndpoint(url: string, events: WebhookEvent[]): Promise<WebhookEndpoint> {
    const tenantId = this.requireTenantId();
    const secretKey = this.generateSecret();
    const { data, error } = await (this.supabase.client.from as any)('webhook_endpoints')
      .insert({
        tenant_id: tenantId,
        url: url.trim(),
        secret_key: secretKey,
        subscribed_events: events,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return data as WebhookEndpoint;
  }

  async setEndpointActive(endpointId: string, isActive: boolean): Promise<void> {
    const tenantId = this.requireTenantId();
    const { error } = await (this.supabase.client.from as any)('webhook_endpoints')
      .update({ is_active: isActive })
      .eq('id', endpointId)
      .eq('tenant_id', tenantId);
    if (error) throw error;
  }

  async deleteEndpoint(endpointId: string): Promise<void> {
    const tenantId = this.requireTenantId();
    const { error } = await (this.supabase.client.from as any)('webhook_endpoints')
      .delete()
      .eq('id', endpointId)
      .eq('tenant_id', tenantId);
    if (error) throw error;
  }

  async listDeliveries(limit = 50): Promise<WebhookDelivery[]> {
    const tenantId = this.requireTenantId();
    const { data, error } = await (this.supabase.client.from as any)('webhook_deliveries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as WebhookDelivery[];
  }

  async retryDelivery(deliveryId: string): Promise<void> {
    const tenantId = this.requireTenantId();
    const { error } = await (this.supabase.client.from as any)('webhook_deliveries')
      .update({
        status: 'pending_retry',
        next_retry_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', deliveryId)
      .eq('tenant_id', tenantId)
      .eq('status', 'failed');
    if (error) throw error;
  }

  private requireTenantId(): string {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) throw new Error('No active tenant');
    return tenantId;
  }

  private generateSecret(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return `whsec_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  }
}
