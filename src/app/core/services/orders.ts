import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { Order, OrderItem, OrderStatusHistory } from '@core/models/order';
import { OrderStatus, PaymentStatus } from '@core/enums';
import { TenantService } from './tenant';

export interface OrderStats {
    totalThisMonth: number;
    pendingFulfillment: number;
    revenueToday: number;
    revenuePrevDay: number;
}

export interface OrderFilters {
    status?: OrderStatus;
    payment_status?: PaymentStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
}

@Injectable({
    providedIn: 'root',
})
export class OrdersService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getOrders(
        page: number = 1,
        pageSize: number = 20,
        filters?: OrderFilters
    ): Promise<{ data: Order[]; count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        let query = this.supabase.client
            .from('orders')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.payment_status) {
            query = query.eq('payment_status', filters.payment_status);
        }

        if (filters?.search) {
            query = query.or(
                `order_number.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,customer_first_name.ilike.%${filters.search}%,customer_last_name.ilike.%${filters.search}%`
            );
        }

        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate);
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
                status_history:order_status_history(* )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Sort status history ascending by date
        if (data?.status_history) {
            (data.status_history as OrderStatusHistory[]).sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        }

        return data as Order;
    }

    async getOrderStats(): Promise<OrderStats> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();

        const [monthRes, pendingRes, todayRes, yesterdayRes] = await Promise.all([
            this.supabase.client
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .gte('created_at', startOfMonth),
            this.supabase.client
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .in('status', ['pending', 'processing', 'paid']),
            this.supabase.client
                .from('orders')
                .select('total_amount')
                .eq('tenant_id', tenantId)
                .gte('created_at', startOfToday)
                .not('status', 'in', '(cancelled,refunded)'),
            this.supabase.client
                .from('orders')
                .select('total_amount')
                .eq('tenant_id', tenantId)
                .gte('created_at', startOfYesterday)
                .lt('created_at', startOfToday)
                .not('status', 'in', '(cancelled,refunded)'),
        ]);

        const revenueToday = (todayRes.data ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);
        const revenuePrevDay = (yesterdayRes.data ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);

        return {
            totalThisMonth: monthRes.count ?? 0,
            pendingFulfillment: pendingRes.count ?? 0,
            revenueToday,
            revenuePrevDay,
        };
    }

    async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<void> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const { error } = await this.supabase.client
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        // Insert history entry manually (DB trigger may also handle it)
        await this.supabase.client.from('order_status_history').insert({
            order_id: id,
            tenant_id: tenantId,
            new_status: status,
            note: note ?? null,
        });
    }

    async updatePaymentStatus(id: string, payment_status: PaymentStatus): Promise<void> {
        const { error } = await this.supabase.client
            .from('orders')
            .update({ payment_status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    }

    async updateInternalNote(id: string, note: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('orders')
            .update({ internal_note: note, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    }

    async addTrackingInfo(id: string, info: { tracking_number: string; tracking_url?: string }): Promise<void> {
        const { error } = await this.supabase.client
            .from('orders')
            .update({
                tracking_number: info.tracking_number,
                tracking_url: info.tracking_url ?? null,
                shipped_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;
    }

    async cancelOrder(id: string, reason: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('orders')
            .update({
                status: OrderStatus.Cancelled,
                cancelled_at: new Date().toISOString(),
                cancelled_reason: reason,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;
    }
}
