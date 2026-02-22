import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

export interface DashboardTransaction {
    id: string;
    customerName: string;
    customerInitial: string;
    product: string;
    date: string;
    amount: number;
    status: 'Completed' | 'Pending' | 'Cancelled';
}

@Component({
    selector: 'app-recent-transactions',
    standalone: true,
    imports: [CommonModule, CurrencyPipe],
    template: `
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <h3 class="text-base font-bold text-gray-900 dark:text-white">Transacciones Recientes</h3>
        <button class="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Ver todas</button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-gray-800/30">
              <th class="px-6 py-3">Cliente</th>
              <th class="px-6 py-3">Producto</th>
              <th class="px-6 py-3">Fecha</th>
              <th class="px-6 py-3">Monto</th>
              <th class="px-6 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            @for (tx of transactions(); track tx.id) {
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      {{ tx.customerInitial }}
                    </div>
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ tx.customerName }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ tx.product }}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ tx.date }}</td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{{ tx.amount | currency }}</td>
                <td class="px-6 py-4">
                  <div class="flex justify-center">
                    <span 
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      [ngClass]="{
                        'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400': tx.status === 'Completed',
                        'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400': tx.status === 'Pending',
                        'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400': tx.status === 'Cancelled'
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentTransactions {
    transactions = input.required<DashboardTransaction[]>();
}
