import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostListener,
    Output,
    computed,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { CartService } from '@core/services/cart';
import { AuthService } from '@core/services/auth';
import { CustomerAuthService } from '@core/services/customer-auth';
import { CustomerAuthModal } from '@shared/components/customer-auth-modal/customer-auth-modal';

@Component({
    selector: 'app-store-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, RouterLink, CustomerAuthModal],
    template: `
    <header
        [class.sticky]="isSticky()"
        [class.top-0]="isSticky()"
        [class.z-40]="isSticky()"
        [style.background-color]="(!isTransparent() || scrolledPastHero()) ? (branding()?.header_color || 'var(--store-color-header, #ffffff)') : 'transparent'"
        [style.border-color]="(isTransparent() && !scrolledPastHero()) ? 'transparent' : ''"
        class="border-b border-slate-200/80 transition-all duration-300 backdrop-blur-md"
        [class.backdrop-blur-none]="isTransparent() && !scrolledPastHero()"
        [class.shadow-sm]="scrolledPastHero()">

        <div class="mx-auto px-4 h-16 md:h-20 flex items-center gap-4"
             [style.max-width]="'var(--store-max-width, 1280px)'"
             [class.justify-between]="logoPosition() !== 'center'"
             [class.relative]="logoPosition() === 'center'">

            <!-- ===== LOGO LEFT / RIGHT ===== -->
            @if (logoPosition() !== 'center') {
                <a routerLink="/store" queryParamsHandling="preserve"
                   class="flex items-center gap-3 group flex-shrink-0"
                   [class.order-last]="logoPosition() === 'right'">
                    @if (branding()?.logo_url) {
                        <div class="overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-1 flex-shrink-0"
                             [class]="logoSizeClass()">
                            <img [src]="branding()?.logo_url" alt="Logo" class="w-full h-full object-contain">
                        </div>
                    }
                    <span class="text-xl font-extrabold tracking-tight group-hover:opacity-80 transition-opacity"
                          [style.color]="(isTransparent() && !scrolledPastHero()) ? '#ffffff' : 'var(--store-color-primary, #0a0a0a)'"
                          [style.font-family]="'var(--store-font-heading)'">
                        {{ branding()?.business_name || 'Venti Store' }}
                    </span>
                </a>

                @if (!isHamburger()) {
                    <nav class="hidden md:flex items-center" [class]="navSpacingClass()">
                        @for (link of navigation(); track link.label) {
                            <a [routerLink]="link.url" queryParamsHandling="preserve"
                               class="text-sm font-semibold transition-colors"
                               [class.text-white]="isTransparent() && !scrolledPastHero()"
                               [class.text-slate-600]="!isTransparent() || scrolledPastHero()"
                               [class.hover:text-slate-900]="!isTransparent() || scrolledPastHero()">
                                {{ link.label }}
                            </a>
                        }
                        @if (showSocials()) {
                            <div class="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
                                <ng-container *ngTemplateOutlet="socialsTemplate"></ng-container>
                            </div>
                        }
                    </nav>
                }

                <div class="flex items-center gap-2 md:gap-3"
                     [class.order-first]="logoPosition() === 'right'">
                    <ng-container *ngTemplateOutlet="actionsTemplate"></ng-container>
                </div>
            }

            <!-- ===== LOGO CENTER ===== -->
            @if (logoPosition() === 'center') {
                @if (!isHamburger()) {
                    <nav class="hidden md:flex items-center flex-1" [class]="navSpacingClass()">
                        @for (link of navigation().slice(0, halfNav()); track link.label) {
                            <a [routerLink]="link.url" queryParamsHandling="preserve"
                               class="text-sm font-semibold transition-colors"
                               [class.text-white]="isTransparent() && !scrolledPastHero()"
                               [class.text-slate-600]="!isTransparent() || scrolledPastHero()"
                               [class.hover:text-slate-900]="!isTransparent() || scrolledPastHero()">
                                {{ link.label }}
                            </a>
                        }
                    </nav>
                }

                <a routerLink="/store" queryParamsHandling="preserve"
                   class="flex items-center gap-3 group flex-shrink-0 absolute left-1/2 -translate-x-1/2">
                    @if (branding()?.logo_url) {
                        <div class="overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-1 flex-shrink-0"
                             [class]="logoSizeClass()">
                            <img [src]="branding()?.logo_url" alt="Logo" class="w-full h-full object-contain">
                        </div>
                    }
                    <span class="text-xl font-extrabold tracking-tight group-hover:opacity-80 transition-opacity"
                          [style.color]="(isTransparent() && !scrolledPastHero()) ? '#ffffff' : 'var(--store-color-primary, #0a0a0a)'"
                          [style.font-family]="'var(--store-font-heading)'">
                        {{ branding()?.business_name || 'Venti Store' }}
                    </span>
                </a>

                <div class="flex items-center gap-3 ml-auto">
                    @if (!isHamburger()) {
                        <nav class="hidden md:flex items-center" [class]="navSpacingClass()">
                            @for (link of navigation().slice(halfNav()); track link.label) {
                                <a [routerLink]="link.url" queryParamsHandling="preserve"
                                   class="text-sm font-semibold transition-colors"
                                   [class.text-white]="isTransparent() && !scrolledPastHero()"
                                   [class.text-slate-600]="!isTransparent() || scrolledPastHero()"
                                   [class.hover:text-slate-900]="!isTransparent() || scrolledPastHero()">
                                    {{ link.label }}
                                </a>
                            }
                            @if (showSocials()) {
                                <div class="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
                                    <ng-container *ngTemplateOutlet="socialsTemplate"></ng-container>
                                </div>
                            }
                        </nav>
                    }
                    <ng-container *ngTemplateOutlet="actionsTemplate"></ng-container>
                </div>
            }
        </div>

        <!-- Mobile Menu Dropdown -->
        @if (mobileMenuOpen()) {
            <div class="border-t border-slate-100 px-4 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200"
                 [class.md:hidden]="!isHamburger()"
                 [style.background-color]="branding()?.header_color || 'var(--store-color-header, #ffffff)'">
                @for (link of navigation(); track link.label) {
                    <a [routerLink]="link.url" queryParamsHandling="preserve"
                       (click)="mobileMenuOpen.set(false)"
                       class="block py-2 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        {{ link.label }}
                    </a>
                }
                @if (showSocials()) {
                    <div class="flex items-center gap-4 pt-3 px-3 border-t border-slate-100 mt-2">
                        <ng-container *ngTemplateOutlet="socialsTemplate"></ng-container>
                    </div>
                }
            </div>
        }
    </header>

    <!-- ===== SHARED TEMPLATES ===== -->

    <ng-template #actionsTemplate>
        @if (showSearch()) {
            <button class="p-2 transition-colors rounded-full"
                    [class.text-white]="isTransparent() && !scrolledPastHero()"
                    [class.text-slate-500]="!isTransparent() || scrolledPastHero()"
                    [class.hover:bg-slate-100]="!isTransparent() || scrolledPastHero()">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>
        }

        @if (user()) {
            <button (click)="onLogout()"
                    class="hidden md:block text-xs font-bold uppercase tracking-widest transition-colors"
                    [class.text-white/70]="isTransparent() && !scrolledPastHero()"
                    [class.text-slate-400]="!isTransparent() || scrolledPastHero()"
                    [class.hover:text-red-500]="!isTransparent() || scrolledPastHero()">
                Salir
            </button>
            <div class="h-9 w-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 border-2 border-slate-50 shadow-sm">
                <span class="font-bold text-xs uppercase">{{ user()?.email?.[0] || 'U' }}</span>
            </div>
        } @else {
            <button (click)="customerAuth.openLogin()"
                    class="p-2 rounded-full transition-colors"
                    [class.text-white]="isTransparent() && !scrolledPastHero()"
                    [class.text-slate-500]="!isTransparent() || scrolledPastHero()"
                    [class.hover:bg-slate-100]="!isTransparent() || scrolledPastHero()">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </button>
        }

        @if (showCart()) {
            <button (click)="openCart.emit()"
                    class="relative p-2.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-200"
                    [style.background-color]="'var(--store-color-primary, #0a0a0a)'"
                    [style.border-radius]="'var(--store-radius-btn, 1rem)'">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                @if (cartCount() > 0) {
                    <span class="absolute -top-1 -right-1 h-5 w-5 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm"
                          [style.background-color]="'var(--store-color-accent, #6366f1)'">
                        {{ cartCount() }}
                    </span>
                }
            </button>
        }

        <!-- Hamburger button -->
        <button (click)="mobileMenuOpen.set(!mobileMenuOpen())"
                class="p-2 rounded-lg transition-colors"
                [class.md:hidden]="!isHamburger()"
                [class.text-white]="isTransparent() && !scrolledPastHero()"
                [class.text-slate-600]="!isTransparent() || scrolledPastHero()"
                [class.hover:bg-slate-100]="!isTransparent() || scrolledPastHero()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                @if (mobileMenuOpen()) {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                }
            </svg>
        </button>
    </ng-template>

    <ng-template #socialsTemplate>
        <a href="#" target="_blank" rel="noopener" title="Instagram"
           class="transition-colors"
           [class.text-white/70]="isTransparent() && !scrolledPastHero()"
           [class.hover:text-white]="isTransparent() && !scrolledPastHero()"
           [class.text-slate-400]="!isTransparent() || scrolledPastHero()"
           [class.hover:text-slate-700]="!isTransparent() || scrolledPastHero()">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
        </a>
        <a href="#" target="_blank" rel="noopener" title="Facebook"
           class="transition-colors"
           [class.text-white/70]="isTransparent() && !scrolledPastHero()"
           [class.hover:text-white]="isTransparent() && !scrolledPastHero()"
           [class.text-slate-400]="!isTransparent() || scrolledPastHero()"
           [class.hover:text-slate-700]="!isTransparent() || scrolledPastHero()">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
        </a>
    </ng-template>

    @if (customerAuth.showModal()) {
        <app-customer-auth-modal
            (close)="customerAuth.closeModal()"
            (authenticated)="onAuthenticated()">
        </app-customer-auth-modal>
    }
  `,
})
export class StoreHeader {
    private readonly tenantService = inject(TenantService);
    private readonly cartService = inject(CartService);
    private readonly authService = inject(AuthService);
    protected readonly customerAuth = inject(CustomerAuthService);

