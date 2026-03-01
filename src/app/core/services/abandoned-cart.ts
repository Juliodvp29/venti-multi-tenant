import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';

export interface AbandonedCart {
    id: string;
    customer_id: string;
    customer_email: string;
    customer_name: string;
    last_activity: string;
    items_count: number;
    total_amount: number;
    items: any[];
    session_id: string;
}

@Injectable({
    providedIn: 'root'
})
export class AbandonedCartService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getAbandonedCarts(hours: number = 2): Promise<AbandonedCart[]> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return [];

        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hours);

        // 1. Get add_to_cart events that have a customer_id
        const { data: events, error: eventsError } = await this.supabase.client
            .from('analytics_events')
            .select(`
                *,
                customer:customers(*)
            `)
            .eq('tenant_id', tenantId)
            .eq('event_type', 'add_to_cart')
            .not('customer_id', 'is', null)
            .lt('created_at', cutoffTime.toISOString())
            .order('created_at', { ascending: false });

        if (eventsError) {
            console.error('Error fetching analytics events:', eventsError);
            return [];
        }

        const typedEvents = (events || []) as any[];

        // 2. Get orders for these customers created AFTER their latest add_to_cart
        const customerIds = [...new Set(typedEvents.map((e: any) => e.customer_id))];
        const { data: orders, error: ordersError } = await this.supabase.client
            .from('orders')
            .select('customer_id, created_at')
            .eq('tenant_id', tenantId)
            .in('customer_id', customerIds);

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            return [];
        }

        const typedOrders = (orders || []) as any[];

        // 3. Filter and group
        const abandonedCarts: Map<string, AbandonedCart> = new Map();

        for (const event of typedEvents) {
            const customerId = event.customer_id;

            // Check if customer placed an order after this event
            const hasOrder = typedOrders.some((o: any) =>
                o.customer_id === customerId &&
                new Date(o.created_at) >= new Date(event.created_at)
            );

            if (hasOrder) continue;

            // If we haven't added this customer yet or this event is newer
            if (!abandonedCarts.has(customerId)) {
                const customer = event.customer;
                const itemData = event.event_data || {};

                abandonedCarts.set(customerId, {
                    id: event.id,
                    customer_id: customerId,
                    customer_email: customer?.email || 'N/A',
                    customer_name: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Desconocido',
                    last_activity: event.created_at,
                    items_count: 1, // Simplifying: count events as items or use event_data
                    total_amount: Number(itemData?.price || 0),
                    items: [itemData],
                    session_id: event.session_id
                });
            } else {
                // Aggregate items for the same customer session
                const cart = abandonedCarts.get(customerId)!;
                if (new Date(event.created_at) > new Date(cart.last_activity)) {
                    cart.last_activity = event.created_at;
                }
                const itemData = event.event_data || {};
                cart.items.push(itemData);
                cart.items_count++;
                cart.total_amount += Number(itemData?.price || 0);
            }
        }

        return Array.from(abandonedCarts.values());
    }

    async sendRecoveryEmail(cart: AbandonedCart, couponId?: string): Promise<{ success: boolean; error?: string }> {
        // Recovery email logic placeholder
        return { success: true };
    }
}
