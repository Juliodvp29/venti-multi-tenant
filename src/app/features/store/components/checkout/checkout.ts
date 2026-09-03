import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  effect,
  computed,
} from '@angular/core';
import { CartItem } from '@core/models/cart';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '@core/services/cart';
import { TenantService } from '@core/services/tenant';
import { OrdersService } from '@core/services/orders';
import { CustomerAuthService } from '@core/services/customer-auth';
import { CustomersService } from '@core/services/customers';
import { ToastService } from '@core/services/toast';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@core/enums';
import { CustomerAddress } from '@core/models/customer';
import { AddressForm } from '../account/address-form/address-form';

export interface SavedCard {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'generic';
  last4: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, AddressForm, CurrencyPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 mb-6 text-xs sm:text-sm text-slate-500 font-medium">
        <a
          routerLink="/store"
          queryParamsHandling="preserve"
          class="hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Tienda</span>
        </a>
        <span>/</span>
        <a routerLink="/store/cart" class="hover:text-slate-900 transition-colors">Carrito</a>
        <span>/</span>
        <span class="text-slate-900 font-bold">Finalizar Compra</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT COLUMN: Shipping & Payment -->
        <div class="lg:col-span-7 space-y-6">
          <!-- 1. Shipping Address Section -->
          <section
            class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs relative"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <span
                  class="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 font-bold text-xs flex items-center justify-center border border-sky-100"
                >
                  1
                </span>
                <h2 class="text-base sm:text-lg font-bold text-slate-900">Información de Envío</h2>
              </div>
            </div>

            @if (isLoadingAddresses()) {
              <div class="flex justify-center py-6">
                <svg
                  class="animate-spin h-5 w-5 text-sky-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            } @else {
              @if (savedAddresses().length > 0 && !showNewAddressForm()) {
                <div class="space-y-3">
                  @for (addr of savedAddresses(); track addr.id) {
                    <label
                      class="flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer"
                      [ngClass]="
                        selectedAddressId() === addr.id
                          ? 'border-sky-500 bg-sky-50/20 ring-1 ring-sky-500'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                      "
                    >
                      <input
                        type="radio"
                        name="addressSelection"
                        class="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"
                        [value]="addr.id"
                        [checked]="selectedAddressId() === addr.id"
                        (change)="selectedAddressId.set(addr.id)"
                      />
                      <div class="flex-1 text-xs">
                        <div class="flex items-center justify-between">
                          <p class="font-bold text-slate-900 text-sm">
                            {{ addr.first_name }} {{ addr.last_name }}
                          </p>
                          @if (addr.is_default) {
                            <span
                              class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                            >
                              Predeterminada
                            </span>
                          }
                        </div>
                        <p class="text-slate-600 mt-1">
                          {{ addr.address_line1 }} {{ addr.address_line2 || '' }}
                        </p>
                        <p class="text-slate-600">
                          {{ addr.city }}, {{ addr.state || '' }} {{ addr.postal_code }} -
                          {{ addr.country }}
                        </p>
                        <p class="text-slate-500 mt-1.5 flex items-center gap-1">
                          <svg
                            class="h-3.5 w-3.5 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span>{{ addr.phone }}</span>
                        </p>
                      </div>
                    </label>
                  }
                </div>

                <button
                  type="button"
                  class="mt-3 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
                  (click)="showNewAddressForm.set(true)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Agregar o usar otra dirección</span>
                </button>
              } @else {
                <app-address-form
                  (save)="onAddressFormSaved($event)"
                  (cancel)="onAddressFormCanceled()"
                />
              }
            }
          </section>

          <!-- 2. Payment Method Section -->
          <section class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div class="flex items-center gap-2.5 mb-4">
              <span
                class="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 font-bold text-xs flex items-center justify-center border border-sky-100"
              >
                2
              </span>
              <div>
                <h2 class="text-base sm:text-lg font-bold text-slate-900">Método de Pago</h2>
                <p class="text-[11px] text-slate-500">Selecciona cómo deseas pagar tu pedido</p>
              </div>
            </div>

            <div class="space-y-3">
              
