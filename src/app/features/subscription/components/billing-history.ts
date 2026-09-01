import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { SubscriptionHistoryEntry } from '@core/models/billing.model';

@Component({
  selector: 'app-billing-history',
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div
      class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
    >
      <div
        class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between"
      >
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">Historial de Facturación</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Revisa tus pagos anteriores, períodos activos y cambios de suscripción.
          </p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/70 dark:bg-gray-800/50">
              <th
                class="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
              >
                Fecha
              </th>
              <th
                class="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
              >
                Plan
              </th>
              <th
                class="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
              >
                Período
              </th>
              <th
                class="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
              >
                Monto
              </th>
              <th
                class="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-right"
              >
                Estado
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            @for (entry of history(); track entry.id || $index) {
              <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ entry.created_at | date: 'mediumDate' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">
                    {{ entry.plan }}
                  </span>
                </td>
                <td class="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 font-mono">
                  @if (entry.billing_period_start && entry.billing_period_end) {
                    {{ entry.billing_period_start | date: 'dd/MM/yy' }} -
                    {{ entry.billing_period_end | date: 'dd/MM/yy' }}
                  } @else {
                    —
                  }
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                  {{
                    entry.amount || 0
                      | currency: entry.currency || 'USD' : 'symbol' : '1.0-0' : 'es'
                  }}
                </td>
                <td class="px-6 py-4 text-right">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    [class.bg-green-50]="isLatestEntry(entry.id)"
                    [class.text-green-700]="isLatestEntry(entry.id)"
                    [class.dark:bg-green-950/30]="isLatestEntry(entry.id)"
                    [class.dark:text-green-400]="isLatestEntry(entry.id)"
                    [class.bg-gray-50]="!isLatestEntry(entry.id)"
                    [class.text-gray-700]="!isLatestEntry(entry.id)"
                    [class.dark:bg-gray-800/30]="!isLatestEntry(entry.id)"
                    [class.dark:text-gray-400]="!isLatestEntry(entry.id)"
                  >
                    @if (isLatestEntry(entry.id)) {
                      Activo
                    } @else {
                      Historial
                    }
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div class="flex flex-col items-center gap-2">
                    <svg
                      class="w-10 h-10 text-gray-300 dark:text-gray-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span class="text-sm font-medium">No hay registros de facturación aún.</span>
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
  history = input<SubscriptionHistoryEntry[]>([]);

  // Calcula el ID del último pago (más reciente)
  readonly latestEntryId = computed(() => {
    const entries = this.history();
    if (entries.length === 0) return null;

    const sorted = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return sorted[0]?.id || null;
  });

  // Determina si una entrada es la más reciente
  isLatestEntry(entryId: string | null): boolean {
    return entryId === this.latestEntryId();
  }
}
