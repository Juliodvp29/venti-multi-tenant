import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { StoreHealthStep } from '@core/models/support';
import { SupportService } from './support.service';
import { TenantService } from './tenant';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly supportService = inject(SupportService);
  private readonly tenantService = inject(TenantService);

  readonly isOpen = signal(false);
  readonly isCollapsed = signal(true);
  readonly isDismissed = signal(false);
  readonly activeStepId = signal<string | null>(null);
  readonly steps = computed<StoreHealthStep[]>(
    () => this.supportService.healthSummary()?.steps ?? [],
  );
  readonly completionPercentage = computed(
    () => this.supportService.healthSummary()?.completionPercentage ?? 0,
  );
  readonly completedCount = computed(
    () => this.supportService.healthSummary()?.completedCount ?? 0,
  );

  private currentTenantId: string | null = null;

  constructor() {
    effect(() => {
      const tenant = this.tenantService.currentTenant();
      const tenantId = tenant?.id ?? null;
      if (tenantId && tenantId !== this.currentTenantId) {
        this.currentTenantId = tenantId;
        this.loadPreferences(tenantId);
        void this.refresh();
      }
    });
  }

  async refresh(): Promise<void> {
    const summary = await this.supportService.evaluateStoreHealth();
    const firstPendingStep = summary.steps.find((step) => !step.completed);
    this.activeStepId.set(firstPendingStep?.id ?? summary.steps[0]?.id ?? null);
    if (summary.completionPercentage < 100 && !this.isDismissed()) {
      this.isOpen.set(true);
    }
  }

  toggleCollapse(): void {
    const collapsed = !this.isCollapsed();
    this.isCollapsed.set(collapsed);
    this.persist('collapsed', collapsed);
  }

  dismiss(): void {
    this.isDismissed.set(true);
    this.isOpen.set(false);
    this.persist('dismissed', true);
  }

  restore(): void {
    this.isDismissed.set(false);
    this.isOpen.set(true);
    this.persist('dismissed', false);
  }

  selectStep(stepId: string): void {
    this.activeStepId.update((current) => (current === stepId ? null : stepId));
  }

  private loadPreferences(tenantId: string): void {
    const savedCollapsed = this.readStorage(`venti_onboarding_collapsed_${tenantId}`);
    // Por defecto al entrar está cerrada (true) si el usuario aún no la expandió manualmente
    this.isCollapsed.set(savedCollapsed !== null ? savedCollapsed === 'true' : true);
    this.isDismissed.set(this.readBoolean(`venti_onboarding_dismissed_${tenantId}`));
    this.isOpen.set(!this.isDismissed());
  }

  private persist(kind: 'collapsed' | 'dismissed', value: boolean): void {
    const tenantId = this.tenantService.tenantId();
    if (typeof window === 'undefined' || !tenantId) return;
    window.localStorage.setItem(`venti_onboarding_${kind}_${tenantId}`, String(value));
  }

  private readStorage(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  }

  private readBoolean(key: string): boolean {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(key) === 'true';
  }
}
