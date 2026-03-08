import { Component, input, output, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductReview } from '@core/models/review';
import { ReviewsService } from '@core/services/reviews';
import { ToastService } from '@core/services/toast';

@Component({
  selector: 'app-review-moderation-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div class="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col">
        <!-- Header -->
        <div class="p-8 border-b border-slate-100 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h2 class="text-2xl font-black text-slate-900">Moderación de reseñas</h2>
              <span [class]="statusClasses()" class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                {{ review().status }}
              </span>
            </div>
            <p class="text-sm font-medium text-slate-400">ID: {{ review().id }}</p>
          </div>
          <button (click)="close.emit()" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-8 overflow-y-auto max-h-[70vh]">
          <div class="grid grid-cols-2 gap-8 mb-8">
            <!-- Reviewer -->
            <div class="space-y-3">
              <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</p>
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                  {{ review().customer?.first_name?.[0] || 'U' }}
                </div>
                <div>
                  <p class="font-bold text-slate-900">{{ review().customer?.first_name }} {{ review().customer?.last_name }}</p>
                  @if (review().is_verified_purchase) {
                    <p class="text-[10px] text-green-600 font-black uppercase tracking-widest flex items-center gap-1">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      Compra verificada
                    </p>
                  }
                </div>
              </div>
            </div>

            <!-- Product -->
            <div class="space-y-3">
              <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Producto</p>
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <img [src]="primaryImage()" class="w-full h-full object-cover">
                </div>
                <div>
                  <p class="font-bold text-slate-900">{{ review().product?.name }}</p>
                  <p class="text-xs text-slate-400">SKU: {{ review().product?.sku || 'N/A' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Review Details -->
          <div class="space-y-6">
            <div>
              <div class="flex text-amber-400 mb-4">
                @for (star of [1,2,3,4,5]; track star) {
                  <svg class="w-6 h-6" [class.fill-current]="review().rating >= star" [class.text-slate-200]="review().rating < star" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                }
                <span class="ml-2 text-slate-900 font-bold">{{ review().rating }}.0 / 5.0</span>
              </div>
              <h3 class="text-2xl font-black text-slate-900 mb-2">{{ review().title || 'Sin título' }}</h3>
              <p class="text-slate-600 leading-relaxed text-lg">
                {{ review().review || 'Sin comentario.' }}
              </p>
            </div>

            <!-- Context Info -->
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-slate-50 p-4 rounded-2xl">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID de Orden</p>
                <p class="font-bold text-slate-900">#{{ (review().order_id?.split('-') || [])[0] || 'N/A' }}</p>
              </div>
              <div class="bg-slate-50 p-4 rounded-2xl">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                <p class="font-bold text-slate-900">{{ review().created_at | date:'mediumDate' }}</p>
              </div>
              <div class="bg-slate-50 p-4 rounded-2xl">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                <p class="font-bold text-slate-900 capitalize">{{ review().status }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button class="text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-widest text-xs">
            Marcar para revisión
          </button>
          
          <div class="flex gap-4">
            <button 
              (click)="onAction('rejected')"
              class="px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-all active:scale-[0.98]">
              Rechazar reseña
            </button>
            <button 
              (click)="onAction('approved')"
              class="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
              Aprobar reseña
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

  review = input.required<ProductReview>();
  close = output<void>();
  updated = output<void>();

  primaryImage = computed(() => {
    const product = this.review().product;
    if (!product?.product_images?.length) return 'assets/placeholder-product.png';
    const primary = product.product_images.find(img => img.is_primary);
    return primary?.url || product.product_images[0].url;
  });

  statusClasses() {
    switch (this.review().status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  }

  async onAction(status: 'approved' | 'rejected') {
    try {
      await this.reviewsService.updateReviewStatus(this.review().id, status);
      this.toast.success(status === 'approved' ? 'Reseña aprobada exitosamente' : 'Reseña rechazada');
      this.updated.emit();
      this.close.emit();
    } catch (error) {
      console.error('Error updating review:', error);
      this.toast.error('Error al actualizar la reseña');
    }
  }
}
