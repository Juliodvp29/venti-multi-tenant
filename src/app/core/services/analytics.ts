import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';

@Injectable({
    providedIn: 'root',
})
export class AnalyticsService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    /**
     * Track a generic event in the analytics_events table
     */
    async trackEvent(type: string, data: any = {}, productId?: string, categoryId?: string) {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return;

        try {
            const { error } = await this.supabase.client
                .from('analytics_events')
                .insert({
                    tenant_id: tenantId,
                    event_type: type,
                    event_data: data,
                    product_id: productId,
                    category_id: categoryId,
                    session_id: this.getSessionId(),
                    user_agent: window.navigator.userAgent,
                    page_url: window.location.href,
                });

            if (error) throw error;
        } catch (error) {
            console.warn('[AnalyticsService] Failed to track event:', error);
        }
    }

    /**
     * Tracking helper for product views
     */
    async trackProductView(productId: string) {
        return this.trackEvent('product_view', {}, productId);
    }

    /**
     * Tracking helper for add to cart actions
     */
    async trackAddToCart(productId: string, quantity: number) {
        return this.trackEvent('add_to_cart', { quantity }, productId);
    }

    /**
     * Simple session ID management (local storage based)
     */
    private getSessionId(): string {
        let sid = localStorage.getItem('venti_session_id');
        if (!sid) {
            sid = crypto.randomUUID();
            localStorage.setItem('venti_session_id', sid);
        }
        return sid;
    }

    // ── Dashboard Methods ───────────────────────────────────────

    async getDashboardStats() {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return null;

        try {
            // Fetch latest summary
            const { data } = await this.supabase.client
                .from('daily_sales_summary')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle();

            // If no dynamic summary, fallback to some counts (highly simplified)
            if (!data) {
                return {
                    today_revenue: 0,
                    month_orders: 0,
                    avg_order_value_30d: 0,
                };
            }

            return {
                today_revenue: Number(data.total_revenue),
                month_orders: Number(data.total_orders),
                avg_order_value_30d: Number(data.average_order_value),
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return null;
        }
    }

    async getDailySales(limit: number = 30) {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return [];

        const { data } = await this.supabase.client
            .from('daily_sales_summary')
            .select('date, total_revenue')
            .eq('tenant_id', tenantId)
            .order('date', { ascending: true })
            .limit(limit);

        return data || [];
    }

    async getCategoryDistribution() {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return [];

        // Highly simplified: count products per category
        const { data } = await this.supabase.client
            .from('categories')
            .select('name, products:product_categories(count)')
            .eq('tenant_id', tenantId);

        return (data || []).map((c: any) => ({
            name: c.name,
            value: c.products?.[0]?.count || 0
        }));
    }

    async getProductPerformance() {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return [];

        const { data } = await this.supabase.client
            .from('product_performance')
            .select('*, product:products(name, image_url)')
            .eq('tenant_id', tenantId)
            .order('revenue', { ascending: false })
            .limit(10);

        return data || [];
    }

    async getSalesByCategoryBI() {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return [];

        const { data } = await this.supabase.client.rpc('get_sales_by_category', {
            p_tenant_id: tenantId
        });

        // Fallback: manually aggregate if RPC isn't available
        if (!data) {
            const { data: items } = await this.supabase.client
                .from('order_items')
                .select(`
                    total_amount,
                    product:products(
                        categories(name)
                    )
                `)
                .eq('tenant_id', tenantId);

            const aggregation: Record<string, number> = {};
            (items || []).forEach((item: any) => {
                const catName = item.product?.categories?.name || 'Uncategorized';
                aggregation[catName] = (aggregation[catName] || 0) + Number(item.total_amount);
            });

            return Object.entries(aggregation).map(([name, value]) => ({ name, value }));
        }

        return data;
    }

    async getCustomerLTV() {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return [];

        const { data } = await this.supabase.client
            .from('customers')
            .select('id, first_name, last_name, email, total_orders, total_spent')
            .eq('tenant_id', tenantId)
            .order('total_spent', { ascending: false })
            .limit(50);

        return (data || []).map(c => ({
            ...c,
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Guest'
        }));
    }

    async getFullDailySalesSummary(days: number = 30) {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return [];

        const { data } = await this.supabase.client
            .from('daily_sales_summary')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('date', { ascending: false })
            .limit(days);

        return data || [];
    }
}
