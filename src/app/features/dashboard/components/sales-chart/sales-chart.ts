import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  viewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { TenantService } from '@core/services/tenant';

@Component({
  selector: 'app-sales-chart',
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div
      class="bg-white/85 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xs"
    >
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Rendimiento de Ventas
          </h3>
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Tendencias de ingresos mensuales
          </p>
        </div>
        <div
          class="flex bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200/50 dark:border-slate-850/50"
        >
          <button
            class="px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Ingresos
          </button>
          <button
            class="px-3 py-1 text-xs font-bold rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all ml-1"
          >
            Órdenes
          </button>
        </div>
      </div>

      <div class="h-[300px] w-full">
        <apx-chart
          #chart
          [series]="series()"
          [chart]="options().chart!"
          [xaxis]="options().xaxis!"
          [stroke]="options().stroke!"
          [tooltip]="options().tooltip!"
          [dataLabels]="options().dataLabels!"
          [grid]="options().grid!"
          [colors]="options().colors!"
          [fill]="options().fill!"
          [markers]="options().markers!"
          [yaxis]="options().yaxis!"
        ></apx-chart>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesChart {
  private readonly tenantService = inject(TenantService);
  series = input.required<any[]>();
  categories = input<string[]>([
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]);

  chart = viewChild<ChartComponent>('chart');

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
        height: 300,
        type: 'area' as const,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit',
        foreColor: dark ? '#94a3b8' : '#64748b',
      },
      colors: ['#349EDB'],
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth' as const,
        width: 3,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [20, 100],
        },
      },
      grid: {
        borderColor: dark ? '#334155' : '#f1f5f9',
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      xaxis: {
        categories: this.categories(),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: dark ? '#94a3b8' : '#64748b', fontSize: '12px' },
        },
      },
      yaxis: {
        labels: {
          style: { colors: dark ? '#94a3b8' : '#64748b', fontSize: '12px' },
          formatter: (val: number) => this.formatCurrency(val),
        },
      },
      markers: {
        size: 0,
        colors: ['#349EDB'],
        strokeColors: dark ? '#1e293b' : '#fff',
        strokeWidth: 2,
        hover: { size: 6 },
      },
      tooltip: {
        theme: dark ? 'dark' : 'light',
        x: { show: false },
        y: {
          formatter: (val: number) => this.formatCurrency(val),
        },
      },
    };
  });

  formatCurrency(value: number): string {
    const currency = this.tenantService.currentTenant()?.settings?.['currency'];
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency: typeof currency === 'string' ? currency : 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
