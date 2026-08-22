import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService } from '@core/services/tenant';

export interface DashboardTransaction {
  id: string;
  customerName: string;
  customerInitial: string;
  product: string;
  date: string;
  amount: number;
  status: 'Completada' | 'Pendiente' | 'Cancelada';
}

@Component({
  selector: 'app-recent-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="bg-white/85 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl shadow-xs overflow-hidden"
    >
      <div
        class="px-6 py-5 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50"
      >
        <h3 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Transacciones Recientes
        </h3>
        <a
          [routerLink]="['/orders']"
          class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors cursor-pointer"
          >Ver todo</a
        >
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200/40 dark:border-slate-800/30"
            >
              <th class="px-6 py-4">Cliente</th>
              <th class="px-6 py-4">Producto</th>
              <th class="px-6 py-4">Fecha</th>
              <th class="px-6 py-4">Monto</th>
              <th class="px-6 py-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
            @for (tx of transactions(); track tx.id) {
              <tr class="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                <td class="px-6 py-3.5">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/20 dark:border-indigo-500/10"
                    >
                      {{ tx.customerInitial }}
                    </div>
                    <span class="text-xs font-bold text-slate-900 dark:text-slate-100">{{
                      tx.customerName
                    }}</span>
                  </div>
                </td>
                <td class="px-6 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {{ tx.product }}
                </td>
                <td class="px-6 py-3.5 text-xs font-medium text-slate-500 dark:text-slate-500">
                  {{ tx.date }}
                </td>
                <td class="px-6 py-3.5 text-xs font-bold text-slate-900 dark:text-white font-mono">
                  {{ formatCurrency(tx.amount) }}
                </td>
                <td class="px-6 py-3.5">
                  <div class="flex justify-center">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border"
                      [ngClass]="{
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/10':
                          tx.status === 'Completada',
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/10':
                          tx.status === 'Pendiente',
                        'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/10':
                          tx.status === 'Cancelada',
                      }"
                    >
                      {{ tx.status }}
                    </span>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class RecentTransactions {
  transactions = input.required<DashboardTransaction[]>();
  private readonly tenantService = inject(TenantService);

  formatCurrency(value: number): string {
    const currency = this.tenantService.currentTenant()?.settings?.['currency'];
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency: typeof currency === 'string' ? currency : 'USD',
    }).format(value);
  }
}
