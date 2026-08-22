import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { TenantService } from '@core/services/tenant';

@Component({
  selector: 'app-category-chart',
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div
      class="bg-white/85 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xs h-full flex flex-col justify-between"
    >
      <div class="mb-4">
        <h3 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Ventas por categoría
        </h3>
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
          Rendimiento este mes
        </p>
      </div>

      <div class="relative h-[220px] flex items-center justify-center">
        <apx-chart
          [series]="series()"
          [chart]="options().chart!"
          [labels]="labels()"
          [colors]="options().colors!"
          [legend]="options().legend!"
          [dataLabels]="options().dataLabels!"
          [plotOptions]="options().plotOptions!"
          [stroke]="options().stroke!"
          [tooltip]="options().tooltip!"
        ></apx-chart>
      </div>

      <div class="mt-4 space-y-2.5">
        @for (label of labels(); track $index) {
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span
                class="w-2.5 h-2.5 rounded-full border border-white/20 dark:border-slate-900/40"
                [style.background-color]="options().colors![$index]"
              ></span>
              <span class="font-semibold text-slate-600 dark:text-slate-400">{{ label }}</span>
            </div>
            <span class="font-bold text-slate-900 dark:text-slate-200 font-mono">{{
              currencyFormat(series()[$index])
            }}</span>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryChart {
  private readonly tenantService = inject(TenantService);
  series = input.required<number[]>();
  labels = input.required<string[]>();

  private readonly isDark = signal(window.matchMedia('(prefers-color-scheme: dark)').matches);

  constructor() {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => this.isDark.set(e.matches));
  }

  readonly options = computed(() => {
    const dark = this.isDark();
    return {
      chart: {
        type: 'donut' as const,
        height: 220,
        fontFamily: 'inherit',
        foreColor: dark ? '#94a3b8' : '#64748b',
      },
      colors: ['#5D5FEF', '#818CF8', '#A5B4FC'],
      dataLabels: { enabled: false },
      stroke: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              name: {
                show: true,
                offsetY: 20,
                color: dark ? '#94a3b8' : '#64748b',
              },
              value: {
                show: true,
                fontSize: '18px',
                fontWeight: 'bold',
                offsetY: -20,
                color: dark ? '#ffffff' : '#111827',
                formatter: (val: string) => this.compactCurrencyFormat(Number(val)),
              },
              total: {
                show: true,
                label: 'Total',
                color: dark ? '#94a3b8' : '#64748b',
                formatter: (w: any) => {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return this.compactCurrencyFormat(total);
                },
              },
            },
          },
        },
      },
      legend: { show: false },
      tooltip: { enabled: true, theme: dark ? 'dark' : 'light' },
    };
  });

  currencyFormat(val: number): string {
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency: this.currencyCode,
    }).format(val);
  }

  compactCurrencyFormat(val: number): string {
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency: this.currencyCode,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(val);
  }

  private get currencyCode(): string {
    const currency = this.tenantService.currentTenant()?.settings?.['currency'];
    return typeof currency === 'string' ? currency : 'USD';
  }
}
