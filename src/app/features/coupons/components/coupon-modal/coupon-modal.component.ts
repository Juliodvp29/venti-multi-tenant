import { Component, inject, signal, output, input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DiscountCode } from '@core/models/discount.model';
import { DiscountsService } from '@core/services/discounts';
import { ToastService } from '@core/services/toast';
import { DatePicker } from '@shared/components/date-picker/date-picker';

@Component({
  selector: 'app-coupon-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePicker],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-end bg-black/50 backdrop-blur-sm px-4 py-6 sm:p-0">
      <div class="w-full max-w-lg bg-white dark:bg-gray-900 h-full overflow-y-auto shadow-2xl flex flex-col transform transition-transform duration-300">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ coupon() ? 'Editar Cupón' : 'Crear Nuevo Cupón' }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Configura tu oferta promocional</p>
          </div>
          <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex-1 p-6 space-y-8">
          <!-- Basic Info -->
          <section class="space-y-4">
            <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.243a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM6.464 14.95a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707z" />
              </svg>
              Información Básica
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código de Cupón</label>
              <div class="relative">
                <input 
                  type="text" 
                  formControlName="code"
                  placeholder="e.g. SUMMER2024"
                  class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all uppercase"
                >
                <button 
                  type="button"
                  (click)="generateCode()"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  GENERAR
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Descuento</label>
              <div class="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <button 
                  type="button" 
                  (click)="form.patchValue({type: 'percentage'})"
                  [class.bg-white]="form.get('type')?.value === 'percentage'"
                  [class.shadow-sm]="form.get('type')?.value === 'percentage'"
                  class="flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Porcentaje
                </button>
                <button 
                  type="button" 
                  (click)="form.patchValue({type: 'fixed_amount'})"
                  [class.bg-white]="form.get('type')?.value === 'fixed_amount'"
                  [class.shadow-sm]="form.get('type')?.value === 'fixed_amount'"
                  class="flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Monto Fijo
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
              <div class="relative">
                <input 
                  type="number" 
                  formControlName="value"
                  class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {{ form.get('type')?.value === 'percentage' ? '%' : '$' }}
                </span>
              </div>
            </div>
          </section>

          <!-- Scheduling -->
          <section class="space-y-4">
            <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Programación
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Inicio</label>
                <app-date-picker formControlName="starts_at" placeholder="Seleccionar inicio"></app-date-picker>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Expiración</label>
                <app-date-picker formControlName="ends_at" placeholder="Seleccionar fin" align="right"></app-date-picker>
              </div>
            </div>
          </section>

          <!-- Usage Requirements -->
          <section class="space-y-4">
            <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Requisitos de Uso
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto Mínimo de Compra</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input 
                  type="number" 
                  formControlName="minimum_purchase_amount"
                  class="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
              </div>
              <p class="mt-1 text-xs text-gray-500">Dejar en blanco si no hay requisito de compra mínima.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Límite de Uso</label>
              <input 
                type="number" 
                formControlName="usage_limit"
                class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
              <p class="mt-1 text-xs text-gray-500">Veces totales que este cupón puede ser usado por todos los clientes.</p>
            </div>
          </section>

          <div class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex gap-3">
            <svg class="w-5 h-5 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <p class="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
              Este cupón estará disponible para todos los clientes una vez publicado. Puedes restringirlo a grupos de clientes específicos en la configuración.
            </p>
          </div>
        </form>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3 pb-32 sm:pb-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky bottom-0">
          <button 
            type="button"
            (click)="close.emit()"
            class="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            (click)="onSubmit()"
            [disabled]="form.invalid"
            class="flex-1 px-4 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <span class="flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Guardar Cupón
            </span>
          </button>
        </div>
        
        <!-- Safety block for AI Bot -->
        <div class="h-20 sm:hidden"></div>
      </div>
    </div>
  `
})
export class CouponModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly discountsService = inject(DiscountsService);
  private readonly toast = inject(ToastService);

  coupon = input<DiscountCode | null>(null);
  close = output<void>();
  saved = output<void>();

  form = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    type: ['percentage', Validators.required],
    value: [0, [Validators.required, Validators.min(0)]],
    starts_at: [''],
    ends_at: [''],
    minimum_purchase_amount: [null],
    usage_limit: [null],
    is_active: [true]
  });

  ngOnInit() {
    const existingCoupon = this.coupon();
    if (existingCoupon) {
      this.form.patchValue({
        ...existingCoupon,
        starts_at: existingCoupon.starts_at ? new Date(existingCoupon.starts_at).toISOString().split('T')[0] : '',
        ends_at: existingCoupon.ends_at ? new Date(existingCoupon.ends_at).toISOString().split('T')[0] : ''
      } as any);
    }
  }

  generateCode() {
    const words = ['SUMMER', 'WELCOME', 'SAVE', 'OFFER', 'VENTI', 'DISCOUNT'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.form.patchValue({ code: `${randomWord}${randomNum}` });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    try {
      const data = this.form.value;
      const existingCoupon = this.coupon();

      if (existingCoupon) {
        await this.discountsService.updateDiscountCode(existingCoupon.id, data as Partial<DiscountCode>);
        this.toast.success('Cupón actualizado');
      } else {
        await this.discountsService.createDiscountCode(data as Partial<DiscountCode>);
        this.toast.success('Cupón creado');
      }
      this.saved.emit();
      this.close.emit();
    } catch (error) {
      this.toast.error('Error al guardar el cupón');
    }
  }
}
