import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { Order, OrderItem, OrderStatusHistory } from '@core/models/order';
import { OrderStatus, PaymentStatus } from '@core/enums';
import { TenantService } from './tenant';

@Injectable({
    providedIn: 'root',
})
export class OrdersService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getOrders(
        page: number = 1,
        pageSize: number = 20,
        filters?: Record<string, any>
    ): Promise<{ data: Order[]; count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        let query = this.supabase.client
            .from('orders')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (filters?.['status']) {
            query = query.eq('status', filters['status']);
        }

        if (filters?.['customer_id']) {
            query = query.eq('customer_id', filters['customer_id']);
        }

        if (filters?.['order_number']) {
            query = query.ilike('order_number', `%${filters['order_number']}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data as Order[], count: count ?? 0 };
    }

    async getOrder(id: string): Promise<Order | null> {
        const { data, error } = await this.supabase.client
            .from('orders')
            .select(`
        *,
        items:order_items(*),
        status_history:order_status_history(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Order;
    }

    async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        // History is handled by DB triggers in full implementations,
        // but we can manually insert if needed. 
        // Assuming DB handles it or we'll add it if requested.
    }

    async updatePaymentStatus(id: string, payment_status: PaymentStatus): Promise<void> {
        const { error } = await this.supabase.client
            .from('orders')
            .update({ payment_status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    }
}
