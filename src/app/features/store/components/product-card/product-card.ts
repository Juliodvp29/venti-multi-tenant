import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '@core/models/product';
import { CartService } from '@core/services/cart';
import { AnalyticsService } from '@core/services/analytics';

@Component({
    selector: 'app-product-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 group flex flex-col h-full">
        <!-- Image Area -->
        <div class="aspect-[4/5] bg-slate-50 relative overflow-hidden">
            @if (product.images?.[0]?.url) {
                <a [routerLink]="['/store/product', product.id]" queryParamsHandling="preserve" class="block w-full h-full cursor-pointer">
                    <img [src]="product.images?.[0]?.url" 
                         [alt]="product.name" 
                         loading="lazy"
                         class="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700">
                </a>
            }
            
            @if (product.compare_at_price) {
                <div class="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                    Oferta
                </div>
            }

            <!-- Quick Action Overlay -->
            <div class="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                @if (!product.variants?.length) {
                    <button 
                        (click)="addToCart($event)" 
                        class="w-full py-3 rounded-2xl font-bold shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        [class]="added() ? 'bg-green-500 text-white' : 'bg-white/90 backdrop-blur-sm text-slate-900 hover:bg-white'">
                        
                        @if (added()) {
                            <svg class="w-5 h-5 animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                            </svg>
                            ¡Añadido!
                        } @else {
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Añadir al Carrito
                        }
                    </button>
                } @else {
                    <a [routerLink]="['/store/product', product.id]" queryParamsHandling="preserve"
                       class="w-full py-3 rounded-2xl font-bold shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer bg-slate-900 text-white hover:bg-slate-800">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Opciones
                    </a>
                }
            </div>
        </div>

        <!-- Info -->
        <div class="p-5 flex-1 flex flex-col">
            <div class="mb-4">
                <h3 class="font-bold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors mb-1">
                    <a [routerLink]="['/store/product', product.id]" queryParamsHandling="preserve">{{ product.name }}</a>
                </h3>
                <p class="text-xs text-slate-400 font-medium uppercase tracking-widest">{{ product.sku }}</p>
            </div>
            
            <div class="mt-auto flex items-end justify-between">
                <div class="flex flex-col">
                    @if (product.compare_at_price) {
                        <span class="text-xs text-slate-400 line-through mb-0.5">{{ product.compare_at_price | currency }}</span>
                    }
                    <span class="text-xl font-black" [style.color]="'var(--primary-color)'">{{ product.price | currency }}</span>
                </div>
                
                <a [routerLink]="['/store/product', product.id]" queryParamsHandling="preserve" class="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </a>
            </div>
        </div>
    </div>
  `,
})
export class ProductCard {
    @Input({ required: true }) product!: Product;

    private readonly cartService = inject(CartService);
    private readonly analytics = inject(AnalyticsService);

    readonly added = signal(false);

    addToCart(event: Event) {
        event.stopPropagation();
        event.preventDefault();

        this.cartService.addToCart(this.product, 1);
        this.analytics.trackAddToCart(this.product.id, 1);

        // Show feedback
        this.added.set(true);
        setTimeout(() => this.added.set(false), 2000);
    }
}
