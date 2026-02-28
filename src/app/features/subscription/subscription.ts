import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '@core/services/subscription';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { PlanCard } from './components/plan-card';
import { BillingHistory } from './components/billing-history';
import { UsageProgress } from '@shared/components/usage-progress/usage-progress';
import { BillingPlan, SubscriptionHistoryEntry } from '@core/models/billing.model';

@Component({
  selector: 'app-subscription',
  imports: [CommonModule, PlanCard, BillingHistory, UsageProgress],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subscription implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal(true);
  readonly isChangingPlan = signal(false);
  readonly plans = signal<BillingPlan[]>([]);
  readonly history = signal<SubscriptionHistoryEntry[]>([]);
  readonly usage = signal<{ products: number; members: number; categories: number }>({ products: 0, members: 0, categories: 0 });

  readonly currentTenant = this.tenantService.tenant;
  readonly activePlanId = computed(() => this.currentTenant()?.plan);
  readonly activePlan = computed(() => this.plans().find(p => p.id === this.activePlanId()));

  async ngOnInit() {
    this.plans.set(this.subscriptionService.getPlans());
    await Promise.all([this.loadHistory(), this.loadUsage()]);
  }

  async loadUsage() {
    const usage = await this.subscriptionService.getUsage();
    this.usage.set(usage);
  }

  async loadHistory() {
    this.isLoading.set(true);
    try {
      const history = await this.subscriptionService.getSubscriptionHistory();
      this.history.set(history);
    } catch (error) {
      this.toastService.error('Error loading billing history');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onUpgrade(planId: string) {
    if (planId === this.activePlanId()) return;

    this.isChangingPlan.set(true);
    try {
      await this.subscriptionService.changePlan(planId);
      this.toastService.success('Plan change request sent');
      // In a real app, we would wait for the payment flow or webhook
    } catch (error) {
      this.toastService.error('Error requesting plan change');
    } finally {
      this.isChangingPlan.set(false);
    }
  }
}
