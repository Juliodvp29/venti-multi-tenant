import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-category-chart',
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm h-full">
      <div class="mb-6">
        <h3 class="text-base font-bold text-gray-900 dark:text-white">Ventas por categoría</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Rendimiento este mes</p>
      </div>

      <div class="relative h-[240px] flex items-center justify-center">
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

      <div class="mt-6 space-y-3">
        @for (label of labels(); track $index) {
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" [style.background-color]="options().colors![$index]"></span>
              <span class="text-gray-600 dark:text-gray-400">{{ label }}</span>
            </div>
            <span class="font-bold text-gray-900 dark:text-white">{{ currencyFormat(series()[$index]) }}</span>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryChart {
  series = input.required<number[]>();
  labels = input.required<string[]>();

  private readonly isDark = signal(window.matchMedia('(prefers-color-scheme: dark)').matches);

  constructor() {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', e => this.isDark.set(e.matches));
  }

  readonly options = computed(() => {
    const dark = this.isDark();
    return {
      chart: {
        type: 'donut' as const,
        height: 240,
        fontFamily: 'inherit',
        foreColor: dark ? '#94a3b8' : '#64748b'
      },
      colors: ['#4f46e5', '#818cf8', '#c7d2fe'],
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
                color: dark ? '#94a3b8' : '#64748b'
              },
              value: {
                show: true,
                fontSize: '24px',
                fontWeight: 'bold',
                offsetY: -20,
                color: dark ? '#ffffff' : '#111827',
                formatter: (val: string) => this.currencyFormat(Number(val))
              },
              total: {
                show: true,
                label: 'Total',
                color: dark ? '#94a3b8' : '#64748b',
                formatter: (w: any) => {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return this.currencyFormat(total);
                }
              }
            }
          }
        }
      },
      legend: { show: false },
      tooltip: { enabled: true, theme: dark ? 'dark' : 'light' }
    };
  });

  currencyFormat(val: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(val);
  }
}
