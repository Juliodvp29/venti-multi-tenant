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
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await this.supabase.client
            .from('daily_sales_summary')
            .select('*')
            .eq('tenant_id', tenantId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (error) throw error;
        return data as DailySalesSummary[];
    }

    async getDashboardStats(): Promise<DailyDashboard | null> {
        const tenantId = this.tenantService.tenantId();
        // Assuming a view or RPC for dashboard stats exists as in the model
        const { data, error } = await this.supabase.client
            .from('vw_dashboard_stats') // Example view name
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (error) {
            // Fallback or handle error
            return null;
        }
        return data as DailyDashboard;
    }

    async getProductPerformance(days: number = 30): Promise<ProductPerformance[]> {
        const tenantId = this.tenantService.tenantId();
        const { data, error } = await this.supabase.client
            .from('product_performance')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('revenue', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data as ProductPerformance[];
    }
}
