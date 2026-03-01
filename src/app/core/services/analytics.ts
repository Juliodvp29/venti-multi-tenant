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
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();

            // Real-time queries
            const [todayOrders, yesterdayOrders, todayCustomers, yesterdayCustomers] = await Promise.all([
                this.supabase.client.from('orders')
                    .select('total_amount')
                    .eq('tenant_id', tenantId)
                    .gte('created_at', startOfToday)
                    .neq('status', 'cancelled')
                    .neq('status', 'refunded'),
                this.supabase.client.from('orders')
                    .select('total_amount')
                    .eq('tenant_id', tenantId)
                    .gte('created_at', startOfYesterday)
                    .lt('created_at', startOfToday)
                    .neq('status', 'cancelled')
                    .neq('status', 'refunded'),
                this.supabase.client.from('customers')
                    .select('id', { count: 'exact', head: true })
                    .eq('tenant_id', tenantId)
                    .gte('created_at', startOfToday),
                this.supabase.client.from('customers')
                    .select('id', { count: 'exact', head: true })
                    .eq('tenant_id', tenantId)
                    .gte('created_at', startOfYesterday)
                    .lt('created_at', startOfToday)
            ]);

            const tOrders = todayOrders.data || [];
            const yOrders = yesterdayOrders.data || [];

            const todayRevenue = tOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
            const yesterdayRevenue = yOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

            const todayCount = tOrders.length;
            const yesterdayCount = yOrders.length;

            const todayAvg = todayCount > 0 ? todayRevenue / todayCount : 0;
            const yesterdayAvg = yesterdayCount > 0 ? yesterdayRevenue / yesterdayCount : 0;

            const tCust = todayCustomers.count || 0;
            const yCust = yesterdayCustomers.count || 0;

            // Trend calculation helper
            const calcTrend = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            return {
                today_revenue: todayRevenue,
                revenue_trend: calcTrend(todayRevenue, yesterdayRevenue),
                today_orders: todayCount,
                orders_trend: calcTrend(todayCount, yesterdayCount),
                today_avg_value: todayAvg,
                avg_value_trend: calcTrend(todayAvg, yesterdayAvg),
                today_customers: tCust,
                customers_trend: calcTrend(tCust, yCust)
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return null;
        }
    }

    async getMonthlySales() {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return new Array(12).fill(0);

        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

        const { data } = await this.supabase.client
            .from('orders')
            .select('created_at, total_amount')
            .eq('tenant_id', tenantId)
            .gte('created_at', startOfYear)
            .neq('status', 'cancelled')
            .neq('status', 'refunded');

        const monthlyData = new Array(12).fill(0);

        if (data) {
            data.forEach(order => {
                if (!order.created_at) return;
                const date = new Date(order.created_at as string);
                const month = date.getMonth(); // 0-11
                monthlyData[month] += Number(order.total_amount || 0);
            });
        }

        return monthlyData;
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
            .from('vw_product_performance_realtime')
            .select('*, product:products(name, product_images(url, is_primary))')
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
            .from('vw_daily_sales_realtime')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('date', { ascending: false })
            .limit(days);

        return data || [];
    }
}
