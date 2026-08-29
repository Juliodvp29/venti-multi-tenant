import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  computed,
  effect,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SubscriptionService } from '@core/services/subscription';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { PlanCard } from './components/plan-card';
import { BillingHistory } from './components/billing-history';
import { UsageProgress } from '@shared/components/usage-progress/usage-progress';
import { BillingPlan, SubscriptionHistoryEntry } from '@core/models/billing.model';
import { SubscriptionPlan } from '@core/models/tenant.model';

@Component({
  selector: 'app-subscription',
  imports: [CommonModule, PlanCard, BillingHistory, UsageProgress, DatePipe],
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
  readonly isCancelling = signal(false);
  readonly isReactivating = signal(false);

  readonly plans = signal<BillingPlan[]>([]);
  readonly history = signal<SubscriptionHistoryEntry[]>([]);
  readonly usage = signal<{ products: number; members: number; categories: number }>({
    products: 0,
    members: 0,
    categories: 0,
  });

  readonly currentTenant = this.tenantService.tenant;
  readonly activePlanId = computed(() => this.currentTenant()?.plan);
  readonly activePlan = computed(() => this.plans().find((p) => p.id === this.activePlanId()));
  readonly activePlanStatus = computed(() => this.currentTenant()?.plan_status || 'active');

  readonly subscriptionEndsAt = computed(() => {
    return (
      this.currentTenant()?.subscription_ends_at ||
      this.history()[0]?.billing_period_end ||
      null
    );
  });

  readonly isCancelled = computed(() => this.activePlanStatus() === 'cancelled');

  readonly isExpired = computed(() => {
    if (this.activePlanStatus() === 'expired') return true;
    if (this.isCancelled() && this.subscriptionEndsAt()) {
      return new Date(this.subscriptionEndsAt()!) < new Date();
    }
    return false;
  });

  readonly isCancelledAndActive = computed(() => {
    return this.isCancelled() && !this.isExpired();
  });

  constructor() {
    this.plans.set(this.subscriptionService.getPlans());

    effect(() => {
      const tenantId = this.tenantService.tenantId();
      if (tenantId) {
        this.loadData();
      }
    });
  }

  ngOnInit() {
    // Initial data load handled reactively by effect when tenant becomes available
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      await Promise.all([this.loadHistory(), this.loadUsage()]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadUsage() {
    try {
      const usage = await this.subscriptionService.getUsage();
      this.usage.set(usage);
    } catch (error) {
      console.warn('Error loading usage:', error);
    }
  }

  async loadHistory() {
    try {
      const history = await this.subscriptionService.getSubscriptionHistory();
      this.history.set(history);
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      this.toastService.error('Error al cargar el historial de facturación');
    }
  }

  async cancelSubscription() {
    const endsAt = this.subscriptionEndsAt();
    const formattedDate = endsAt
      ? new Date(endsAt).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'el final de tu período actual';

    const confirmed = await this.toastService.confirm(
      `¿Estás seguro de cancelar tu suscripción? Seguirás teniendo acceso a todas las funciones de tu plan hasta el ${formattedDate}. Después de esa fecha no se realizarán más cobros.`,
      'Cancelar Suscripción'
    );

    if (!confirmed) return;

    this.isCancelling.set(true);
    try {
      await this.subscriptionService.cancelSubscription();
      this.toastService.success(
        `Suscripción cancelada. Mantendrás tu acceso completo hasta el ${formattedDate}.`
      );
      await this.loadData();
    } catch (error: any) {
      this.toastService.error(error?.message || 'Error al cancelar la suscripción');
    } finally {
      this.isCancelling.set(false);
    }
  }

  async reactivateSubscription() {
    this.isReactivating.set(true);
    try {
      await this.subscriptionService.reactivateSubscription();
      this.toastService.success('¡Tu suscripción ha sido reactivada con éxito!');
      await this.loadData();
    } catch (error: any) {
      this.toastService.error(error?.message || 'Error al reactivar la suscripción');
    } finally {
      this.isReactivating.set(false);
    }
  }

  async onUpgrade(planId: string) {
    if (planId === this.activePlanId() && this.activePlanStatus() === 'active') return;

    const plan = this.plans().find((p) => p.id === planId);
    const confirmed = await this.toastService.confirm(
      `¿Deseas cambiar tu suscripción al plan "${plan?.name || planId}"?`,
      'Cambio de Plan'
    );

    if (!confirmed) return;

    this.isChangingPlan.set(true);
    try {
      await this.subscriptionService.changePlan(planId as SubscriptionPlan);
      this.toastService.success(`¡Plan cambiado a ${plan?.name || planId} con éxito!`);
      await this.loadData();
    } catch (error: any) {
      this.toastService.error(error?.message || 'Error al solicitar cambio de plan');
    } finally {
      this.isChangingPlan.set(false);
    }
  }
}

