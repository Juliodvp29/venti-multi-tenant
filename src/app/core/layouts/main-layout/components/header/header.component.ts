import { ChangeDetectionStrategy, Component, inject, output, viewChild } from '@angular/core';
import { TenantService } from '@core/services/tenant';
import { NotificationsDropdown } from '@shared/components/notifications-dropdown/notifications-dropdown';
import { HelpDrawer } from '@shared/components/help-drawer/help-drawer';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotificationsDropdown, HelpDrawer],
  template: `
    <header
      class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8"
    >
      <!-- Mobile menu button -->
      <button
        type="button"
        aria-label="Abrir menú lateral"
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
        <div class="ml-4 flex items-center gap-3 md:ml-6">
          <!-- View Store Link -->
          <a
            target="_blank"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors border border-sky-100 dark:border-sky-900/50"
            [href]="tenantService.storeUrl()"
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

          <!-- Help & Support Button (Supabase Style) -->
          <button
            #helpBtn
            type="button"
            aria-label="Centro de Ayuda y Soporte"
            title="Ayuda y Soporte"
            class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
            (click)="openHelp()"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <!-- Notifications Dropdown: diferido fuera del bundle inicial,
               la campana aparece tras el idle con placeholder del mismo tamaño -->
          @defer (on idle) {
            <app-notifications-dropdown />
          } @placeholder {
            <span class="h-10 w-10 rounded-full animate-pulse bg-gray-100 dark:bg-gray-800" aria-hidden="true"></span>
          }
        </div>
      </div>
    </header>

    <!-- Help & Support Drawer: diferido fuera del bundle inicial (43KB de contenido),
         se precarga en idle y abre aunque el primer clic llegue antes de cargar -->
    @defer (on interaction(helpBtn); prefetch on idle) {
      <app-help-drawer #helpDrawerRef />
    } @placeholder {
      <span></span>
    }
  `,
})
export class HeaderComponent {
  readonly toggleSidebar = output<void>();
  protected readonly tenantService = inject(TenantService);
  private readonly helpDrawer = viewChild<{ open: () => void }>('helpDrawerRef');

  openHelp(): void {
    const drawer = this.helpDrawer();
    if (drawer) {
      drawer.open();
      return;
    }
    // El chunk diferido aún no cargó: reintentar hasta que esté disponible
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const loaded = this.helpDrawer();
      if (loaded || Date.now() - startedAt > 5000) {
        clearInterval(timer);
        loaded?.open();
      }
    }, 100);
  }
}
