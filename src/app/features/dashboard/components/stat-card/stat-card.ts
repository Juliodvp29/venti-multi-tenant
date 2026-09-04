import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  imports: [CommonModule],
  template: `
    <div
      class="bg-white/85 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xs hover:shadow-md dark:hover:shadow-none hover:-translate-y-1 hover:border-sky-500/30 dark:hover:border-sky-500/30 transition-all duration-300 group cursor-default"
    >
      <div class="flex items-center justify-between mb-4">
        <div
          class="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group-hover:scale-105"
          [ngClass]="iconBgClass()"
        >
          <ng-content select="[icon]" />
        </div>

        @if (trend(); as t) {
          <div
            class="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
            [ngClass]="
              t.value >= 0
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 dark:border-sky-500/10'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/10'
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3 transition-transform duration-300 group-hover:translate-y-[-1px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="3"
            >
              @if (t.value >= 0) {
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                />
              } @else {
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
                />
              }
            </svg>
            <span>{{ t.value >= 0 ? '+' : '' }}{{ roundValue(t.value) }}%</span>
          </div>
        }
      </div>

      <div class="space-y-1">
        <p
          class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest"
        >
          {{ label() }}
        </p>
        <h3 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
          {{ value() }}
        </h3>
        @if (caption()) {
          <p class="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {{ caption() }}
          </p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  label = input.required<string>();
  value = input.required<string | number | null>();
  trend = input<{ value: number } | null>(null);
  caption = input<string>('');
  iconBgClass = input<string>('bg-sky-50 text-sky-600 dark:bg-gray-800 dark:text-sky-400');

  public roundValue(value: number | string | null): number | null {
    return value !== null ? Math.round(Number(value)) : null;
  }
}
