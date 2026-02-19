import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { Payment, Refund } from '@core/models/payment';
import { TenantService } from './tenant';

@Injectable({
    providedIn: 'root',
})
export class PaymentsService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getPayments(
        page: number = 1,
        pageSize: number = 20,
        filters?: Record<string, any>
    ): Promise<{ data: Payment[]; count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        let query = this.supabase.client
            .from('payments')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (filters?.['order_id']) {
            query = query.eq('order_id', filters['order_id']);
        }

        if (filters?.['status']) {
            query = query.eq('status', filters['status']);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data as Payment[], count: count ?? 0 };
    }

    async getPayment(id: string): Promise<Payment | null> {
        const { data, error } = await this.supabase.client
            .from('payments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Payment;
    }

    async createRefund(refund: Partial<Refund>): Promise<Refund> {
        const tenantId = this.tenantService.tenantId();
        const { data, error } = await this.supabase.client
            .from('refunds')
            .insert({
                ...refund,
                tenant_id: tenantId,
            })
            .select()
            .single();

        if (error) throw error;
        return data as Refund;
    }
}
