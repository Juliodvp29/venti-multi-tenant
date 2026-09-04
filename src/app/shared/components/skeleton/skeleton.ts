import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Bloque base de skeleton (shimmer).
 * Uso: <app-skeleton height="h-4" width="w-1/2" rounded="rounded" />
 */
@Component({
  selector: 'app-skeleton',
  imports: [CommonModule],
  template: `<div role="status" aria-hidden="true" [ngClass]="classes()"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton {
  readonly width = input<string>('w-full');
  readonly height = input<string>('h-4');
  readonly rounded = input<string>('rounded');
  readonly className = input<string>('');

  readonly classes = computed(
    () =>
      `animate-pulse bg-slate-200 dark:bg-slate-800 ${this.width()} ${this.height()} ${this.rounded()} ${this.className()}`,
  );
}
