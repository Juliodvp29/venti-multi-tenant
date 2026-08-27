import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth';
import { PermissionsService, AppModule } from '@core/services/permissions';
import { TenantService } from '@core/services/tenant';

interface NavItem {
  label: string;
  link: string;
  icon: string | SafeHtml;
  permission: AppModule;
  badge?: string;
  showBadge?: () => boolean;
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:flex-col"
      [class.w-64]="!isCollapsed"
      [class.w-20]="isCollapsed"
      [class.translate-x-0]="isOpen"
      [class.-translate-x-full]="!isOpen"
    >
      <!-- Logo & Toggle -->
      <div
        class="flex items-center h-16 relative transition-all duration-300"
        [class.border-b]="!isCollapsed"
        [class.border-gray-200]="!isCollapsed"
        [class.dark:border-gray-800]="!isCollapsed"
        [class.px-4]="!isCollapsed"
        [class.px-0]="isCollapsed"
      >
        <div
          class="flex items-center gap-3 transition-opacity duration-300"
          [class.opacity-0]="isCollapsed"
          [class.invisible]="isCollapsed"
        >
          <svg viewBox="0 0 520 150" class="h-10 w-auto" style="font-family: 'Plus Jakarta Sans', sans-serif;">
            <defs>
              <linearGradient id="ventiGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0284c7" />
                <stop offset="100%" stop-color="#38bdf8" />
              </linearGradient>
            </defs>

            <!-- Icono: V tipo checkmark con trazos redondeados -->
            <g transform="translate(15, 10)">
              <path
                d="M 12 45 L 45 100 L 90 15"
                stroke="url(#ventiGradient)"
                stroke-width="30"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              />
            </g>

            <text x="150" y="100">
              <tspan
                class="fill-gray-900 dark:fill-white italic"
                font-weight="800"
                font-size="58px"
              >
                Venti Shop
              </tspan>
            </text>
          </svg>
        </div>

        <!-- Collapse Toggle Button -->
        <button
          (click)="toggleCollapse.emit()"
          class="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 transition-all hover:scale-110"
          [class.right-2]="!isCollapsed"
          [class.left-1/2]="isCollapsed"
          [class.-translate-x-1/2]="isCollapsed"
        >
          <svg
            class="h-4 w-4 transition-transform duration-300"
            [class.rotate-180]="isCollapsed"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <!-- Delivery restricted banner -->
      @if (permissions.isDeliveryUser() && !isCollapsed) {
        <div
          class="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 flex items-center gap-2 overflow-hidden animate-in fade-in duration-300"
        >
          <svg
            class="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <p class="text-xs text-amber-700 dark:text-amber-300 font-medium truncate">
            Acceso restringido
          </p>
        </div>
      }

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-2 custom-scrollbar">
        @for (item of navItems; track item.label) {
          @if (permissions.canAccess(item.permission)) {
            <a
              [routerLink]="item.link"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.link === '/dashboard' }"
              class="flex items-center py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group transition-all duration-200 [&.active]:bg-sky-50 [&.active]:text-sky-600 dark:[&.active]:bg-gray-800 dark:[&.active]:text-sky-400"
              [class.px-3]="!isCollapsed"
              [class.justify-center]="isCollapsed"
              [class.w-12]="isCollapsed"
              [class.mx-auto]="isCollapsed"
              [title]="isCollapsed ? item.label : ''"
            >
              <div class="shrink-0" [class.mr-3]="!isCollapsed" [innerHTML]="item.icon"></div>
              @if (!isCollapsed) {
                <span class="truncate animate-in fade-in slide-in-from-left-1 duration-200">{{
                  item.label
                }}</span>
                @if (item.badge && item?.showBadge()) {
                  <span
                    class="ml-auto text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter"
                    >{{ item.badge }}</span
                  >
                }
              }
            </a>
          }
        }
      </nav>

      <!-- Bottom Actions -->
      <div class="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
        @if (!isCollapsed && tenantService.memberRole()) {
          <div
            class="flex items-center px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-in fade-in duration-300"
          >
            <svg
              class="h-4 w-4 mr-2.5 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span
              class="text-xs text-gray-500 dark:text-gray-400 capitalize font-bold tracking-tight truncate"
              [title]="tenantService.memberRole()"
              >{{ authService.user()?.email }}</span
            >
          </div>
        }

        <button
          (click)="onLogout()"
          class="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all group"
          [class.justify-center]="isCollapsed"
          [title]="isCollapsed ? 'Cerrar Sesión' : ''"
        >
          <svg
            class="shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400"
            [class.mr-3]="!isCollapsed"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          @if (!isCollapsed) {
            <span class="animate-in fade-in slide-in-from-left-1 duration-200">Cerrar Sesión</span>
          }
        </button>
      </div>
    </aside>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.2);
        border-radius: 10px;
      }
    `,
  ],
})
export class SidebarComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly permissions = inject(PermissionsService);
  readonly tenantService = inject(TenantService);

  @Input() isOpen = false;
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  readonly navItems: NavItem[] = (
    [
      {
        label: 'Inicio',
        link: '/dashboard',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
        permission: 'dashboard',
      },
      {
        label: 'Catálogo de Productos',
        link: '/products',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>',
        permission: 'products',
      },
      {
        label: 'Movimientos de Stock',
        link: '/inventory-history',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>',
        permission: 'inventory-history',
      },
      {
        label: 'Pedidos',
        link: '/orders',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>',
        permission: 'orders',
        badge: 'Tu acceso',
        showBadge: () => this.permissions.isDeliveryUser(),
      },
      {
        label: 'Clientes',
        link: '/customers',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
        permission: 'customers',
      },
      {
        label: 'Equipo',
        link: '/members',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>',
        permission: 'members',
      },
      {
        label: 'Cupones',
        link: '/coupons',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>',
        permission: 'coupons',
      },
      {
        label: 'Carritos Abandonados',
        link: '/abandoned-carts',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>',
        permission: 'abandoned-carts',
      },
      {
        label: 'Reportes',
        link: '/reports',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
        permission: 'reports',
      },
      {
        label: 'Comisiones',
        link: '/commissions',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182C9.464 5.781 10.232 6 11 6c.776 0 1.579-.22 2.243-.659.855-.558 1.873-.659 2.756-.275a48.215 48.215 0 015.111 5.5" /></svg>',
        permission: 'commissions',
      },
      {
        label: 'Reseñas',
        link: '/reviews',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976 2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976 2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>',
        permission: 'reviews',
      },
      {
        label: 'Mi Suscripción',
        link: '/subscription',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>',
        permission: 'subscription',
      },
      {
        label: 'Configuración',
        link: '/settings',
        icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
        permission: 'settings',
      },
    ] as NavItem[]
  ).map((item) => ({ ...item, icon: this.sanitizer.bypassSecurityTrustHtml(item.icon as string) }));

  async onLogout() {
    await this.authService.signOut();
    this.router.navigate(['/auth/login']);
  }
}
