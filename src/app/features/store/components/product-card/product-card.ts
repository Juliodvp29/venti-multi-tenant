import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '@core/models/product';
import { ThemeTokens } from '@core/models/theme.model';
import { CartService } from '@core/services/cart';
import { AnalyticsService } from '@core/services/analytics';
import { TenantService } from '@core/services/tenant';

@Component({
    selector: 'app-product-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="overflow-hidden transition-all duration-500 group relative"
         [class.flex]="true"
         [class.flex-col]="orientation() === 'vertical'"
         [class.h-full]="orientation() === 'vertical'"
         [class.sm:flex-row]="orientation() === 'horizontal'"
         [class.items-stretch]="orientation() === 'horizontal'"
         [class.border]="borderStyle() === 'bordered'"
         [class.border-0]="borderStyle() !== 'bordered'"
         [class.shadow-none]="borderStyle() === 'flat' || borderStyle() === 'borderless'"
         [class.shadow-md]="borderStyle() === 'shadow'"
         [class.hover:shadow-xl]="borderStyle() === 'shadow' || borderStyle() === 'bordered'"
         [style.background-color]="'var(--store-color-surface, #ffffff)'"
         [style.border-color]="'var(--store-color-border, #e5e5e5)'"
         [style.border-radius]="'var(--store-radius-card, 1rem)'"
         [style.box-shadow]="borderStyle() === 'shadow' ? 'var(--store-shadow, 0 10px 25px -5px rgba(0,0,0,0.1))' : undefined"
         [style.border-width]="borderStyle() === 'bordered' ? 'var(--store-border-width, 1px)' : '0px'">
        
        <!-- Image Area -->
        <div class="bg-slate-50 dark:bg-gray-800/50 relative overflow-hidden shrink-0"
             [class.w-full]="orientation() === 'vertical'"
             [class.sm:w-48]="orientation() === 'horizontal'"
             [class.md:w-56]="orientation() === 'horizontal'"
             [ngClass]="imageAspectClass()"
             [style.border-radius]="orientation() === 'horizontal' ? 'var(--store-radius-card, 1rem) 0 0 var(--store-radius-card, 1rem)' : 'var(--store-radius-card, 1rem)'">
            
            <a [routerLink]="['/store/product', product.id]" queryParamsHandling="preserve" class="block w-full h-full cursor-pointer relative">
                <!-- Primary Image -->
                <img [src]="primaryImage()" 
                     [alt]="product.name" 
                     loading="lazy"
                     class="w-full h-full object-cover object-top transition-all duration-700"
                     [class.group-hover:scale-105]="!hoverSecondaryImage() || !secondaryImage()"
                     [class.group-hover:opacity-0]="hoverSecondaryImage() && secondaryImage()">

                <!-- Secondary Image on Hover -->
                @if (hoverSecondaryImage() && secondaryImage()) {
                    <img [src]="secondaryImage()" 
                         [alt]="product.name + ' - Vista 2'" 
                         loading="lazy"
                         class="w-full h-full object-cover object-top absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700">
                }
            </a>
            
            <!-- Badges Area (Top Left) -->
            <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                <!-- Sale Badge -->
                @if (showSaleBadge() && hasDiscount()) {
                    <span class="text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-wider shadow-sm"
                          [style.background-color]="'var(--store-color-accent, #ef4444)'"
                          [style.border-radius]="'var(--store-radius-badge, 9999px)'">
                        Oferta
                    </span>
                }

                <!-- Discount Percentage Badge -->
                @if (showDiscountBadge() && discountPercent()) {
                    <span class="text-white text-[10px] font-black px-2 py-0.5 shadow-sm"
                          [style.background-color]="'var(--store-color-primary, #0f172a)'"
                          [style.border-radius]="'var(--store-radius-badge, 9999px)'">
                        -{{ discountPercent() }}%
                    </span>
                }

                <!-- New Badge -->
                @if (showNewBadge() && isNew()) {
                    <span class="text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-wider shadow-sm bg-indigo-600"
                          [style.border-radius]="'var(--store-radius-badge, 9999px)'">
                        Nuevo
                    </span>
                }
            </div>

            <!-- Icon Only Cart Button (Top / Bottom Right Floating) -->
            @if (cartButtonStyle() === 'icon_only') {
                <div class="absolute bottom-3 right-3 z-10">
                    <button 
                        (click)="addToCart($event)" 
                        title="Añadir al Carrito"
                        class="w-10 h-10 rounded-full shadow-lg transition-transform active:scale-90 flex items-center justify-center cursor-pointer text-white"
                        [style.background-color]="added() ? '#10b981' : 'var(--store-color-primary, #0f172a)'">
                        @if (added()) {
                            <svg class="w-5 h-5 animate-in zoom-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                            </svg>
                        } @else {
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        }
                    </button>
                </div>
            }

            <!-- Quick Action Overlay on Hover -->
            @if (cartButtonStyle() === 'hover') {
                <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                    @if (!product.variants?.length) {
                        <button 
                            (click)="addToCart($event)" 
                            class="w-full py-2.5 sm:py-3 font-bold text-xs sm:text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-white"
                            [style.border-radius]="'var(--store-radius-btn, 0.75rem)'"
                            [style.text-transform]="'var(--store-btn-transform, none)'"
                            [style.background-color]="added() ? '#10b981' : 'var(--store-color-primary, #0f172a)'">
                            
                            @if (added()) {
                                <svg class="w-4 h-4 sm:w-5 sm:h-5 animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                </svg>
                                ¡Añadido!
                            } @else {
                                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Añadir al Carrito
                            }
                        </button>
                    } @else {
                        <a [routerLink]="['/store/product', product.id]" queryParamsHandling="preserve"
                           class="w-full py-2.5 sm:py-3 font-bold text-xs sm:text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-white"
                           [style.border-radius]="'var(--store-radius-btn, 0.75rem)'"
                           [style.text-transform]="'var(--store-btn-transform, none)'"
                           [style.background-color]="'var(--store-color-primary, #0f172a)'">
                            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver Opciones
                        </a>
                    }
                </div>
            }
        </div>

        <!-- Info Area -->
        <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
            <div>
                <h3 class="font-bold text-base sm:text-lg leading-tight transition-colors mb-1"
                    [style.color]="'var(--store-color-text, #0a0a0a)'"
                    [style.font-family]="'var(--store-font-heading)'">
                    <a [routerLink]="['/store/product', product.id]" queryParamsHandling="preserve" class="hover:underline">
                        {{ product.name }}
                    </a>
                </h3>

                @if (product.sku) {
                    <p class="text-[11px] font-medium uppercase tracking-widest"
                       [style.color]="'var(--store-color-muted, #737373)'">
                        {{ product.sku }}
                    </p>
                }

                <!-- Stock Indicator -->
                @if (showStock()) {
                    <div class="mt-2 flex items-center gap-1.5 text-xs font-semibold">
                        @if (product.track_inventory) {
                            @if (product.stock_quantity > 0) {
                                <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span class="text-emerald-600 dark:text-emerald-400">{{ product.stock_quantity }} en stock</span>
                            } @else {
                                <span class="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                                <span class="text-rose-600 dark:text-rose-400">Agotado</span>
                            }
                        } @else {
                            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span class="text-emerald-600 dark:text-emerald-400">Disponible</span>
                        }
                    </div>
                }
            </div>
            
            <div class="mt-auto pt-2">
                <div class="flex items-end justify-between gap-2">
                    <!-- Price Block -->
                    @if (showPrice()) {
                        <div class="flex flex-col">
                            @if (showOriginalPrice() && product.compare_at_price) {
                                <span class="text-xs line-through mb-0.5"
                                      [style.color]="'var(--store-color-muted, #737373)'">
                                    {{ product.compare_at_price | currency }}
                                </span>
                            }
                            <span class="text-lg sm:text-xl font-black" [style.color]="'var(--primary-color, var(--store-color-primary))'">
                                {{ product.price | currency }}
                            </span>
                        </div>
                    }

                    <a [routerLink]="['/store/product', product.id]" queryParamsHandling="preserve" 
                       class="p-2 transition-colors hover:opacity-75"
                       [style.color]="'var(--store-color-muted, #737373)'">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </div>

                <!-- Always Visible Cart Button -->
                @if (cartButtonStyle() === 'always') {
                    <div class="mt-3">
                        @if (!product.variants?.length) {
                            <button 
                                (click)="addToCart($event)" 
                                class="w-full py-2.5 font-bold text-xs sm:text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-white"
                                [style.border-radius]="'var(--store-radius-btn, 0.75rem)'"
                                [style.text-transform]="'var(--store-btn-transform, none)'"
                                [style.background-color]="added() ? '#10b981' : 'var(--store-color-primary, #0f172a)'">
                                @if (added()) {
                                    <svg class="w-4 h-4 animate-in zoom-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                    ¡Añadido!
                                } @else {
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    Añadir al Carrito
                                }
                            </button>
                        } @else {
                            <a [routerLink]="['/store/product', product.id]" queryParamsHandling="preserve"
                               class="w-full py-2.5 font-bold text-xs sm:text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-white"
                               [style.border-radius]="'var(--store-radius-btn, 0.75rem)'"
                               [style.text-transform]="'var(--store-btn-transform, none)'"
                               [style.background-color]="'var(--store-color-primary, #0f172a)'">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Ver Opciones
                            </a>
                        }
                    </div>
                }
            </div>
        </div>
    </div>
  `,
})
export class ProductCard {
    @Input({ required: true }) product!: Product;
    @Input() config?: Partial<ThemeTokens>;

    private readonly cartService = inject(CartService);
    private readonly analytics = inject(AnalyticsService);
    private readonly tenantService = inject(TenantService);

    readonly added = signal(false);

    readonly activeTokens = computed<Partial<ThemeTokens>>(() => {
        const storeTokens = this.tenantService.themeTokens();
        return { ...(storeTokens || {}), ...(this.config || {}) };
    });

    readonly orientation = computed(() => this.activeTokens().card_orientation ?? 'vertical');
    readonly borderStyle = computed(() => this.activeTokens().card_border_style ?? 'bordered');
    readonly showPrice = computed(() => this.activeTokens().card_show_price ?? true);
    readonly showOriginalPrice = computed(() => this.activeTokens().card_show_original_price ?? true);
    readonly showDiscountBadge = computed(() => this.activeTokens().card_show_discount_badge ?? true);
    readonly showStock = computed(() => this.activeTokens().card_show_stock ?? false);
    readonly showNewBadge = computed(() => this.activeTokens().card_show_new_badge ?? true);
    readonly showSaleBadge = computed(() => this.activeTokens().card_show_sale_badge ?? true);
    readonly cartButtonStyle = computed(() => this.activeTokens().card_cart_button_style ?? 'hover');
    readonly hoverSecondaryImage = computed(() => this.activeTokens().card_hover_secondary_image ?? true);

    readonly imageAspectClass = computed(() => {
        const aspect = this.activeTokens().card_image_aspect;
        switch (aspect) {
            case '1/1': return 'aspect-square';
            case '3/4': return 'aspect-[3/4]';
            case '16/9': return 'aspect-video';
            case '4/5':
            default:
                return 'aspect-[4/5]';
        }
    });

    readonly primaryImage = computed(() => {
        return this.product.images?.[0]?.url || this.product.primary_image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
    });

    readonly secondaryImage = computed(() => {
        return this.product.images?.[1]?.url || null;
    });

    readonly hasDiscount = computed(() => {
        return !!(this.product.compare_at_price && this.product.compare_at_price > this.product.price);
    });

    readonly discountPercent = computed(() => {
        if (this.hasDiscount() && this.product.compare_at_price) {
            return Math.round(((this.product.compare_at_price - this.product.price) / this.product.compare_at_price) * 100);
        }
        return null;
    });

    readonly isNew = computed(() => {
        if (!this.product.created_at) return false;
        const diffDays = (Date.now() - new Date(this.product.created_at).getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
    });

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