                @for (method of paymentMethods(); track method.id) {
                  <div
                    class="rounded-xl border transition-all overflow-hidden"
                    [ngClass]="
                      selectedPaymentMethod() === method.id
                        ? 'border-sky-500 bg-sky-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    "
                  >
                    <label class="flex items-center justify-between p-3.5 cursor-pointer">
                      <div class="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          class="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"
                          [value]="method.id"
                          [checked]="selectedPaymentMethod() === method.id"
                          (change)="selectedPaymentMethod.set(method.id)"
                        />
                        <div>
                          <p class="font-bold text-xs sm:text-sm text-slate-900">
                            {{ method.label }}
                          </p>
                          <p class="text-[11px] text-slate-500 mt-0.5">
                            {{ method.description }}
                          </p>
                        </div>
                      </div>

                      <!-- Icons badge -->
                      <div class="flex items-center gap-1.5 shrink-0">
                        @if (method.id === PaymentMethod.CreditCard) {
                          <span
                            class="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-tight"
                            >Visa</span
                          >
                          <span
                            class="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-tight"
                            >Mastercard</span
                          >
                          <span
                            class="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-tight"
                            >Amex</span
                          >
                        } @else {
                          <div
                            class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                [attr.d]="method.icon"
                              />
                            </svg>
                          </div>
                        }
                      </div>
                    </label>

                    <!-- Inline Credit Card Form when selected -->
                    @if (
                      selectedPaymentMethod() === PaymentMethod.CreditCard &&
                      method.id === PaymentMethod.CreditCard
                    ) {
                      <div
                        class="px-4 pb-4 pt-2 border-t border-sky-100 bg-white/80 space-y-3.5 animate-in fade-in duration-200"
                      >
                        <!-- Saved cards selector if available -->
                        @if (savedCards().length > 0) {
                          <div class="space-y-2">
                            <p
                              class="text-[11px] font-bold uppercase tracking-wider text-slate-500"
                            >
                              Tarjetas guardadas
                            </p>
                            @for (card of savedCards(); track card.id) {
                              <label
                                class="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-all"
                                [ngClass]="
                                  selectedSavedCardId() === card.id
                                    ? 'border-sky-500 bg-sky-50/40 font-bold text-slate-900'
                                    : 'border-slate-200 text-slate-700'
                                "
                              >
                                <div class="flex items-center gap-2.5">
                                  <input
                                    type="radio"
                                    name="savedCardChoice"
                                    class="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500 border-slate-300"
                                    [value]="card.id"
                                    [checked]="selectedSavedCardId() === card.id"
                                    (change)="selectedSavedCardId.set(card.id)"
                                  />
                                  <span class="uppercase tracking-wide font-black text-sky-700">{{
                                    card.brand
                                  }}</span>
                                  <span>•••• {{ card.last4 }}</span>
                                </div>
                                <span class="text-slate-400 text-[11px]"
                                  >Exp: {{ card.expiryMonth }}/{{ card.expiryYear }}</span
                                >
                              </label>
                            }

                            <button
                              type="button"
                              class="text-[11px] font-bold text-sky-600 hover:text-sky-700 underline"
                              (click)="selectedSavedCardId.set(null)"
                            >
                              + Usar una tarjeta diferente
                            </button>
                          </div>
                        }

                        <!-- New Card Form (if no card selected or entering new one) -->
                        @if (!selectedSavedCardId()) {
                          <div class="space-y-3 pt-1">
                            <!-- Card Number -->
                            <div>
                              <label class="block text-xs font-semibold text-slate-700 mb-1">
                                Número de Tarjeta
                              </label>
                              <div class="relative">
                                <input
                                  type="text"
                                  maxlength="19"
                                  placeholder="0000 0000 0000 0000"
                                  class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono transition-all"
                                  [value]="cardForm.number"
                                  (input)="onCardNumberInput($event)"
                                />
                                <div class="absolute right-3 top-2.5 flex items-center gap-1">
                                  <span
                                    class="text-[10px] uppercase font-black text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded"
                                  >
                                    {{ detectedCardBrand() }}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <!-- Cardholder Name -->
                            <div>
                              <label class="block text-xs font-semibold text-slate-700 mb-1">
                                Nombre del Titular
                              </label>
                              <input
                                type="text"
                                placeholder="Nombre como figura en la tarjeta"
                                class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase transition-all"
                                [value]="cardForm.name"
                                (input)="cardForm.name = $any($event.target).value"
                              />
                            </div>

                            <!-- Expiry & CVC row -->
                            <div class="grid grid-cols-2 gap-3">
                              <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">
                                  Vencimiento (MM/AA)
                                </label>
                                <input
                                  type="text"
                                  maxlength="5"
                                  placeholder="MM/AA"
                                  class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-center font-mono transition-all"
                                  [value]="cardForm.expiry"
                                  (input)="onExpiryInput($event)"
                                />
                              </div>
                              <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">
                                  Código CVC / CVV
                                </label>
                                <input
                                  type="password"
                                  maxlength="4"
                                  placeholder="123"
                                  class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-center font-mono transition-all"
                                  [value]="cardForm.cvc"
                                  (input)="
                                    cardForm.cvc = $any($event.target).value.replace(/\\D/g, '')
                                  "
                                />
                              </div>
                            </div>

                            <!-- Save Card checkbox -->
                            <label class="flex items-center gap-2 pt-1 cursor-pointer">
                              <input
                                type="checkbox"
                                class="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                                [(ngModel)]="saveCardForFuture"
                              />
                              <span class="text-xs text-slate-600 font-medium">
                                Guardar esta tarjeta de forma segura para futuras compras
                              </span>
                            </label>
                          </div>
                        }
                      </div>
                    }

                    <!-- Inline Details for other payment methods -->
                    @if (
                      selectedPaymentMethod() === PaymentMethod.CashOnDelivery &&
                      method.id === PaymentMethod.CashOnDelivery
                    ) {
                      <div
                        class="px-4 pb-3.5 pt-1 text-xs text-emerald-800 bg-emerald-50/60 border-t border-emerald-100 flex items-center gap-2"
                      >
                        <svg
                          class="w-4 h-4 shrink-0 text-emerald-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span
                          >Pagas en efectivo o con datáfono directamente al repartidor cuando llegue
                          tu paquete.</span
                        >
                      </div>
                    }

                    @if (
                      selectedPaymentMethod() === PaymentMethod.BankTransfer &&
                      method.id === PaymentMethod.BankTransfer
                    ) {
                      <div
                        class="px-4 pb-3.5 pt-1 text-xs text-indigo-800 bg-indigo-50/60 border-t border-indigo-100 flex items-center gap-2"
                      >
                        <svg
                          class="w-4 h-4 shrink-0 text-indigo-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span
                          >Te mostraremos los números de cuenta bancaria e instrucciones al
                          confirmar tu pedido.</span
                        >
                      </div>
                    }

                    @if (
                      selectedPaymentMethod() === PaymentMethod.PSE &&
                      method.id === PaymentMethod.PSE
                    ) {
                      <div
                        class="px-4 pb-3.5 pt-1 text-xs text-sky-800 bg-sky-50/60 border-t border-sky-100 flex items-center gap-2"
                      >
                        <svg
                          class="w-4 h-4 shrink-0 text-sky-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span
                          >Serás redirigido a la pasarela segura de tu banco para debitar
                          directamente de tus fondos.</span
                        >
                      </div>
                    }
                  </div>
                } @empty {
                <div
                  class="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs sm:text-sm"
                >
                  <p class="font-bold">No hay métodos de pago disponibles</p>
                  <p class="mt-1">
                    Actualmente la tienda no cuenta con métodos de pago habilitados. Por favor
                    comunícate con el vendedor.
                  </p>
                </div>
              
              }
            </div>
          </section>

