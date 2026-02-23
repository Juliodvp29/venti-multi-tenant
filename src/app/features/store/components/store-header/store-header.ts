import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { CartService } from '@core/services/cart';

@Component({
    selector: 'app-store-header',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <header class="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
            <!-- Logo & Title -->
            <a routerLink="/store" class="flex items-center gap-3 group">
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
               <a routerLink="/store" class="text-sm font-bold text-slate-600 hover:text-slate-900">Productos</a>
               <a href="#" class="text-sm font-bold text-slate-600 hover:text-slate-900">Colecciones</a>
               <a href="#" class="text-sm font-bold text-slate-600 hover:text-slate-900">Sobre Nosotros</a>
            </nav>

            <!-- Actions -->
            <div class="flex items-center gap-2 md:gap-4">
                <button class="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
                
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
  `,
})
export class StoreHeader {
    private readonly tenantService = inject(TenantService);
    private readonly cartService = inject(CartService);

    @Output() openCart = new EventEmitter<void>();

    readonly branding = this.tenantService.branding;
    readonly cartCount = this.cartService.count;
}