    @Output() openCart = new EventEmitter<void>();

    readonly branding = this.tenantService.branding;
    readonly themeTokens = this.tenantService.themeTokens;
    readonly navigation = computed(() => this.tenantService.storefrontLayout().navigation || []);
    readonly cartCount = this.cartService.count;
    readonly user = this.authService.user;

    readonly mobileMenuOpen = signal(false);
    readonly scrolledPastHero = signal(false);

    // Computed header config from ThemeTokens (all with safe defaults)
    readonly logoPosition = computed(() => this.themeTokens()?.header_logo_position ?? 'left');
    readonly isSticky      = computed(() => this.themeTokens()?.header_sticky ?? true);
    readonly isTransparent = computed(() => this.themeTokens()?.header_transparent ?? false);
    readonly showSearch    = computed(() => this.themeTokens()?.header_show_search ?? true);
    readonly showCart      = computed(() => this.themeTokens()?.header_show_cart ?? true);
    readonly showSocials   = computed(() => this.themeTokens()?.header_show_socials ?? false);
    readonly isHamburger   = computed(() => this.themeTokens()?.header_hamburger ?? false);

    readonly logoSizeClass = computed(() => {
        const map: Record<string, string> = {
            sm: 'h-6 w-6',
            md: 'h-8 w-8',
            lg: 'h-10 w-10',
            xl: 'h-14 w-14',
        };
        return map[this.themeTokens()?.header_logo_size ?? 'md'];
    });

    readonly navSpacingClass = computed(() => {
        const map: Record<string, string> = {
            tight:  'gap-4',
            normal: 'gap-8',
            wide:   'gap-12',
        };
        return map[this.themeTokens()?.header_nav_spacing ?? 'normal'];
    });

    readonly halfNav = computed(() => Math.ceil(this.navigation().length / 2));

    @HostListener('window:scroll')
    onWindowScroll() {
        this.scrolledPastHero.set(window.scrollY > 80);
    }

    onLogout() {
        this.authService.signOut();
    }

    onAuthenticated() {
        this.customerAuth.ensureCustomer();
    }
}

