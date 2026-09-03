import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  imports: [CommonModule, RouterLink],
  host: { class: 'block h-full' },
  template: `
    <div
      class="bg-white/85 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xs h-full flex flex-col justify-between"
    >
      <div>
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Productos Principales
          </h3>
          <span
            class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-700 bg-slate-100/80 dark:bg-slate-850/50 border border-slate-200/30 dark:border-slate-800/20 px-2.5 py-0.5 rounded-full"
            >Este Mes</span
          >
        </div>

        <div class="space-y-4">
          @for (product of products(); track product.id) {
            <div class="flex items-center gap-4 group transition-all duration-200 cursor-default">
              <div
                class="relative flex-shrink-0 w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50 shadow-inner"
              >
                <span
                  class="absolute -top-1.5 -left-1.5 w-5 h-5 bg-sky-600 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full border border-white dark:border-slate-900 z-10 shadow-xs font-mono"
                  >{{ $index + 1 }}</span
                >
                @if (product.image) {
                  <img
                    class="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    [src]="product.image"
                    [alt]="product.name"
                  />
                } @else {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-slate-400 group-hover:scale-105 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
              </div>

              <div class="flex-1 min-w-0">
                <h4
                  class="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors"
                >
                  {{ product.name }}
                </h4>
                <p
                  class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5"
                >
                  {{ product.category }}
                </p>
              </div>

              <div class="text-right">
                <p class="text-xs font-bold text-slate-900 dark:text-white font-mono">
                  {{ product.sales }} ventas
                </p>
                <p class="text-[10px] font-bold text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                  {{ product.revenue }}
                </p>
              </div>
            </div>
          }
        </div>
      </div>

      <button
        class="w-full mt-6 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
        [routerLink]="['/reports']"
      >
        Ver reporte de inventario
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopProducts {
  products = input.required<DashboardProduct[]>();
}
