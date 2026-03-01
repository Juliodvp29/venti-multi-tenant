import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal, computed } from '@angular/core';
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
    <header class="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
            <!-- Logo & Title -->
            <a routerLink="/store" queryParamsHandling="preserve" class="flex items-center gap-3 group">
                @if (branding()?.logo_url) {
                    <div class="h-10 w-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-1 flex-shrink-0">
                        <img [src]="branding()?.logo_url" alt="Logo" class="w-full h-full object-contain">
                    </div>
                }
                <span class="text-xl font-black tracking-tight group-hover:opacity-80 transition-opacity" [style.color]="'var(--primary-color)'">
                   {{ branding()?.business_name || 'Venti Store' }}
                </span>
            </a>
            
            <!-- Desktop Nav -->
            <nav class="hidden md:flex items-center gap-8">
               @for (link of navigation(); track link.label) {
                   <a [routerLink]="link.url" queryParamsHandling="preserve" class="text-sm font-bold text-slate-600 hover:text-slate-900">
                       {{ link.label }}
                   </a>
               }
            </nav>

            <!-- Actions -->
            <div class="flex items-center gap-2 md:gap-4">
                <button class="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>

                <!-- Auth Icon -->
                @if (user()) {
                    <div class="flex items-center gap-3 pl-2">
                        <button (click)="onLogout()" class="hidden md:block text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                            Logout
                        </button>
                        <div class="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 border-2 border-slate-50 shadow-sm">
                            <span class="font-black text-sm uppercase">{{ user()?.email?.[0] || 'U' }}</span>
                        </div>
                    </div>
                } @else {
                    <button (click)="customerAuth.openLogin()" class="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span class="hidden md:block text-xs font-black uppercase tracking-widest text-slate-900">Login</span>
                    </button>
                }
                
                <button (click)="openCart.emit()" class="relative p-2.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    @if (cartCount() > 0) {
                        <span class="absolute -top-1 -right-1 h-5 w-5 bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm scale-in">
                            {{ cartCount() }}
                        </span>
                    }
                </button>
            </div>
        </div>
    </header>

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
    readonly navigation = computed(() => this.tenantService.storefrontLayout().navigation || []);
    readonly cartCount = this.cartService.count;
    readonly user = this.authService.user;

    onLogout() {
        this.authService.signOut();
    }

    onAuthenticated() {
        this.customerAuth.ensureCustomer();
    }
}
