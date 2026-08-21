import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { Commission, CommissionRule, CommissionFilters, CommissionStats, CommissionStatus } from '@core/models/commission';
import { SubscriptionPlan } from '@core/enums';

@Injectable({
    providedIn: 'root',
})
export class CommissionsService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    private get tenantId(): string {
        const id = this.tenantService.tenantId();
        if (!id) throw new Error('No tenant ID found');
        return id;
    }

    async getCommissions(
        page: number = 1,
        pageSize: number = 20,
        filters?: CommissionFilters
    ): Promise<{ data: Commission[]; count: number }> {
        let query = this.supabase.client
            .from('commissions' as any)
            .select('*, payment:payments(*)', { count: 'exact' })
            .eq('tenant_id', this.tenantId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.gateway) {
            query = query.eq('gateway', filters.gateway);
        }

        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        if (filters?.search) {
            query = query.or(
                `gateway_transaction_id.ilike.%${filters.search}%,payment_id.ilike.%${filters.search}%`
            );
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data as unknown as Commission[], count: count ?? 0 };
    }

    async getCommission(id: string): Promise<Commission | null> {
        const { data, error } = await this.supabase.client
            .from('commissions' as any)
            .select('*, payment:payments(*)')
            .eq('id', id)
            .eq('tenant_id', this.tenantId)
            .maybeSingle();

        if (error) throw error;
        return data as unknown as Commission | null;
    }

    async getCommissionRules(): Promise<CommissionRule[]> {
        const { data, error } = await this.supabase.client
            .from('commission_rules' as any)
            .select('*')
            .eq('is_active', true)
            .or(`tenant_id.eq.${this.tenantId},tenant_id.is.null`)
            .order('effective_from', { ascending: false });

        if (error) throw error;

        const rules = (data as unknown as CommissionRule[]) ?? [];
        const uniqueRules = new Map<SubscriptionPlan, CommissionRule>();

        for (const rule of rules) {
            if (!uniqueRules.has(rule.plan)) {
                uniqueRules.set(rule.plan, rule);
            }
        }

        return Array.from(uniqueRules.values());
    }

    async upsertCommissionRule(rule: Partial<CommissionRule>): Promise<CommissionRule> {
        const payload = {
            ...rule,
            tenant_id: this.tenantId,
            updated_at: new Date().toISOString(),
        } as any;

        const { data, error } = await this.supabase.client
            .from('commission_rules' as any)
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        return data as unknown as CommissionRule;
    }

    async deleteCommissionRule(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('commission_rules' as any)
            .delete()
            .eq('id', id)
            .eq('tenant_id', this.tenantId);

        if (error) throw error;
    }

    async getCommissionStats(): Promise<CommissionStats> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [pendingRes, paidRes, totalRes, monthRes] = await Promise.all([
            this.supabase.client
                .from('commissions' as any)
                .select('commission_amount', { count: 'exact', head: true })
                .eq('tenant_id', this.tenantId)
                .eq('status', CommissionStatus.Pending),
            this.supabase.client
                .from('commissions' as any)
                .select('commission_amount', { count: 'exact', head: true })
                .eq('tenant_id', this.tenantId)
                .eq('status', CommissionStatus.Paid),
            this.supabase.client
                .from('commissions' as any)
                .select('commission_amount')
                .eq('tenant_id', this.tenantId),
            this.supabase.client
                .from('commissions' as any)
                .select('commission_amount')
                .eq('tenant_id', this.tenantId)
                .gte('created_at', startOfMonth),
        ]);

        const totalAmount = (totalRes.data ?? []).reduce((sum, c) => sum + Number((c as any).commission_amount ?? 0), 0);
        const thisMonthAmount = (monthRes.data ?? []).reduce((sum, c) => sum + Number((c as any).commission_amount ?? 0), 0);

        return {
            totalPending: pendingRes.count ?? 0,
            totalPaid: paidRes.count ?? 0,
            totalAmount,
            thisMonthAmount,
        };
    }

    async exportCommissions(filters?: CommissionFilters): Promise<Commission[]> {
        let query = this.supabase.client
            .from('commissions' as any)
            .select('*, payment:payments(*)')
            .eq('tenant_id', this.tenantId)
            .order('created_at', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.gateway) {
            query = query.eq('gateway', filters.gateway);
        }

        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        if (filters?.search) {
            query = query.or(
                `gateway_transaction_id.ilike.%${filters.search}%,payment_id.ilike.%${filters.search}%`
            );
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as unknown as Commission[];
    }
}