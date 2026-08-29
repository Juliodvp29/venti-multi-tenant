import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { BillingPlan } from '@core/models/billing.model';

@Component({
  selector: 'app-plan-card',
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div
      class="relative flex flex-col p-8 bg-white dark:bg-gray-900 rounded-2xl border-2 transition-all duration-300"
      [class.border-sky-600]="plan().isRecommended"
      [class.border-gray-100]="!plan().isRecommended"
      [class.dark:border-gray-800]="!plan().isRecommended"
      [class.shadow-xl]="plan().isRecommended"
      [class.shadow-md]="!plan().isRecommended"
    >
      <!-- Recommended Badge -->
      @if (plan().isRecommended) {
        <div
          class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-sky-600 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg"
        >
          Recomendado
        </div>
      }

      <div class="mb-6">
        <h3 class="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {{ plan().name }}
        </h3>
        <div class="mt-4 flex flex-wrap items-baseline gap-x-1 gap-y-0">
          <span
            class="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white break-words"
          >
            {{ plan().price | currency: plan().currency : 'symbol' : '1.0-0' }}
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400">/mo</span>
        </div>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400 h-10 line-clamp-2">
          {{ plan().description }}
        </p>
      </div>

      <button
        (click)="onUpgrade.emit(plan().id)"
        [disabled]="isCurrent() || isLoading()"
        class="w-full py-3 px-6 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        [class.bg-sky-600]="!isCurrent()"
        [class.text-white]="!isCurrent()"
        [class.hover:bg-sky-700]="!isCurrent()"
        [class.bg-gray-100]="isCurrent()"
        [class.dark:bg-gray-800]="isCurrent()"
        [class.text-gray-500]="isCurrent()"
      >
        {{ isCurrent() ? 'Plan actual' : 'Cambiar a ' + plan().name }}
      </button>

      <ul class="mt-8 space-y-4 flex-1">
        @for (feature of plan().features; track feature) {
          <li class="flex items-start gap-3">
            <svg
              class="w-5 h-5 text-sky-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span class="text-sm text-gray-600 dark:text-gray-300 font-medium">{{ feature }}</span>
          </li>
        }
      </ul>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCard {
  readonly plan = input.required<BillingPlan>();
  readonly isCurrent = input(false);
  readonly isLoading = input(false);
  readonly onUpgrade = output<string>();
}
