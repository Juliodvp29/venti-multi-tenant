import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '@core/services/analytics';
import { OrdersService } from '@core/services/orders';
import { TenantService } from '@core/services/tenant';
import { StatCard } from './components/stat-card/stat-card';
import { SalesChart } from './components/sales-chart/sales-chart';
import { CategoryChart } from './components/category-chart/category-chart';
import { TopProducts, DashboardProduct } from './components/top-products/top-products';
import { RecentTransactions, DashboardTransaction } from './components/recent-transactions/recent-transactions';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatCard,
    SalesChart,
    CategoryChart,
    TopProducts,
    RecentTransactions
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly analytics = inject(AnalyticsService);
  private readonly ordersService = inject(OrdersService);
  private readonly tenantService = inject(TenantService);

  // Stats Signals
  readonly revenueTotal = signal<number | null>(0);
  readonly ordersTotal = signal<number>(0);
  readonly avgOrderValue = signal<number>(0);
  readonly customersTotal = signal<number>(0);

  // Charts Data
  readonly salesSeries = signal<any[]>([]);

  readonly categorySeries = signal<number[]>([]);
  readonly categoryLabels = signal<string[]>([]);

  // Products & Transactions
  readonly topProducts = signal<DashboardProduct[]>([]);

  readonly recentTransactions = signal<DashboardTransaction[]>([]);

  constructor() {
    // Wait for tenant to be ready before fetching data
    effect(() => {
      const id = this.tenantService.tenantId();
      if (id) {
        this.refreshData();
      }
    });
  }

  private async refreshData() {
    await Promise.all([
      this.loadStats(),
      this.loadSalesChart(),
      this.loadCategories(),
      this.loadTopProducts(),
      this.loadRecentOrders()
    ]);
  }

  private async loadStats() {
    const stats = await this.analytics.getDashboardStats();
    if (stats) {
      this.revenueTotal.set(stats.today_revenue); // Using today's revenue for primary metric
      this.ordersTotal.set(stats.month_orders);
      this.avgOrderValue.set(stats.avg_order_value_30d);
    }
  }

  private async loadSalesChart() {
    const daily = await this.analytics.getDailySales(12); // Last 12 points
    if (daily.length > 0) {
      this.salesSeries.set([{
        name: 'Ingresos',
        data: daily.map(d => d.total_revenue)
      }]);
    }
  }

  private async loadCategories() {
    const distribution = await this.analytics.getCategoryDistribution();

    // Sort by value descending
    const sorted = distribution.sort((a, b) => b.value - a.value);

    // Take top 3 and group the rest as "Otros"
    const top = sorted.slice(0, 3);
    const others = sorted.slice(3);

    if (others.length > 0) {
      const othersTotal = others.reduce((sum, item) => sum + item.value, 0);
      top.push({ name: 'Otros', value: othersTotal });
    }

    this.categorySeries.set(top.map(d => d.value));
    this.categoryLabels.set(top.map(d => d.name));
  }

  private async loadTopProducts() {
    const performance = await this.analytics.getProductPerformance();
    this.topProducts.set(performance.map(p => ({
      id: p.product_id,
      name: p.product?.name || 'Producto',
      category: 'General',
      sales: p.purchases,
      revenue: `$${(p.revenue / 1000).toFixed(1)}k`,
      image: p.product?.image_url
    })));
  }

  private async loadRecentOrders() {
    const { data } = await this.ordersService.getOrders(1, 5);
    this.recentTransactions.set(data.map(o => {
      const first = o.customer_first_name || 'Invitado';
      const last = o.customer_last_name || '';
      const fullName = (first + ' ' + last).trim();

      return {
        id: o.order_number,
        customerName: fullName,
        customerInitial: (first?.[0] || 'I') + (last?.[0] || ''),
        product: 'Varios items',
        date: new Date(o.created_at).toLocaleDateString(),
        amount: o.total_amount,
        status: this.mapStatus(o.status)
      };
    }));
  }

  private mapStatus(status: string): 'Completed' | 'Pending' | 'Cancelled' {
    if (status === 'delivered' || status === 'shipped') return 'Completed';
    if (status === 'cancelled' || status === 'refunded') return 'Cancelled';
    return 'Pending';
  }
}
