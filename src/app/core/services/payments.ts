import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { Payment, Refund } from '@core/models/payment';
import { TenantService } from './tenant';
import { Database } from '../types/database.types';

@Injectable({
    providedIn: 'root',
})
export class PaymentsService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getPayments(page: number = 1, pageSize: number = 20): Promise<{ data: Payment[]; count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const { data, error, count } = await this.supabase.client
            .from('payments')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .range((page - 1) * pageSize, page * pageSize - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data: (data as unknown as Payment[]) || [], count: count ?? 0 };
    }

    async getPayment(id: string): Promise<Payment | null> {
        const { data, error } = await this.supabase.client
            .from('payments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as Payment;
    }

    async createRefund(refund: Partial<Refund>): Promise<Refund> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');
        const { data, error } = await this.supabase.client
            .from('refunds')
            .insert({
                ...refund,
                tenant_id: tenantId,
            } as unknown as Database['public']['Tables']['refunds']['Insert'])
            .select()
            .single();

        if (error) throw error;
        return data as unknown as Refund;
    }
}
