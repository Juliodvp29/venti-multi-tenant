import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '@core/services/analytics';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { ColumnDef } from '@core/types/table';
import { SalesChart } from '../dashboard/components/sales-chart/sales-chart';
import { CategoryChart } from '../dashboard/components/category-chart/category-chart';

@Component({
    selector: 'app-reports',
    imports: [CommonModule, DynamicTable, SalesChart, CategoryChart],
    templateUrl: './reports.html',
    styleUrl: './reports.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reports {
    private readonly analytics = inject(AnalyticsService);
    private readonly tenantService = inject(TenantService);
    private readonly toast = inject(ToastService);

    readonly isLoading = signal(false);
    readonly topProducts = signal<any[]>([]);
    readonly dailySummary = signal<any[]>([]);
    readonly customerLtv = signal<any[]>([]);

    // Chart Signals
    readonly salesSeries = signal<any[]>([]);
    readonly salesLabels = signal<string[]>([]);
    readonly categorySeries = signal<number[]>([]);
    readonly categoryLabels = signal<string[]>([]);

    // Table Definitions
    readonly productColumns: ColumnDef<any>[] = [
        { key: 'name', label: 'Product', sortable: true },
        { key: 'purchases', label: 'Sales', sortable: true },
        { key: 'revenue', label: 'Revenue', type: 'currency', sortable: true }
    ];

    readonly customerColumns: ColumnDef<any>[] = [
        { key: 'name', label: 'Customer', sortable: true },
        { key: 'email', label: 'Email' },
        { key: 'total_orders', label: 'Orders', sortable: true },
        { key: 'total_spent', label: 'Total Spent', type: 'currency', sortable: true }
    ];

    readonly summaryColumns: ColumnDef<any>[] = [
        { key: 'date', label: 'Date', type: 'date', sortable: true },
        { key: 'total_orders', label: 'Orders', sortable: true },
        { key: 'total_revenue', label: 'Revenue', type: 'currency', sortable: true },
        { key: 'average_order_value', label: 'Average Order Value', type: 'currency', sortable: true }
    ];

    constructor() {
        effect(() => {
            const id = this.tenantService.tenantId();
            if (id) {
                this.loadReports();
            }
        });
    }

    async loadReports() {
        this.isLoading.set(true);
        try {
            const [products, categories, ltv, summary] = await Promise.all([
                this.analytics.getProductPerformance(),
                this.analytics.getSalesByCategoryBI(),
                this.analytics.getCustomerLTV(),
                this.analytics.getFullDailySalesSummary(30)
            ]);

            // Top Products
            this.topProducts.set((products as any[]).map(p => ({
                ...p,
                name: p.product?.name || 'Unknown'
            })));

            // Category Chart
            this.categorySeries.set(categories.map((c: any) => c.value));
            this.categoryLabels.set(categories.map((c: any) => c.name));

            // Customer LTV
            this.customerLtv.set(ltv);

            // Historical Summary & Sales Chart
            this.dailySummary.set(summary);

            const reversedSummary = [...summary].reverse();
            this.salesSeries.set([{
                name: 'Revenue',
                data: reversedSummary.map((s: any) => Number(s.total_revenue))
            }]);
            this.salesLabels.set(reversedSummary.map((s: any) => new Date(s.date).toLocaleDateString()));

        } catch (error) {
            console.error('Error loading BI reports:', error);
            this.toast.error('Error loading BI reports');
        } finally {
            this.isLoading.set(false);
        }
    }
}
