import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '@core/services/cart';
import { OrdersService } from '@core/services/orders';
import { CustomerAuthService } from '@core/services/customer-auth';
import { CustomersService } from '@core/services/customers';
import { ToastService } from '@core/services/toast';
import { OrderStatus, PaymentStatus } from '@core/enums';
import { CustomerAddress } from '@core/models/customer';
import { AddressForm } from '../account/address-form/address-form';

@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, AddressForm],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <!-- Form -->
      <div class="lg:col-span-12">
         <nav class="flex mb-8 text-sm text-slate-500">
          <a routerLink="/store" class="hover:text-slate-900 transition-colors">Tienda</a>
          <span class="mx-2">/</span>
          <span class="text-slate-900 font-medium">Checkout</span>
        </nav>
      </div>

      <div class="lg:col-span-7 space-y-8">
        <section class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm relative">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Información de Envío</h2>
          
          @if (isLoadingAddresses()) {
            <div class="flex justify-center py-8">
                <svg class="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
            </div>
          } @else {
              @if (savedAddresses().length > 0 && !showNewAddressForm()) {
                <!-- Address Selection -->
                <div class="space-y-4">
                  @for (addr of savedAddresses(); track addr.id) {
                    <label class="flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all"
                           [ngClass]="selectedAddressId() === addr.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50/50'">
                      <input type="radio" name="addressSelection" [value]="addr.id"
                             [checked]="selectedAddressId() === addr.id"
                             (change)="selectedAddressId.set(addr.id)"
                             class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-gray-300">
                      <div class="flex-1">
                        <p class="font-bold text-gray-900">{{ addr.first_name }} {{ addr.last_name }}</p>
                        <p class="text-sm text-gray-600 mt-1">{{ addr.address_line1 }} {{ addr.address_line2 || '' }}</p>
                        <p class="text-sm text-gray-600">{{ addr.city }}, {{ addr.state || '' }} {{ addr.postal_code }} - {{ addr.country }}</p>
                        <p class="text-sm text-gray-500 mt-2 flex items-center gap-1.5 font-medium">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            {{ addr.phone }}
                        </p>
                      </div>
                    </label>
                  }
                </div>
                
                <button (click)="showNewAddressForm.set(true)" type="button" class="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Usar una dirección diferente
                </button>
              } @else {
                <!-- New Address Form Inline -->
                <app-address-form 
                    (save)="onAddressFormSaved($event)"
                    (cancel)="onAddressFormCanceled()">
                </app-address-form>
              }
          }
        </section>

        <section class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Método de Pago</h2>
          <div class="p-5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 flex items-center justify-between">
             <div>
                <p class="font-bold text-indigo-900 text-lg">Pago Contra Entrega</p>
                <p class="text-indigo-700 mt-1 text-sm">Paga en efectivo al recibir tu pedido.</p>
             </div>
             <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
          </div>
        </section>
      </div>

      <!-- Summary -->
      <div class="lg:col-span-5">
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm sticky top-24">
          <h2 class="text-xl font-bold mb-6">Resumen del Pedido</h2>
          
          <div class="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
            @for (item of cartService.items(); track item.id) {
              <div class="flex gap-4">
                <div class="w-16 h-16 rounded-xl border border-slate-100 overflow-hidden flex-shrink-0 bg-slate-50">
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

          <div class="space-y-3 pt-6 border-t border-slate-100 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-500">Subtotal</span>
              <span class="font-medium text-slate-900">{{ cartService.subtotal() | currency }}</span>
            </div>
            @if (cartService.appliedCoupon()) {
              <div class="flex justify-between text-indigo-600 font-bold bg-indigo-50 px-3 py-2 rounded-lg">
                <span>Descuento ({{ cartService.appliedCoupon()?.code }})</span>
                <span>-{{ cartService.discountAmount() | currency }}</span>
              </div>
            }
            <div class="flex justify-between">
              <span class="text-slate-500">Impuestos</span>
              <span class="font-medium text-slate-900">{{ cartService.tax() | currency }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Envío</span>
              <span class="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Gratis</span>
            </div>
            <div class="flex justify-between text-xl font-black pt-4 border-t border-slate-100 mt-4 text-slate-900">
              <span>Total a pagar</span>
              <span>{{ cartService.total() | currency }}</span>
            </div>
          </div>

          <button (click)="placeOrder()" [disabled]="isSubmitting() || showNewAddressForm() || isLoadingAddresses()" 
              class="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2">
            @if(isSubmitting()) {
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Procesando...
            } @else if (showNewAddressForm()) {
                Guarda la dirección primero
            } @else {
                Confirmar Pedido
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class Checkout implements OnInit {
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly customerAuth = inject(CustomerAuthService);
  private readonly customersService = inject(CustomersService);
  private readonly toast = inject(ToastService);

  readonly savedAddresses = signal<CustomerAddress[]>([]);
  readonly selectedAddressId = signal<string | null>(null);

  readonly showNewAddressForm = signal(false);
  readonly temporaryAddress = signal<Partial<CustomerAddress> | null>(null);

  readonly isSubmitting = signal(false);
  readonly isLoadingAddresses = signal(true);

  private customerId = signal<string | null>(null);
  private resolvedCustomer: any = null;

  async ngOnInit() {
    await this.loadCustomerAndAddresses();
  }

  async loadCustomerAndAddresses() {
    this.isLoadingAddresses.set(true);
    try {
      this.resolvedCustomer = await this.customerAuth.ensureCustomer();
      if (this.resolvedCustomer) {
        this.customerId.set(this.resolvedCustomer.id);
        const addresses = await this.customersService.getCustomerAddresses(this.resolvedCustomer.id);
        this.savedAddresses.set(addresses);

        if (addresses.length > 0) {
          const defaultAddr = addresses.find(a => a.is_default);
          this.selectedAddressId.set(defaultAddr ? defaultAddr.id : addresses[0].id);
          this.showNewAddressForm.set(false);
        } else {
          this.showNewAddressForm.set(true);
        }
      } else {
        // Guest checkout (if applicable) or wait for login - always show the form
        this.showNewAddressForm.set(true);
      }
    } catch (e) {
      console.error(e);
      this.toast.error('Error al cargar información del cliente');
      this.showNewAddressForm.set(true);
    } finally {
      this.isLoadingAddresses.set(false);
    }
  }

  async onAddressFormSaved(address: Partial<CustomerAddress>) {
    if (!this.customerId()) {
      // If they managed to act as a guest, we would save it to local state, 
      // but since ensureCustomer usually prompts login, we can assume customerId exists
      // Wait, ensureCustomer() might return null if they close the login modal.
      // Let's force login if they try to save
      this.resolvedCustomer = await this.customerAuth.ensureCustomer();
      if (!this.resolvedCustomer) {
        this.toast.warning('Inicia sesión para guardar tu dirección y continuar');
        return;
      }
      this.customerId.set(this.resolvedCustomer.id);
    }

    try {
      const newAddr = await this.customersService.addAddress(this.customerId()!, address);
      // Refresh list
      await this.loadCustomerAndAddresses();
      this.selectedAddressId.set(newAddr.id);
      this.toast.success('Dirección guardada');
    } catch (e) {
      console.error(e);
      this.toast.error('No se pudo guardar la dirección');
    }
  }

  onAddressFormCanceled() {
    if (this.savedAddresses().length > 0) {
      this.showNewAddressForm.set(false);
    } else {
      this.toast.warning('Necesitas proporcionar una dirección de envío');
    }
  }

  async placeOrder() {
    if (this.cartService.items().length === 0) {
      this.toast.error('El carrito está vacío');
      return;
    }

    if (!this.selectedAddressId()) {
      this.toast.error('Por favor selecciona una dirección de envío');
      return;
    }

    this.isSubmitting.set(true);
    try {
      if (!this.resolvedCustomer) {
        this.resolvedCustomer = await this.customerAuth.ensureCustomer();
      }

      const customer = this.resolvedCustomer;
      if (!customer) {
        this.toast.warning('Por favor inicia sesión para continuar con el pedido');
        this.isSubmitting.set(false);
        return;
      }

      // Find the selected address from our list
      const address = this.savedAddresses().find(a => a.id === this.selectedAddressId());
      if (!address) {
        throw new Error('Selected address not found');
      }

      const orderData = {
        customer_id: customer.id,
        status: OrderStatus.Pending,
        payment_status: PaymentStatus.Pending,
        subtotal: this.cartService.subtotal(),
        discount_amount: this.cartService.discountAmount(),
        tax_amount: this.cartService.tax(),
        shipping_amount: 0,
        total_amount: this.cartService.total(),
        currency: 'USD',
        customer_email: customer.email,
        customer_first_name: customer.first_name || address.first_name,
        customer_last_name: customer.last_name || address.last_name,

        // Full Shipping Details mapped properly
        shipping_first_name: address.first_name,
        shipping_last_name: address.last_name,
        shipping_company: address.company || undefined,
        shipping_address_line1: address.address_line1,
        shipping_address_line2: address.address_line2 || undefined,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_postal_code: address.postal_code,
        shipping_country: address.country,
        shipping_phone: address.phone || undefined,
      };

      const orderItems = this.cartService.items().map(item => ({
        product_id: item.id,
        variant_id: item.variantId,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: item.price * item.quantity
      }));

      await this.ordersService.createOrder(orderData, orderItems);

      this.cartService.clearCart();
      this.toast.success('¡Pedido recibido correctamente!');
      this.router.navigate(['/store/success']);
    } catch (error) {
      console.error('Error placing order:', error);
      this.toast.error('Ocurrió un error al procesar tu pedido');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
