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
  standalone: true,
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
            {{ subtitle() }}
          </p>
        </div>
        <div
          class="flex bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200/50 dark:border-slate-850/50"
        >
          <button
            type="button"
            (click)="setTab('revenue')"
            class="px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer"
            [class.bg-white]="activeTab() === 'revenue'"
            [class.dark:bg-slate-700]="activeTab() === 'revenue'"
            [class.text-sky-600]="activeTab() === 'revenue'"
            [class.dark:text-sky-400]="activeTab() === 'revenue'"
            [class.shadow-xs]="activeTab() === 'revenue'"
            [class.text-slate-500]="activeTab() !== 'revenue'"
            [class.dark:text-slate-400]="activeTab() !== 'revenue'"
            [class.hover:text-slate-800]="activeTab() !== 'revenue'"
            [class.dark:hover:text-slate-200]="activeTab() !== 'revenue'"
          >
            Ingresos
          </button>
          <button
            type="button"
            (click)="setTab('orders')"
            class="px-3 py-1 text-xs font-bold rounded-md transition-all ml-1 cursor-pointer"
            [class.bg-white]="activeTab() === 'orders'"
            [class.dark:bg-slate-700]="activeTab() === 'orders'"
            [class.text-emerald-600]="activeTab() === 'orders'"
            [class.dark:text-emerald-400]="activeTab() === 'orders'"
            [class.shadow-xs]="activeTab() === 'orders'"
            [class.text-slate-500]="activeTab() !== 'orders'"
            [class.dark:text-slate-400]="activeTab() !== 'orders'"
            [class.hover:text-slate-800]="activeTab() !== 'orders'"
            [class.dark:hover:text-slate-200]="activeTab() !== 'orders'"
          >
            Órdenes
          </button>
        </div>
      </div>

      <div class="h-[300px] w-full">
        <apx-chart
          #chart
          [series]="currentSeries()"
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

  revenueData = input<number[]>();
  ordersData = input<number[]>();
  series = input<any[]>();

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

  readonly activeTab = signal<'revenue' | 'orders'>('revenue');

  chart = viewChild<ChartComponent>('chart');

  private readonly isDark = signal(window.matchMedia('(prefers-color-scheme: dark)').matches);

  constructor() {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => this.isDark.set(e.matches));
  }

  setTab(tab: 'revenue' | 'orders'): void {
    this.activeTab.set(tab);
  }

  readonly subtitle = computed(() =>
    this.activeTab() === 'revenue'
      ? 'Tendencias de ingresos mensuales'
      : 'Cantidad de órdenes mensuales'
  );

  readonly currentSeries = computed(() => {
    const isRevenue = this.activeTab() === 'revenue';
    if (isRevenue) {
      const data = this.revenueData() ?? this.series()?.[0]?.data ?? new Array(12).fill(0);
      return [
        {
          name: 'Ingresos',
          data,
        },
      ];
    } else {
      const data = this.ordersData() ?? new Array(12).fill(0);
      return [
        {
          name: 'Órdenes',
          data,
        },
      ];
    }
  });

  readonly options = computed(() => {
    const dark = this.isDark();
    const isRevenue = this.activeTab() === 'revenue';
    const chartColor = isRevenue ? '#349EDB' : '#10B981';

    return {
      chart: {
        height: 300,
        type: 'area' as const,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit',
        foreColor: dark ? '#94a3b8' : '#64748b',
      },
      colors: [chartColor],
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
        min: 0,
        forceNiceScale: true,
        labels: {
          style: { colors: dark ? '#94a3b8' : '#64748b', fontSize: '12px' },
          formatter: (val: number) =>
            isRevenue ? this.formatCurrency(val) : `${Math.round(val)}`,
        },
      },
      markers: {
        size: 0,
        colors: [chartColor],
        strokeColors: dark ? '#1e293b' : '#fff',
        strokeWidth: 2,
        hover: { size: 6 },
      },
      tooltip: {
        theme: dark ? 'dark' : 'light',
        x: { show: false },
        y: {
          formatter: (val: number) =>
            isRevenue
              ? this.formatCurrency(val)
              : `${Math.round(val)} ${Math.round(val) === 1 ? 'orden' : 'órdenes'}`,
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
