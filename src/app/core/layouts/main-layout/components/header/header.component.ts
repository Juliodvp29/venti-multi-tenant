import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { TenantService } from '@core/services/tenant';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8"
    >
      <!-- Mobile menu button -->
      <button
        type="button"
        class="md:hidden -ml-2 mr-2 p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500"
        (click)="toggleSidebar.emit()"
      >
        <span class="sr-only">Open sidebar</span>
        <svg
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <div class="flex-1 flex justify-between items-center">
        <div class="flex-1 flex">
          <!-- Search bar could go here -->
        </div>
        <div class="ml-4 flex items-center gap-4 md:ml-6">
          <!-- View Store Link -->
          <a
            [href]="tenantService.storeUrl()"
            target="_blank"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors border border-sky-100 dark:border-sky-900/50"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span class="hidden sm:inline">Ver Tienda</span>
          </a>

          <button
            type="button"
            class="bg-white dark:bg-gray-800 p-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:ring-offset-gray-900"
          >
            <span class="sr-only">Ver notificaciones</span>
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly toggleSidebar = output<void>();
  protected readonly tenantService = inject(TenantService);
}
