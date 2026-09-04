import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton que imita la estructura de `StatCard` del dashboard
 * (icono + trend + label + valor + caption).
 *
 * Uso:
 * ```html
 * @if (isLoadingStats()) {
 *   <app-stat-card-skeleton />
 * } @else {
 *   <app-stat-card ... />
 * }
 * ```
 */
@Component({
  selector: 'app-stat-card-skeleton',
  imports: [CommonModule],
  template: `
    <div
      role="status"
      aria-label="Cargando estadística"
      class="bg-white/85 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xs animate-pulse"
    >
      <span class="sr-only">Cargando...</span>
      <div class="flex items-center justify-between mb-4" aria-hidden="true">
        <div class="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        <div class="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800/70"></div>
      </div>
      <div class="space-y-2" aria-hidden="true">
        <div class="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div class="h-8 w-32 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
        <div class="h-2.5 w-40 rounded bg-slate-100 dark:bg-slate-800/60"></div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardSkeleton {}
