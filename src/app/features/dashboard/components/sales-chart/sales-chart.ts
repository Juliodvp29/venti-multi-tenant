import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

@Component({
    selector: 'app-sales-chart',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule],
    template: `
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-base font-bold text-gray-900 dark:text-white">Rendimiento de Ventas</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Tendencias de ingresos mensuales</p>
        </div>
        <div class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button class="px-3 py-1 text-xs font-semibold rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm">Ingresos</button>
          <button class="px-3 py-1 text-xs font-semibold rounded-md text-gray-500 dark:text-gray-400">Órdenes</button>
        </div>
      </div>

      <div class="h-[300px] w-full">
        <apx-chart
          #chart
          [series]="series()"
          [chart]="chartOptions.chart!"
          [xaxis]="chartOptions.xaxis!"
          [stroke]="chartOptions.stroke!"
          [tooltip]="chartOptions.tooltip!"
          [dataLabels]="chartOptions.dataLabels!"
          [grid]="chartOptions.grid!"
          [colors]="chartOptions.colors!"
          [fill]="chartOptions.fill!"
          [markers]="chartOptions.markers!"
          [yaxis]="chartOptions.yaxis!"
        ></apx-chart>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesChart {
    series = input.required<any[]>();
    categories = input<string[]>(['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']);

    chart = viewChild<ChartComponent>('chart');

    chartOptions: any = {
        chart: {
            height: 300,
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'inherit'
        },
        colors: ['#4f46e5'],
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [20, 100]
            }
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: true } },
            padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        xaxis: {
            categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: { colors: '#94a3b8', fontSize: '12px' }
            }
        },
        yaxis: {
            labels: {
                style: { colors: '#94a3b8', fontSize: '12px' },
                formatter: (val: number) => `$${val.toLocaleString()}`
            }
        },
        markers: {
            size: 0,
            colors: ['#4f46e5'],
            strokeColors: '#fff',
            strokeWidth: 2,
            hover: { size: 6 }
        },
        tooltip: {
            theme: 'dark',
            x: { show: false },
            y: {
                formatter: (val: number) => `$${val.toLocaleString()}`
            }
        }
    };
}
