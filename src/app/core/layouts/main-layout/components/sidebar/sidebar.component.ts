import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { HasRoleDirective } from '@shared/directives/has-role.directive';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, HasRoleDirective],
  template: `
    <aside 
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:flex-col"
      [class.translate-x-0]="isOpen"
      [class.-translate-x-full]="!isOpen"
    >
      <!-- Logo -->
      <div class="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-800 px-6">
        <svg viewBox="0 0 500 150" class="h-10 w-auto" style="font-family: 'Outfit', sans-serif;">
          <defs>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&display=swap');
            </style>
          </defs>
          <g transform="translate(10, 5)">
            <path d="M 35 45 L 65 92 L 95 45 L 145 45" class="stroke-indigo-600 dark:stroke-indigo-400" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            <circle cx="50" cy="112" r="7.5" class="fill-indigo-600 dark:fill-indigo-400" />
            <circle cx="80" cy="112" r="7.5" class="fill-indigo-600 dark:fill-indigo-400" />
          </g>

          <text x="105" y="100">
            <tspan class="fill-indigo-600 dark:fill-indigo-400" font-weight="700" font-size="64px">enti </tspan>
            <tspan class="fill-gray-900 dark:fill-white" font-weight="800" font-size="64px">Shop</tspan>
          </text>
        </svg>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <a *appHasRole="['viewer', 'editor']"
          routerLink="/dashboard" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </a>

        <a *appHasRole="['viewer', 'editor']"
          routerLink="/products" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Catalogo de Productos
        </a>

        <a *appHasRole="['editor']"
          routerLink="/inventory-history" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Movimientos de Stock
        </a>

        <a *appHasRole="['viewer', 'editor', 'delivery']"
          routerLink="/orders" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Ordenes
        </a>
        
        <a *appHasRole="['editor']"
          routerLink="/customers" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
         <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Clientes
        </a>

        <a *appHasRole="[]"
          routerLink="/members" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Equipo
        </a>

        <a *appHasRole="['editor']"
          routerLink="/coupons" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Cupones
        </a>

        <a *appHasRole="['editor']"
          routerLink="/abandoned-carts" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Carritos Abandonados
        </a>

        <a *appHasRole="['editor']"
          routerLink="/reports" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Reportes BI
        </a>

        <a *appHasRole="['editor']"
          routerLink="/reviews" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Reseñas
        </a>
        
        <a *appHasRole="['owner']"
          routerLink="/subscription" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Mi Suscripción
        </a>

        <a *appHasRole="[]"
          routerLink="/settings" 
          routerLinkActive="bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" 
          class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-colors"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configuración
        </a>
      </nav>

      <!-- Logout Button (Bottom) -->
      <div class="border-t border-gray-200 dark:border-gray-800 p-4">
        <button 
          (click)="onLogout()"
          class="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
        >
          <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @Input() isOpen = false;

  async onLogout() {
    await this.authService.signOut();
    this.router.navigate(['/auth/login']);
  }
}
