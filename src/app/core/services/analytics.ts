import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { AnalyticsEvent, DailySalesSummary, ProductPerformance, DailyDashboard } from '@core/models/analytics';
import { TenantService } from './tenant';

@Injectable({
    providedIn: 'root',
})
export class AnalyticsService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async logEvent(event: Partial<AnalyticsEvent>): Promise<void> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return;

        await this.supabase.client
            .from('analytics_events')
            .insert({
                ...event,
                tenant_id: tenantId,
            });
    }

    async getDailySales(days: number = 30): Promise<DailySalesSummary[]> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return [];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await this.supabase.client
            .from('daily_sales_summary')
            .select('*')
            .eq('tenant_id', tenantId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (error) {
            console.warn('Could not fetch daily sales summary:', error);
            return [];
        }
        return data as DailySalesSummary[];
    }

    async getDashboardStats(): Promise<DailyDashboard | null> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return null;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

        // Calculate stats manually since view is missing
        const [monthRes, todayRes, yesterdayRes, lastMonthRes] = await Promise.all([
            this.supabase.client.from('orders').select('total_amount').eq('tenant_id', tenantId).gte('created_at', startOfMonth).neq('status', 'cancelled').neq('status', 'refunded'),
            this.supabase.client.from('orders').select('total_amount').eq('tenant_id', tenantId).gte('created_at', startOfToday).neq('status', 'cancelled').neq('status', 'refunded'),
            this.supabase.client.from('orders').select('total_amount').eq('tenant_id', tenantId).gte('created_at', startOfYesterday).lt('created_at', startOfToday).neq('status', 'cancelled').neq('status', 'refunded'),
            this.supabase.client.from('orders').select('total_amount').eq('tenant_id', tenantId).gte('created_at', startOfLastMonth).lt('created_at', startOfMonth).neq('status', 'cancelled').neq('status', 'refunded')
        ]);

        const monthRev = (monthRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
        const todayRev = (todayRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
        const yesterdayRev = (yesterdayRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
        const lastMonthRev = (lastMonthRes.data ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);

        return {
            tenant_id: tenantId,
            today_revenue: todayRev,
            today_orders: todayRes.data?.length ?? 0,
            yesterday_revenue: yesterdayRev,
            yesterday_orders: yesterdayRes.data?.length ?? 0,
            week_revenue: 0, // Placeholder
            week_orders: 0,
            month_revenue: monthRev,
            month_orders: monthRes.data?.length ?? 0,
            last_month_revenue: lastMonthRev,
            last_month_orders: lastMonthRes.data?.length ?? 0,
            avg_order_value_30d: monthRes.data?.length ? monthRev / monthRes.data.length : 0
        };
    }

    async getProductPerformance(days: number = 30): Promise<ProductPerformance[]> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return [];

        const { data, error } = await this.supabase.client
            .from('product_performance')
            .select('*, product:products(name)')
            .eq('tenant_id', tenantId)
            .order('revenue', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data as ProductPerformance[];
    }

    async getCategoryDistribution(): Promise<{ name: string; value: number }[]> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return [];

        const { data, error } = await this.supabase.client
            .from('order_items')
            .select(`
                total_amount,
                product:products(
                    product_categories(
                        category:categories(name)
                    )
                )
            `)
            .eq('tenant_id', tenantId);

        if (error) throw error;

        const distribution: Record<string, number> = {};
        data.forEach((item: any) => {
            const categories = item.product?.product_categories || [];
            categories.forEach((pc: any) => {
                const catName = pc.category?.name || 'Uncategorized';
                distribution[catName] = (distribution[catName] || 0) + (item.total_amount || 0);
            });
        });

        return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    }
}
