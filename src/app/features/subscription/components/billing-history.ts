import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { SubscriptionHistoryEntry } from '@core/models/billing.model';

@Component({
    selector: 'app-billing-history',
    imports: [CommonModule, CurrencyPipe, DatePipe],
    template: `
    <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">Historial de Facturación</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Consulta tus pagos anteriores y descarga tus facturas.</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 dark:bg-gray-800/50">
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Fecha</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Plan</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Monto</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Estado</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            @for (entry of history; track entry.id) {
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ entry.created_at | date:'mediumDate' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {{ entry.plan }}
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                  {{ entry.amount | currency:entry.currency }}
                </td>
                <td class="px-6 py-4">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest"
                    [class.bg-emerald-50]="entry.status === 'active'"
                    [class.text-emerald-600]="entry.status === 'active'"
                    [class.bg-amber-50]="entry.status === 'trial'"
                    [class.text-amber-600]="entry.status === 'trial'"
                    [class.bg-red-50]="entry.status === 'cancelled' || entry.status === 'expired'"
                    [class.text-red-600]="entry.status === 'cancelled' || entry.status === 'expired'"
                  >
                    {{ entry.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors">
                    Ver Factura
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div class="flex flex-col items-center gap-2">
                    <svg class="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>No hay facturas registradas todavía.</span>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingHistory {
    @Input() history: SubscriptionHistoryEntry[] = [];
}
