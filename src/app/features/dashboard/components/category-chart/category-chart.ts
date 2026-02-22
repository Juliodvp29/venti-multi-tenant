import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
    selector: 'app-category-chart',
    standalone: true,
    imports: [CommonModule, NgApexchartsModule],
    template: `
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm h-full">
      <div class="mb-6">
        <h3 class="text-base font-bold text-gray-900 dark:text-white">Ventas por Categoría</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Rendimiento este mes</p>
      </div>

      <div class="relative h-[240px] flex items-center justify-center">
        <apx-chart
          [series]="series()"
          [chart]="chartOptions.chart!"
          [labels]="labels()"
          [colors]="chartOptions.colors!"
          [legend]="chartOptions.legend!"
          [dataLabels]="chartOptions.dataLabels!"
          [plotOptions]="chartOptions.plotOptions!"
          [stroke]="chartOptions.stroke!"
          [tooltip]="chartOptions.tooltip!"
        ></apx-chart>
      </div>

      <div class="mt-6 space-y-3">
        @for (label of labels(); track $index) {
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" [style.background-color]="chartOptions.colors![$index]"></span>
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

    chartOptions: any = {
        chart: {
            type: 'donut',
            height: 240,
            fontFamily: 'inherit'
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
                        name: { show: true, offsetY: 20 },
                        value: {
                            show: true,
                            fontSize: '24px',
                            fontWeight: 'bold',
                            offsetY: -20,
                            formatter: (val: string) => val + '%'
                        },
                        total: {
                            show: true,
                            label: 'Apparel',
                            formatter: () => '45%'
                        }
                    }
                }
            }
        },
        legend: { show: false },
        tooltip: { enabled: true }
    };

    currencyFormat(val: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }
}
