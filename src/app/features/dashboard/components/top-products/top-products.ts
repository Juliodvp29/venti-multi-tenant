import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DashboardProduct {
    id: string;
    name: string;
    category: string;
    sales: number;
    revenue: string;
    image?: string;
}

@Component({
    selector: 'app-top-products',
    standalone: true,
    imports: [CommonModule],
    host: { class: 'block h-full' },
    template: `
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm h-full flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-base font-bold text-gray-900 dark:text-white">Top Productos</h3>
        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Este Mes</span>
      </div>

      <div class="flex-1 space-y-5">
        @for (product of products(); track product.id) {
          <div class="flex items-center gap-4 group">
            <div class="relative flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
               <span class="absolute -top-2 -left-2 w-6 h-6 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 z-10 shadow-sm">{{ $index + 1 }}</span>
              @if (product.image) {
                <img [src]="product.image" [alt]="product.name" class="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-300" />
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            </div>
            
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ product.name }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ product.category }}</p>
            </div>

            <div class="text-right">
              <p class="text-sm font-bold text-gray-900 dark:text-white">{{ product.sales }} ventas</p>
              <p class="text-[10px] font-bold text-green-600 dark:text-green-400">{{ product.revenue }}</p>
            </div>
          </div>
        }
      </div>

      <button class="w-full mt-6 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
        Ver reporte de inventario
      </button>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopProducts {
    products = input.required<DashboardProduct[]>();
}