          <!-- 3. Billing Address Section -->
          <section class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div class="flex items-center gap-2.5 mb-4">
              <span
                class="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 font-bold text-xs flex items-center justify-center border border-sky-100"
              >
                3
              </span>
              <div>
                <h2 class="text-base sm:text-lg font-bold text-slate-900">Facturación</h2>
                <p class="text-[11px] text-slate-500">
                  ¿Necesitas factura con datos diferentes a tu dirección de envío?
                </p>
              </div>
            </div>

            <!-- Toggle: different billing -->
            <label
              class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer transition-all mb-4"
            >
              <input
                type="checkbox"
                class="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                [(ngModel)]="useDifferentBilling"
              />
              <div>
                <p class="text-sm font-bold text-slate-800">
                  Usar una dirección de facturación diferente
                </p>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  Para facturas electrónicas a empresas, NIT u otros datos fiscales
                </p>
              </div>
            </label>

            @if (useDifferentBilling) {
              <div class="space-y-3.5 pt-1 animate-in fade-in duration-200">
                <!-- Name row -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      placeholder="Nombre"
                      class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      [(ngModel)]="billingForm.first_name"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Apellido</label>
                    <input
                      type="text"
                      placeholder="Apellido"
                      class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      [(ngModel)]="billingForm.last_name"
                    />
                  </div>
                </div>

                <!-- Company / NIT -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa / NIT
                    <span class="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Mi Empresa S.A.S. · NIT 900123456-7"
                    class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    [(ngModel)]="billingForm.company"
                  />
                </div>

                <!-- Address -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1"
                    >Dirección de Facturación</label
                  >
                  <input
                    type="text"
                    placeholder="Calle, Carrera, Av..."
                    class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    [(ngModel)]="billingForm.address_line1"
                  />
                </div>

                <!-- City / State -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      placeholder="Ciudad"
                      class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      [(ngModel)]="billingForm.city"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1"
                      >Departamento</label
                    >
                    <input
                      type="text"
                      placeholder="Departamento"
                      class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      [(ngModel)]="billingForm.state"
                    />
                  </div>
                </div>

                <!-- Postal / Country -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1"
                      >Código Postal
                      <span class="font-normal text-slate-400">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="110111"
                      class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      [(ngModel)]="billingForm.postal_code"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">País</label>
                    <input
                      type="text"
                      placeholder="Colombia"
                      class="w-full bg-slate-50/50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      [(ngModel)]="billingForm.country"
                    />
                  </div>
                </div>
              </div>
            } @else {
              <!-- Same as shipping summary -->
              <div
                class="flex items-center gap-2.5 py-2 px-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-800 font-medium"
              >
                <svg
                  class="w-4 h-4 shrink-0 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Facturación igual a la dirección de envío seleccionada</span>
              </div>
            }
          </section>
        </div>

