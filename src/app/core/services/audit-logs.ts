import { inject, Injectable } from '@angular/core';
import { AuditLog } from '@core/models';
import { Supabase } from './supabase';
import { TenantService } from './tenant';

@Injectable({
  providedIn: 'root',
})
export class AuditLogsService {
  private readonly supabase = inject(Supabase);
  private readonly tenantService = inject(TenantService);

  async getRecent(limit = 8): Promise<AuditLog[]> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return [];

    const { data, error } = await this.supabase.client
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as unknown as AuditLog[];
  }
}