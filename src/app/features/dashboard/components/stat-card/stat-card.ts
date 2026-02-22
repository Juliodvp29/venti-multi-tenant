import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div class="flex items-center justify-between mb-4">
        <div 
          class="flex items-center justify-center w-12 h-12 rounded-xl"
          [ngClass]="iconBgClass()"
        >
          <ng-content select="[icon]"></ng-content>
        </div>
        
        @if (trend(); as t) {
          <div 
            class="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
            [ngClass]="t.value >= 0 ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-3 w-3" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              stroke-width="3"
            >
              @if (t.value >= 0) {
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
              }
            </svg>
            {{ t.value >= 0 ? '+' : '' }}{{ t.value }}%
          </div>
        }
      </div>
      
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ label() }}</p>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ value() }}</h3>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
    label = input.required<string>();
    value = input.required<string | number | null>();
    trend = input<{ value: number } | null>(null);
    iconBgClass = input<string>('bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400');
}
