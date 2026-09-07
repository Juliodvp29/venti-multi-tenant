import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '@core/services/analytics';
import { OrdersService } from '@core/services/orders';
import { TenantService } from '@core/services/tenant';
import { OnboardingService } from '@core/services/onboarding.service';
import { OnboardingWizard } from './components/onboarding-wizard/onboarding-wizard';
import { StatCard } from './components/stat-card/stat-card';
import { SalesChart } from './components/sales-chart/sales-chart';
import { CategoryChart } from './components/category-chart/category-chart';
import { TopProducts, DashboardProduct } from './components/top-products/top-products';
import {
  RecentTransactions,
  DashboardTransaction,
} from './components/recent-transactions/recent-transactions';
import { AiStoreWizardModal } from '@features/ai-store-wizard/ai-store-wizard-modal';
import { AiStoreWizardService } from '@core/services/ai-store-wizard.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    StatCard,
    SalesChart,
    CategoryChart,
    TopProducts,
    RecentTransactions,
    OnboardingWizard,
    AiStoreWizardModal,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly analytics = inject(AnalyticsService);
  private readonly ordersService = inject(OrdersService);
  private readonly aiWizardService = inject(AiStoreWizardService);
  protected readonly tenantService = inject(TenantService);
  protected readonly onboarding = inject(OnboardingService);

  readonly showAiWizard = signal<boolean>(false);
  readonly aiWizardDismissedOrCompleted = signal<boolean>(false);

  readonly isAiSetupCompleted = computed(() => {
    if (this.aiWizardDismissedOrCompleted()) return true;
    const currentTenant = this.tenantService.currentTenant();
    if (!currentTenant) return true;
    const settings = (currentTenant.settings || {}) as Record<string, unknown>;
    if (settings['ai_wizard_completed'] === true) return true;
    const storeDesignState = settings['store_design_state'] as Record<string, unknown> | undefined;
    if (storeDesignState?.['published']) return true;
    if (typeof window !== 'undefined') {
      if (window.localStorage.getItem(`venti_ai_wizard_dismissed_${currentTenant.id}`) === 'true') {
        return true;
      }
      if (window.localStorage.getItem(`venti_ai_wizard_completed_${currentTenant.id}`) === 'true') {
        return true;
      }
    }
    return this.aiWizardService.isWizardCompleted(currentTenant.id);
  });

  readonly currentPlan = computed(() => this.tenantService.currentTenant()?.plan || 'free');
  readonly isFreePlan = computed(() => this.currentPlan() === 'free');
  readonly planDisplayName = computed(() => {
    switch (this.currentPlan()) {
      case 'enterprise':
        return 'Empresarial';
      case 'professional':
        return 'Profesional';
      case 'basic':
        return 'Básico';
      default:
        return 'Gratuito';
    }
  });

  openAiWizard(): void {
    this.showAiWizard.set(true);
  }

  onAiWizardClosed(): void {
    this.showAiWizard.set(false);
  }

  onAiWizardApplied(): void {
    this.aiWizardDismissedOrCompleted.set(true);
    this.showAiWizard.set(false);
    void this.onboarding.refresh();
  }

  dismissAiBanner(): void {
    this.aiWizardDismissedOrCompleted.set(true);
    const tenantId = this.tenantService.tenantId();
    if (tenantId && typeof window !== 'undefined') {
      window.localStorage.setItem(`venti_ai_wizard_dismissed_${tenantId}`, 'true');
    }
  }

  // Stats Signals
  readonly revenueTotal = signal<number>(0);
  readonly revenueTrend = signal<number>(0);

  readonly ordersTotal = signal<number>(0);
  readonly ordersTrend = signal<number>(0);

  readonly avgOrderValue = signal<number>(0);
  readonly avgOrderTrend = signal<number>(0);

  readonly customersTotal = signal<number>(0);
  readonly customersTrend = signal<number>(0);

  // Charts Data
  readonly salesSeries = signal<any[]>([]);
  readonly monthlyRevenue = signal<number[]>(new Array(12).fill(0));
  readonly monthlyOrders = signal<number[]>(new Array(12).fill(0));

  readonly categorySeries = signal<number[]>([]);
  readonly categoryLabels = signal<string[]>([]);

  // Products & Transactions
  readonly topProducts = signal<DashboardProduct[]>([]);

  readonly recentTransactions = signal<DashboardTransaction[]>([]);

  formatCurrency(value: number): string {
    const currency = this.tenantService.currentTenant()?.settings?.['currency'];
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency: typeof currency === 'string' ? currency : 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatCompactCurrency(value: number): string {
    const currency = this.tenantService.currentTenant()?.settings?.['currency'];
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency: typeof currency === 'string' ? currency : 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  constructor() {
    // Wait for tenant to be ready before fetching data
    effect(() => {
      const id = this.tenantService.tenantId();
      if (id) {
        void this.onboarding.refresh();
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
      this.loadRecentOrders(),
    ]);
  }

  private async loadStats() {
    const stats = await this.analytics.getDashboardStats();
    if (stats) {
      this.revenueTotal.set(stats.today_revenue);
      this.revenueTrend.set(stats.revenue_trend);

      this.ordersTotal.set(stats.today_orders);
      this.ordersTrend.set(stats.orders_trend);

      this.avgOrderValue.set(stats.today_avg_value);
      this.avgOrderTrend.set(stats.avg_value_trend);

      this.customersTotal.set(stats.today_customers);
      this.customersTrend.set(stats.customers_trend);
    }
  }

  private async loadSalesChart() {
    const { revenue, orders } = await this.analytics.getMonthlyPerformance();
    this.monthlyRevenue.set(revenue);
    this.monthlyOrders.set(orders);
    this.salesSeries.set([
      {
        name: 'Ingresos',
        data: revenue,
      },
    ]);
  }

  private async loadCategories() {
    const distribution = await this.analytics.getSalesByCategoryBI();

    // Sort by value descending
    const sorted = distribution.sort((a, b) => b.value - a.value);

    // Take top 3 and group the rest as "Others"
    const top = sorted.slice(0, 3);
    const others = sorted.slice(3);

    if (others.length > 0) {
      const othersTotal = others.reduce((sum, item) => sum + item.value, 0);
      top.push({ name: 'Otros', value: othersTotal });
    }

    this.categorySeries.set(top.map((d) => d.value));
    this.categoryLabels.set(top.map((d) => d.name));
  }

  private async loadTopProducts() {
    const performance = await this.analytics.getProductPerformance();
    this.topProducts.set(
      (performance as any[]).map((p) => ({
        id: p.product_id,
        name: p.product?.name || 'Producto',
        category: 'General',
        sales: p.purchases,
        revenue: this.formatCompactCurrency(p.revenue),
        image:
          p.product?.product_images?.find((img: any) => img.is_primary)?.url ||
          p.product?.product_images?.[0]?.url,
      })),
    );
  }

  private async loadRecentOrders() {
    const { data } = await this.ordersService.getOrders(1, 5);
    this.recentTransactions.set(
      (data as any[]).map((o) => {
        const first = o.customer_first_name || 'Invitado';
        const last = o.customer_last_name || '';
        const fullName = (first + ' ' + last).trim();

        return {
          id: o.order_number,
          customerName: fullName,
          customerInitial: (first?.[0] || 'I') + (last?.[0] || ''),
          product: 'Múltiples artículos',
          date: new Date(o.created_at).toLocaleDateString('es', {
            timeZone: this.tenantService.timezone(),
          }),
          amount: o.total_amount,
          status: this.mapStatus(o.status),
        };
      }),
    );
  }

  private mapStatus(status: string): 'Completada' | 'Pendiente' | 'Cancelada' {
    if (status === 'delivered' || status === 'shipped') return 'Completada';
    if (status === 'cancelled' || status === 'refunded') return 'Cancelada';
    return 'Pendiente';
  }
}
