import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-usage-progress',
    imports: [CommonModule],
    template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        <span>{{ label }}</span>
        <span>{{ used }} / {{ limit >= 9999 ? '∞' : limit }}</span>
      </div>
      
      <div class="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div 
          class="h-full transition-all duration-500 rounded-full"
          [class.bg-indigo-500]="percentage < 80"
          [class.bg-amber-500]="percentage >= 80 && percentage < 100"
          [class.bg-red-500]="percentage >= 100"
          [style.width.%]="percentage > 100 ? 100 : percentage"
        ></div>
      </div>

      @if (percentage >= 100) {
        <p class="text-[10px] font-bold text-red-500 uppercase tracking-tighter animate-pulse">
            Límite alcanzado. ¡Mejora tu plan!
        </p>
      }
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageProgress {
    @Input({ required: true }) label!: string;
    @Input({ required: true }) used!: number;
    @Input({ required: true }) limit!: number;

    get percentage(): number {
        if (!this.limit || this.limit === 0) return 0;
        return (this.used / this.limit) * 100;
    }
}
