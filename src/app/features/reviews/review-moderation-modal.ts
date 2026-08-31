import { Component, input, output, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductReview } from '@core/models/review';
import { ReviewsService } from '@core/services/reviews';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';

@Component({
  selector: 'app-review-moderation-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
    >
      <div
        class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col"
      >
        <!-- Header -->
        <div class="p-8 border-b border-slate-100 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h2 class="text-2xl font-black text-slate-900">Moderación de reseñas</h2>
              <span
                [class]="statusClasses()"
                class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
              >
                {{ review().status }}
              </span>
            </div>
            <p class="text-slate-400 text-sm font-medium">
              Revisa el contenido y decide si mostrarlo públicamente en tu tienda.
            </p>
          </div>
          <button
            (click)="close.emit()"
            class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-8 space-y-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          <!-- Product Preview -->
          <div
            class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl border border-slate-100"
          >
            <img
              [src]="primaryImage()"
              [alt]="review().product?.name"
              class="w-16 h-16 rounded-xl object-cover border border-white shadow-sm"
            />
            <div>
              <span class="text-[10px] font-black text-sky-600 uppercase tracking-widest"
                >Producto</span
              >
              <h4 class="font-bold text-slate-900 dark:text-amber-50">
                {{ review().product?.name }}
              </h4>
              <p class="text-xs text-slate-400">ID: {{ review().product_id }}</p>
            </div>
          </div>

          <!-- Review Info -->
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Cliente
                </p>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-900 dark:text-amber-50">{{
                    review().customer?.first_name + ' ' + (review().customer?.last_name || '')
                  }}</span>
                  @if (review().is_verified_purchase) {
                    <span
                      class="px-2 py-0.5 bg-sky-50 text-sky-600 dark:text-amber-50 text-[10px] font-black uppercase rounded-full tracking-wider border border-sky-100"
                    >
                      Compra Verificada
                    </span>
                  }
                </div>
              </div>

              <!-- Rating -->
              <div class="text-right">
                <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Calificación
                </p>
                <div class="flex text-amber-400 gap-0.5">
                  @for (star of [1, 2, 3, 4, 5]; track star) {
                    <svg
                      class="w-5 h-5"
                      [class.fill-current]="star <= review().rating"
                      [class.text-slate-200]="star > review().rating"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                  }
                </div>
              </div>
            </div>

            <!-- Title & Body -->
            <div class="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
              @if (review().title) {
                <h5 class="font-bold text-slate-900 text-lg">{{ review().title }}</h5>
              }
              <p
                class="text-slate-600 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap"
              >
                {{ review().review || 'Sin comentario.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div
          class="p-8 bg-slate-50 dark:bg-gray-900 border-t border-slate-100 flex justify-between items-center"
        >
          <button
            class="text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-widest text-xs"
          >
            Marcar para revisión
          </button>

          <div class="flex gap-4">
            <button
              (click)="onAction('rejected')"
              class="px-6 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors text-sm"
            >
              Rechazar
            </button>
            <button
              (click)="onAction('approved')"
              class="px-8 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-colors text-sm shadow-sm shadow-sky-200"
            >
              Aprobar Reseña
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReviewModerationModal {
  private readonly reviewsService = inject(ReviewsService);
  private readonly toast = inject(ToastService);
  private readonly tenantService = inject(TenantService);

  readonly timezone = this.tenantService.timezone;

  review = input.required<ProductReview>();
  close = output<void>();
  updated = output<void>();

  primaryImage = computed(() => {
    const product = this.review().product;
    if (!product?.product_images?.length) return 'assets/placeholder-product.png';
    const primary = product.product_images.find((img) => img.is_primary);
    return primary?.url || product.product_images[0].url;
  });

  statusClasses() {
    switch (this.review().status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  }

  async onAction(status: 'approved' | 'rejected') {
    try {
      await this.reviewsService.updateReviewStatus(this.review().id, status);
      this.toast.success(
        status === 'approved' ? 'Reseña aprobada exitosamente' : 'Reseña rechazada',
      );
      this.updated.emit();
      this.close.emit();
    } catch (error) {
      console.error('Error updating review:', error);
      this.toast.error('Error al actualizar la reseña');
    }
  }
}
