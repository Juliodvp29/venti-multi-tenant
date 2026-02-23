import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '@core/services/cart';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <!-- Form -->
      <div class="lg:col-span-12">
         <nav class="flex mb-8 text-sm text-slate-500">
          <a routerLink="/store" class="hover:text-slate-900">Tienda</a>
          <span class="mx-2">/</span>
          <span class="text-slate-900 font-medium">Checkout</span>
        </nav>
      </div>

      <div class="lg:col-span-7 space-y-8">
        <section class="bg-white p-6 rounded-3xl border border-slate-200">
          <h2 class="text-xl font-bold mb-4">Información de Envío</h2>
          <div class="grid grid-cols-2 gap-4">
             <div class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input type="text" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
             </div>
             <div class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input type="text" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
             </div>
          </div>
        </section>

        <section class="bg-white p-6 rounded-3xl border border-slate-200">
          <h2 class="text-xl font-bold mb-4">Método de Pago</h2>
          <p class="text-slate-500 text-sm mb-4">Por ahora sólo aceptamos transferencia o pago contra entrega.</p>
          <div class="p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/50">
             <p class="font-bold text-indigo-700">Pago Contra Entrega</p>
          </div>
        </section>
      </div>

      <!-- Summary -->
      <div class="lg:col-span-5">
        <div class="bg-white p-6 rounded-3xl border border-slate-200 sticky top-24">
          <h2 class="text-xl font-bold mb-6">Resumen del Pedido</h2>
          
          <div class="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
            @for (item of cartService.items(); track item.id) {
              <div class="flex gap-4">
                <div class="w-16 h-16 rounded-xl border border-slate-100 overflow-hidden flex-shrink-0">
                  <img [src]="item.imageUrl" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-slate-900 truncate">{{ item.name }}</p>
                  <p class="text-sm text-slate-500">{{ item.quantity }} x {{ item.price | currency }}</p>
                </div>
                <p class="font-bold">{{ item.price * item.quantity | currency }}</p>
              </div>
            }
          </div>

          <div class="space-y-2 pt-4 border-t border-slate-100 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-500">Subtotal</span>
              <span class="font-medium">{{ cartService.subtotal() | currency }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Envío</span>
              <span class="font-medium">Gratis</span>
            </div>
            <div class="flex justify-between text-lg font-bold pt-2 border-t border-slate-100 mt-2">
              <span>Total</span>
              <span [style.color]="'var(--primary-color)'">{{ cartService.total() | currency }}</span>
            </div>
          </div>

          <button (click)="placeOrder()" class="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors">
            Confirmar Pedido
          </button>
        </div>
      </div>
    </div>
  `,
})
export class Checkout {
    readonly cartService = inject(CartService);
    private readonly router = inject(Router);

    placeOrder() {
        // TODO: Connect to OrdersService
        this.cartService.clearCart();
        this.router.navigate(['/store/success']);
    }
}
