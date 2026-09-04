import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton de tabla que imita la estructura de `DynamicTable`
 * (cabecera + filas con celdas) para evitar saltos de layout.
 *
 * Uso:
 * ```html
 * @if (isLoading()) {
 *   <app-table-skeleton [rows]="8" [columns]="5" />
 * }
 * ```
 */
@Component({
  selector: 'app-table-skeleton',
  imports: [CommonModule],
  template: `
    <div
      role="status"
      aria-label="Cargando datos de la tabla"
      class="overflow-hidden animate-pulse"
    >
      <span class="sr-only">Cargando...</span>
      <!-- Cabecera simulada -->
      @if (showHeader()) {
        <div
          class="border-y border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 px-6 py-3.5 flex gap-4"
          aria-hidden="true"
        >
          @for (col of headerCells(); track $index) {
            <div class="h-3 flex-1 rounded bg-slate-200 dark:bg-slate-800"></div>
          }
        </div>
      }
      <!-- Filas simuladas -->
      <div
        class="divide-y divide-gray-50 dark:divide-gray-800/80 bg-white dark:bg-transparent px-6"
        aria-hidden="true"
      >
        @for (row of bodyRows(); track $index) {
          <div class="flex items-center gap-4 py-4">
            @if (showAvatar()) {
              <div class="h-10 w-10 flex-shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            }
            @for (col of bodyCells(); track $index) {
              <div class="flex-1 space-y-2">
                <div class="h-3 rounded bg-slate-200 dark:bg-slate-800 w-3/4"></div>
                @if ($index === 0) {
                  <div class="h-2 rounded bg-slate-100 dark:bg-slate-800/60 w-1/2"></div>
                }
              </div>
            }
            @if (showActions()) {
              <div class="h-8 w-8 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800/60"></div>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSkeleton {
  readonly rows = input<number>(8);
  readonly columns = input<number>(5);
  readonly showHeader = input<boolean>(true);
  readonly showAvatar = input<boolean>(false);
  readonly showActions = input<boolean>(true);

  readonly headerCells = computed(() => Array.from({ length: Math.max(1, this.columns()) }));
  readonly bodyRows = computed(() => Array.from({ length: Math.max(1, this.rows()) }));
  readonly bodyCells = computed(() => Array.from({ length: Math.max(1, this.columns()) }));
}
