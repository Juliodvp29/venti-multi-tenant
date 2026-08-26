import { ChangeDetectionStrategy, Component, effect, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CommissionsService } from '@core/services/commissions';
import { TenantService } from '@core/services/tenant';
import { Router } from '@angular/router';

@Component({
  selector: 'app-commission-summary-card',
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './commission-summary-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommissionSummaryCard {
  private readonly commissionsService = inject(CommissionsService);
  private readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly stats = signal<{ totalPending: number; totalPaid: number; totalAmount: number; thisMonthAmount: number } | null>(null);

  readonly canEdit = this.tenantService.canEdit;
  readonly currency = this.tenantService.currency;

  readonly pendingChange = computed(() => {
    const s = this.stats();
    if (!s) return null;
    // Simple comparison: if there are pending commissions, show attention
    return s.totalPending > 0 ? { value: s.totalPending } : null;
  });

  constructor() {
    effect(() => {
      const tenantId = this.tenantService.tenantId();
      if (tenantId) {
        this.loadStats();
      }
    });
  }

  async loadStats() {
    this.isLoading.set(true);
    try {
      const stats = await this.commissionsService.getCommissionStats();
      this.stats.set(stats);
    } catch (error) {
      console.error('Error loading commission stats:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateToCommissions() {
    this.router.navigate(['/commissions']);
  }
}