        <!-- RIGHT COLUMN: Order Summary -->
        <div class="lg:col-span-5">
          <div
            class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs sticky top-6"
          >
            <h2
              class="text-base sm:text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100"
            >
              Resumen del Pedido
            </h2>

            <!-- Items List -->
            <div class="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
              @for (item of cartService.items(); track item.id) {
                <div class="flex items-center gap-3 py-1">
                  <div
                    class="w-12 h-12 rounded-xl border border-slate-100 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center"
                  >
                    @if (getItemImage(item)) {
                      <img
                        class="w-full h-full object-cover"
                        [src]="getItemImage(item)"
                        [alt]="item.name"
                      />
                    } @else {
                      <svg
                        class="w-5 h-5 text-slate-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {{ item.name }}
                    </p>
                    <p class="text-[11px] text-slate-500 mt-0.5">
                      {{ item.quantity }} × {{ item.price | currency: currency() }}
                    </p>
                  </div>
                  <p class="font-bold text-xs sm:text-sm text-slate-900">
                    {{ item.price * item.quantity | currency: currency() }}
                  </p>
                </div>
              }
            </div>

            <!-- Price Breakdown -->
            <div class="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span class="font-bold text-slate-900">{{
                  cartService.subtotal() | currency: currency()
                }}</span>
              </div>

              @if (cartService.appliedCoupon()) {
                <div
                  class="flex justify-between text-sky-600 font-bold bg-sky-50/80 px-2.5 py-1.5 rounded-lg"
                >
                  <span>Descuento ({{ cartService.appliedCoupon()?.code }})</span>
                  <span>-{{ cartService.discountAmount() | currency: currency() }}</span>
                </div>
              }

              <div class="flex justify-between text-slate-600">
                <span>Impuestos (IVA)</span>
                <span class="font-bold text-slate-900">{{
                  cartService.tax() | currency: currency()
                }}</span>
              </div>

              <div class="flex justify-between text-slate-600 items-center">
                <span>Envío</span>
                <span
                  class="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]"
                >
                  Gratis
                </span>
              </div>

              <div
                class="flex justify-between text-base font-black pt-3 border-t border-slate-100 mt-2 text-slate-900"
              >
                <span>Total a Pagar</span>
                <span class="text-sky-600">{{ cartService.total() | currency: currency() }}</span>
              </div>
            </div>

            <!-- Place Order Button -->
            <button
              type="button"
              class="w-full mt-6 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-xl font-bold text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              [disabled]="
                isSubmitting() ||
                showNewAddressForm() ||
                isLoadingAddresses() ||
                paymentMethods().length === 0
              "
              (click)="placeOrder()"
            >
              @if (isSubmitting()) {
                <svg
                  class="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Procesando pago...</span>
              } @else if (showNewAddressForm()) {
                <span>Guarda la dirección de envío</span>
              } @else if (paymentMethods().length === 0) {
                <span>Sin métodos de pago disponibles</span>
              } @else {
                <span>Confirmar y Pagar Pedido</span>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              }
            </button>

            <!-- Trust Badge -->
            <div class="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <svg
                class="w-3.5 h-3.5 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Pago 100% Seguro con cifrado SSL de 256 bits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class Checkout implements OnInit {
  readonly cartService = inject(CartService);
  readonly tenantService = inject(TenantService);
  readonly currency = this.tenantService.currency;
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly customerAuth = inject(CustomerAuthService);
  private readonly customersService = inject(CustomersService);
  private readonly toast = inject(ToastService);

  readonly PaymentMethod = PaymentMethod;

  readonly savedAddresses = signal<CustomerAddress[]>([]);
  readonly selectedAddressId = signal<string | null>(null);

  readonly showNewAddressForm = signal(false);
  readonly temporaryAddress = signal<Partial<CustomerAddress> | null>(null);

  readonly isSubmitting = signal(false);
  readonly isLoadingAddresses = signal(true);
  readonly selectedPaymentMethod = signal<PaymentMethod>(PaymentMethod.CreditCard);

  // Credit Card Form State
  readonly cardForm = {
    number: '',
    name: '',
    expiry: '',
    cvc: '',
  };
  saveCardForFuture = true;

  // Billing Address Form State
  useDifferentBilling = false;
  readonly billingForm = {
    first_name: '',
    last_name: '',
    company: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Colombia',
  };

  // Saved cards signal
  readonly savedCards = signal<SavedCard[]>([]);
  readonly selectedSavedCardId = signal<string | null>(null);

  readonly detectedCardBrand = computed(() => {
    const num = this.cardForm.number.replace(/\s+/g, '');
    if (num.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(num)) return 'Mastercard';
    if (/^3[47]/.test(num)) return 'Amex';
    return 'Tarjeta';
  });

  readonly allPaymentMethods = [
    {
      id: PaymentMethod.CreditCard,
      label: 'Tarjeta débito y crédito',
      description: 'Paga al instante con Visa, Mastercard o American Express.',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    },
    {
      id: PaymentMethod.CashOnDelivery,
      label: 'Pago contra entrega',
      description: 'Paga en efectivo o datáfono al recibir tu pedido en tu puerta.',
      icon: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      id: PaymentMethod.PSE,
      label: 'PSE (Transferencia en línea)',
      description: 'Débito seguro desde tu cuenta de ahorros o corriente.',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    {
      id: PaymentMethod.BankTransfer,
      label: 'Transferencia Bancaria Directa',
      description: 'Realiza tu pago vía Bancolombia, Nequi o Daviplata.',
      icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    },
  ];

  readonly paymentMethods = computed(() => {
    const tenant = this.tenantService.currentTenant();
    const settings = tenant?.settings?.['payment_methods'] as
      Record<string, { enabled?: boolean }> | undefined;
    if (!settings) {
      return this.allPaymentMethods;
    }
    return this.allPaymentMethods.filter((method) => {
      const config = settings[method.id];
      return config === undefined ? true : !!config.enabled;
    });
  });

  private customerId = signal<string | null>(null);
  private resolvedCustomer: any = null;

  constructor() {
    effect(() => {
      const id = this.selectedAddressId();
      const addresses = this.savedAddresses();
      if (id && addresses.length > 0) {
        const address = addresses.find((a) => a.id === id);
        if (address) {
          this.cartService.setShippingLocation(address.country, address.state || undefined);
        }
      }
    });

    effect(() => {
      const available = this.paymentMethods();
      const current = this.selectedPaymentMethod();
      if (available.length > 0 && !available.some((m) => m.id === current)) {
        this.selectedPaymentMethod.set(available[0].id);
      }
    });
  }

  async ngOnInit() {
    await this.loadCustomerAndAddresses();
    this.loadSavedCards();
  }

  onCardNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 16) value = value.substring(0, 16);
    // Add spaces every 4 digits
    const parts = value.match(/[\s\S]{1,4}/g) || [];
    this.cardForm.number = parts.join(' ');
    input.value = this.cardForm.number;
  }

  onExpiryInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    this.cardForm.expiry = value;
    input.value = this.cardForm.expiry;
  }

  private loadSavedCards() {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return;
    try {
      const saved = localStorage.getItem(`venti_cards_${tenantId}`);
      if (saved) {
        const parsed: SavedCard[] = JSON.parse(saved);
        this.savedCards.set(parsed);
        if (parsed.length > 0) {
          this.selectedSavedCardId.set(parsed[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not load saved cards:', e);
    }
  }

  private saveCardIfRequested(brand: string, last4: string, cardholder: string, expiry: string) {
    if (!this.saveCardForFuture) return;
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return;

    try {
      const [expMonth, expYear] = expiry.split('/');
      const newCard: SavedCard = {
        id: `card_${Date.now()}`,
        brand: (brand.toLowerCase() as any) || 'generic',
        last4,
        cardholderName: cardholder,
        expiryMonth: expMonth || '12',
        expiryYear: expYear || '28',
      };
      const existing = this.savedCards().filter((c) => c.last4 !== last4);
      const updated = [newCard, ...existing].slice(0, 3);
      localStorage.setItem(`venti_cards_${tenantId}`, JSON.stringify(updated));
      this.savedCards.set(updated);
    } catch (e) {
      console.warn('Could not persist card:', e);
    }
  }

  async loadCustomerAndAddresses() {
    this.isLoadingAddresses.set(true);
    try {
      this.resolvedCustomer = await this.customerAuth.ensureCustomer();
      if (this.resolvedCustomer) {
        this.customerId.set(this.resolvedCustomer.id);
        const addresses = await this.customersService.getCustomerAddresses(
          this.resolvedCustomer.id,
        );
        this.savedAddresses.set(addresses);

        if (addresses.length > 0) {
          const defaultAddr = addresses.find((a) => a.is_default);
          this.selectedAddressId.set(defaultAddr ? defaultAddr.id : addresses[0].id);
          this.showNewAddressForm.set(false);
        } else {
          this.showNewAddressForm.set(true);
        }
      } else {
        this.showNewAddressForm.set(true);
      }
    } catch (e) {
      console.error(e);
      this.toast.error('Error al cargar la información del cliente');
      this.showNewAddressForm.set(true);
    } finally {
      this.isLoadingAddresses.set(false);
    }
  }

  async onAddressFormSaved(address: Partial<CustomerAddress>) {
    if (!this.customerId()) {
      const tenantId = this.tenantService.tenantId();
      if (!tenantId) {
        this.toast.error('Error: No se pudo identificar la tienda.');
        return;
      }

      this.resolvedCustomer = await this.customerAuth.ensureCustomer();
      if (!this.resolvedCustomer) {
        this.toast.warning('Inicia sesión para guardar tu dirección y continuar');
        return;
      }
      this.customerId.set(this.resolvedCustomer.id);
    }

    try {
      const newAddr = await this.customersService.addAddress(this.customerId()!, address);
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
      this.toast.warning('Debes proporcionar una dirección de envío');
    }
  }

  async placeOrder() {
    if (this.cartService.items().length === 0) {
      this.toast.error('El carrito está vacío');
      return;
    }

    if (this.paymentMethods().length === 0) {
      this.toast.error('No hay métodos de pago disponibles');
      return;
    }

    if (!this.selectedAddressId()) {
      this.toast.error('Por favor, selecciona una dirección de envío');
      return;
    }

    // Validations if Credit Card is selected
    if (this.selectedPaymentMethod() === PaymentMethod.CreditCard && !this.selectedSavedCardId()) {
      const rawNum = this.cardForm.number.replace(/\s+/g, '');
      if (rawNum.length < 15) {
        this.toast.warning('Ingresa un número de tarjeta válido.');
        return;
      }
      if (!this.cardForm.name.trim()) {
        this.toast.warning('Ingresa el nombre del titular de la tarjeta.');
        return;
      }
      if (!this.cardForm.expiry || !this.cardForm.expiry.includes('/')) {
        this.toast.warning('Ingresa la fecha de vencimiento (MM/AA).');
        return;
      }
      if (this.cardForm.cvc.length < 3) {
        this.toast.warning('Ingresa el código de seguridad CVC.');
        return;
      }
    }

    // Validations if Different Billing Address is selected
    if (this.useDifferentBilling) {
      if (!this.billingForm.address_line1.trim()) {
        this.toast.warning('Por favor, ingresa la dirección de facturación.');
        return;
      }
      if (!this.billingForm.city.trim()) {
        this.toast.warning('Por favor, ingresa la ciudad de facturación.');
        return;
      }
    }

    this.isSubmitting.set(true);
    try {
      if (!this.resolvedCustomer) {
        this.resolvedCustomer = await this.customerAuth.ensureCustomer();
      }

      const customer = this.resolvedCustomer;
      if (!customer) {
        this.toast.warning('Por favor, inicia sesión para continuar con el pedido');
        this.isSubmitting.set(false);
        return;
      }

      const address = this.savedAddresses().find((a) => a.id === this.selectedAddressId());
      if (!address) {
        throw new Error('Dirección seleccionada no encontrada');
      }

      const isCreditCard = this.selectedPaymentMethod() === PaymentMethod.CreditCard;
      const isPaidInstantly = isCreditCard;

      const orderData = {
        customer_id: customer.id,
        status: isPaidInstantly ? OrderStatus.Paid : OrderStatus.Pending,
        payment_status: isPaidInstantly ? PaymentStatus.Completed : PaymentStatus.Pending,
        subtotal: this.cartService.subtotal(),
        discount_amount: this.cartService.discountAmount(),
        tax_amount: this.cartService.tax(),
        shipping_amount: 0,
        total_amount: this.cartService.total(),
        currency: this.currency(),
        payment_method: this.selectedPaymentMethod(),
        customer_email: customer.email,
        customer_first_name: customer.first_name || address.first_name,
        customer_last_name: customer.last_name || address.last_name,

        // Shipping Details
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

        // Billing Details (Same as shipping or custom)
        billing_first_name: this.useDifferentBilling
          ? this.billingForm.first_name || address.first_name
          : address.first_name,
        billing_last_name: this.useDifferentBilling
          ? this.billingForm.last_name || address.last_name
          : address.last_name,
        billing_company: this.useDifferentBilling
          ? this.billingForm.company || undefined
          : address.company || undefined,
        billing_address_line1: this.useDifferentBilling
          ? this.billingForm.address_line1
          : address.address_line1,
        billing_city: this.useDifferentBilling ? this.billingForm.city : address.city,
        billing_state: this.useDifferentBilling ? this.billingForm.state : address.state,
        billing_postal_code: this.useDifferentBilling
          ? this.billingForm.postal_code
          : address.postal_code,
        billing_country: this.useDifferentBilling
          ? this.billingForm.country || address.country
          : address.country,
      };

      const orderItems = this.cartService.items().map((item) => ({
        product_id: item.product.id,
        variant_id: item.variantId,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: item.price * item.quantity,
      }));

      const appliedCoupon = this.cartService.appliedCoupon();
      const discountData = appliedCoupon
        ? {
            codeId: appliedCoupon.id,
            customerId: customer.id,
            discountAmount: this.cartService.discountAmount(),
          }
        : undefined;

      // Prepare Payment Data for card or instant payment
      let paymentPayload: any = undefined;
      if (isCreditCard) {
        let last4 = '4242';
        let brand = this.detectedCardBrand();
        let cardholder = this.cardForm.name || 'Cliente Venti';

        if (this.selectedSavedCardId()) {
          const saved = this.savedCards().find((c) => c.id === this.selectedSavedCardId());
          if (saved) {
            last4 = saved.last4;
            brand = saved.brand;
            cardholder = saved.cardholderName;
          }
        } else {
          last4 = this.cardForm.number.replace(/\s+/g, '').slice(-4);
          this.saveCardIfRequested(brand, last4, cardholder, this.cardForm.expiry);
        }

        paymentPayload = {
          payment_method: PaymentMethod.CreditCard,
          amount: this.cartService.total(),
          currency: this.currency(),
          status: PaymentStatus.Completed,
          gateway: 'credit_card_checkout',
          payment_details: {
            card_brand: brand,
            last4,
            cardholder_name: cardholder,
          },
        };
      }

      await this.ordersService.createOrder(orderData, orderItems, paymentPayload, discountData);

      this.cartService.clearCart();
      this.toast.success('¡Pedido recibido y confirmado exitosamente!');
      await this.router.navigate(['/store/success'], { queryParamsHandling: 'preserve' });
    } catch (error: any) {
      console.error('Error placing order:', error);
      this.toast.error(error?.message || 'Ocurrió un error al procesar tu pedido');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  getItemImage(item: CartItem): string | null {
    if (item.imageUrl) return item.imageUrl;
    const p = item.product;
    if (!p) return null;
    return (
      p.primary_image_url ||
      p.images?.find((img) => img.is_primary)?.url ||
      p.images?.[0]?.url ||
      null
    );
  }
}
