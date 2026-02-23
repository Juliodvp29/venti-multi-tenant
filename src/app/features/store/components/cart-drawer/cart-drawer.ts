import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '@core/services/cart';

@Component({
    selector: 'app-cart-drawer',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
    <!-- Backdrop -->
    <div (click)="close.emit()" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-300"></div>
 
    <!-- Drawer -->
    <div class="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-xl font-bold flex items-center gap-2">
                Tu Carrito
                <span class="text-sm font-medium text-slate-400">({{ items().length }} items)</span>
            </h2>
            <button (click)="close.emit()" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
            @for (item of items(); track item.id) {
                <div class="flex gap-4">
                    <div class="w-20 h-20 rounded-2xl border border-slate-100 overflow-hidden flex-shrink-0 bg-slate-50">
                        <img [src]="item.imageUrl" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col">
                        <div class="flex justify-between items-start gap-2">
                             <h4 class="font-bold text-slate-900 truncate">{{ item.name }}</h4>
                             <button (click)="cartService.removeFromCart(item.productId)" class="text-slate-300 hover:text-red-500 transition-colors">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                             </button>
                        </div>
                        <p class="text-indigo-600 font-bold text-sm mb-2">{{ item.price | currency }}</p>
                        
                        <div class="mt-auto flex items-center border border-slate-200 rounded-lg overflow-hidden w-fit bg-white">
                            <button (click)="cartService.updateQuantity(item.productId, item.quantity - 1)" class="px-2 py-1 hover:bg-slate-50">-</button>
                            <span class="px-3 py-1 text-sm font-bold">{{ item.quantity }}</span>
                            <button (click)="cartService.updateQuantity(item.productId, item.quantity + 1)" class="px-2 py-1 hover:bg-slate-50">+</button>
                        </div>
                    </div>
                </div>
            } @empty {
                <div class="h-full flex flex-col items-center justify-center text-center py-12">
                     <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 text-3xl">🛒</div>
                     <p class="font-bold text-slate-900 mb-1">Tu carrito está vacío</p>
                     <p class="text-sm text-slate-500 mb-6">¡Empieza a comprar y añade productos!</p>
                     <button (click)="close.emit()" class="text-indigo-600 font-bold hover:underline">Seguir Comprando</button>
                </div>
            }
        </div>

        <!-- Coupon Section -->
        @if (items().length > 0) {
            <div class="p-6 border-t border-slate-100">
                @if (!cartService.appliedCoupon()) {
                    <div class="flex gap-2">
                        <input 
                            [(ngModel)]="couponCode" 
                            type="text" 
                            placeholder="Código de cupón"
                            class="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase"
                        >
                        <button 
                            (click)="applyCoupon()"
                            [disabled]="!couponCode()"
                            class="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
                        >
                            Aplicar
                        </button>
                    </div>
                } @else {
                    <div class="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <div class="flex items-center gap-2 text-indigo-700">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 8V5a3 3 0 013-3h3c.265 0 .52.105.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                            </svg>
                            <span class="text-sm font-bold">{{ cartService.appliedCoupon()?.code }}</span>
                        </div>
                        <button (click)="cartService.removeCoupon()" class="text-slate-400 hover:text-red-500 font-bold text-sm">Remover</button>
                    </div>
                }
            </div>
        }

        <div class="p-6 border-t border-slate-100 bg-slate-50/50">
            <div class="flex justify-between mb-2 text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{{ cartService.subtotal() | currency }}</span>
            </div>
            
            @if (cartService.appliedCoupon()) {
                <div class="flex justify-between mb-2 text-sm text-indigo-600 font-bold">
                    <span>Descuento</span>
                    <span>-{{ cartService.discountAmount() | currency }}</span>
                </div>
            }

            <div class="flex justify-between mb-2 text-sm text-slate-500">
                <span>Impuestos</span>
                <span>{{ cartService.tax() | currency }}</span>
            </div>

            <div class="flex justify-between mb-6 text-lg font-bold">
                <span>Total</span>
                <span class="text-slate-900 text-xl font-bold">{{ cartService.total() | currency }}</span>
            </div>
            
            <button (click)="close.emit()" routerLink="/store/checkout" [disabled]="items().length === 0" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                Ir al Checkout
            </button>
        </div>
    </div>
  `,
})
export class CartDrawer {
    readonly cartService = inject(CartService);

    @Output() close = new EventEmitter<void>();

    readonly items = this.cartService.items;
    couponCode = signal('');

    async applyCoupon() {
        if (!this.couponCode()) return;
        const success = await this.cartService.applyCoupon(this.couponCode());
        if (success) {
            this.couponCode.set('');
        }
    }
}
