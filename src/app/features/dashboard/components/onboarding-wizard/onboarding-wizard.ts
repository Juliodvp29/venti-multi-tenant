import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService } from '@core/services/onboarding.service';
import { TenantService } from '@core/services/tenant';

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onboarding-wizard.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class OnboardingWizard {
  protected readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);
  protected readonly storeUrl = inject(TenantService).storeUrl;

  readonly showCompleted = signal<boolean>(true);

  readonly pendingSteps = computed(() =>
    this.onboarding.steps().filter((step) => !step.completed),
  );

  readonly completedSteps = computed(() =>
    this.onboarding.steps().filter((step) => step.completed),
  );

  readonly nextPendingStep = computed(() => this.pendingSteps()[0] ?? null);

  toggleShowCompleted(): void {
    this.showCompleted.update((v) => !v);
  }

  categoryLabel(category: string): string {
    return (
      {
        essential: 'Esencial',
        design: 'Diseño',
        operations: 'Operaciones',
        finance: 'Finanzas',
        general: 'General',
      }[category] ?? category
    );
  }

  categoryClass(category: string): string {
    return (
      {
        essential:
          'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50',
        design:
          'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/50',
        operations:
          'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50',
        finance:
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50',
        general:
          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50',
      }[category] ?? 'bg-slate-100 text-slate-700'
    );
  }

  openStep(stepId: string): void {
    this.onboarding.selectStep(stepId);
  }

  goToStep(route: string, queryParams?: Record<string, string>): void {
    void this.router.navigate([route], { queryParams });
  }
}
