import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '@core/services/products';
import { CartService } from '@core/services/cart';
import { AnalyticsService } from '@core/services/analytics';
import { ReviewsService } from '@core/services/reviews';
import { AuthService } from '@core/services/auth';
import { CustomerAuthService } from '@core/services/customer-auth';
import { ToastService } from '@core/services/toast';
import { Product, ProductVariant } from '@core/models/product';
import { ProductReview } from '@core/models/review';
import { ProductCard } from '../product-card/product-card';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ProductCard, FormsModule],
  template: `
    @if (product()) {
      <div class="space-y-24 animate-in fade-in duration-500">
        <!-- Main Product Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <!-- Image Gallery -->
          <div class="space-y-4">
            <div class="aspect-square bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <img [src]="displayImage()" [alt]="product()?.name" class="w-full h-full object-cover transition-all duration-500">
            </div>
            <div class="grid grid-cols-4 gap-4">
              @for (img of product()?.images; track img.id) {
                <div class="aspect-square bg-white rounded-xl border border-slate-100 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all">
                  <img [src]="img.url" class="w-full h-full object-cover">
                </div>
              }
            </div>
          </div>

          <!-- Info -->
          <div class="flex flex-col">
            <nav class="flex mb-4 text-sm text-slate-500">
              <a routerLink="/store" class="hover:text-slate-900">Tienda</a>
              <span class="mx-2">/</span>
              <span class="text-slate-900 font-medium">{{ product()?.name }}</span>
            </nav>

            <h1 class="text-4xl font-bold text-slate-900 mb-2">{{ product()?.name }}</h1>
            <div class="flex items-center gap-4 mb-6">
              <span class="text-3xl font-bold" [style.color]="'var(--primary-color)'">{{ displayPrice() | currency }}</span>
              @if (displayComparePrice()) {
                <span class="text-xl text-slate-400 line-through">{{ displayComparePrice() | currency }}</span>
              }
            </div>

            <p class="text-slate-600 mb-8 leading-relaxed">{{ product()?.description }}</p>

            <!-- Variants Selection -->
            @if (product()?.variants?.length) {
              <div class="space-y-6 mb-8">
                @for (opt of product()?.options; track opt.name) {
                  <div class="space-y-3">
                    <p class="text-sm font-bold text-slate-900 uppercase tracking-wider">{{ opt.name }}</p>
                    <div class="flex flex-wrap gap-2">
                      @for (val of opt.values; track val) {
                        <button 
                          (click)="selectOption(opt.name, val)"
                          class="px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer"
                          [class.border-indigo-600]="selectedOptions()[opt.name] === val"
                          [class.bg-indigo-50]="selectedOptions()[opt.name] === val"
                          [class.text-indigo-700]="selectedOptions()[opt.name] === val"
                          [class.border-slate-200]="selectedOptions()[opt.name] !== val"
                          [class.text-slate-600]="selectedOptions()[opt.name] !== val"
                          [class.hover:border-slate-300]="selectedOptions()[opt.name] !== val">
                          {{ val }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <div class="mt-auto space-y-4">
              <div class="flex items-center gap-4">
                <div class="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button (click)="qty.set(math.max(1, qty() - 1))" class="px-4 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-r border-slate-100">-</button>
                  <span class="px-4 py-2 font-bold min-w-[3rem] text-center text-slate-900">{{ qty() }}</span>
                  <button (click)="qty.set(qty() + 1)" class="px-4 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-l border-slate-100">+</button>
                </div>
                <p class="text-sm text-slate-500">
                  @if (selectedVariant()) {
                    {{ selectedVariant()?.stock_quantity }} disponibles
                  } @else {
                    Sólo {{ product()?.stock_quantity }} disponibles
                  }
                </p>
              </div>

              <button 
                (click)="addToCart()" 
                [disabled]="!isSelectionComplete()"
                class="w-full py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all duration-300 transform active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                [class]="added() ? 'bg-green-500 text-white shadow-green-100' : 'bg-slate-900 text-white hover:bg-slate-800'">
                
                @if (added()) {
                  <span class="flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Añadido al Carrito!
                  </span>
                } @else {
                  {{ isSelectionComplete() ? 'Añadir al Carrito' : 'Selecciona una opción' }}
                }
              </button>
            </div>
          </div>
        </div>

        <!-- Related Products Section -->
        @if (relatedProducts().length > 0) {
          <section class="pt-12 border-t border-slate-100">
            <div class="mb-8">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Productos Similares</h2>
              <p class="text-slate-500 font-medium">Otros productos que podrían interesarte.</p>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              @for (p of relatedProducts(); track p.id) {
                <app-product-card [product]="p" class="animate-in fade-in slide-in-from-bottom-2 duration-500"></app-product-card>
              }
            </div>
          </section>
        }

        <!-- Reviews Section -->
        <section class="pt-24 border-t border-slate-100">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <!-- Sidebar: Rating Summary & Form -->
            <div class="space-y-12">
              <div>
                <h2 class="text-4xl font-black text-slate-900 tracking-tight mb-4">Reseñas</h2>
                <div class="flex items-center gap-4 mb-2">
                  <div class="flex text-amber-400">
                    @for (star of [1,2,3,4,5]; track star) {
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    }
                  </div>
                  <span class="text-2xl font-bold text-slate-900">{{ reviews().length }} Reseñas</span>
                </div>
                <p class="text-slate-500">Comparte tu experiencia con otros clientes.</p>
              </div>

              <!-- Review Form -->
              <div class="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                @if (reviewStep() === 'form') {
                  <h3 class="text-xl font-bold text-slate-900 mb-6">Deja tu opinión</h3>
                  <div class="space-y-6">
                    <div>
                      <label class="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Tu Calificación</label>
                      <div class="flex gap-2">
                        @for (star of [1,2,3,4,5]; track star) {
                          <button 
                            (click)="setRating(star)"
                            class="p-1 transition-all hover:scale-110 cursor-pointer"
                            [class.text-amber-400]="reviewForm().rating >= star"
                            [class.text-slate-300]="reviewForm().rating < star">
                            <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          </button>
                        }
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Título (Opcional)</label>
                      <input 
                        [(ngModel)]="reviewForm().title"
                        type="text" 
                        placeholder="Ej: ¡Me encantó!"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    </div>

                    <div>
                      <label class="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Comentario (Opcional)</label>
                      <textarea 
                        [(ngModel)]="reviewForm().review"
                        rows="4" 
                        placeholder="Cuéntanos qué tal te pareció el producto..."
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
                    </div>

                    <button 
                      (click)="submitReview()"
                      [disabled]="reviewForm().rating === 0 || isSubmittingReview()"
                      class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                      {{ isSubmittingReview() ? 'Enviando...' : 'Publicar Reseña' }}
                    </button>
                  </div>
                } @else {
                  <div class="text-center py-8 animate-in zoom-in duration-500">
                    <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-2">¡Gracias por tu opinión!</h3>
                    <p class="text-slate-500 mb-6">Tu reseña ha sido enviada con éxito y será visible tan pronto sea aprobada.</p>
                    <button 
                      (click)="reviewStep.set('form')"
                      class="text-indigo-600 font-bold hover:underline">
                      Enviar otra reseña
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- Reviews List -->
            <div class="lg:col-span-2 space-y-8">
              @if (reviews().length > 0) {
                @for (review of reviews(); track review.id) {
                  <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div class="flex justify-between items-start mb-6">
                      <div>
                        <div class="flex text-amber-400 mb-2">
                          @for (star of [1,2,3,4,5]; track star) {
                            <svg class="w-4 h-4" [class.fill-current]="review.rating >= star" [class.text-slate-200]="review.rating < star" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          }
                        </div>
                        <h4 class="text-xl font-bold text-slate-900">{{ review.title || 'Sin título' }}</h4>
                      </div>
                      <span class="text-sm text-slate-400 font-medium">{{ review.created_at | date:'mediumDate' }}</span>
                    </div>

                    <p class="text-slate-600 leading-relaxed mb-6">{{ review.review || 'Sin comentario.' }}</p>

                    <div class="flex items-center gap-3 border-t border-slate-50 pt-6">
                      <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                        {{ review.customer?.first_name?.[0] || 'U' }}
                      </div>
                      <div>
                        <p class="text-sm font-bold text-slate-900">
                          {{ review.customer ? (review.customer.first_name + ' ' + (review.customer.last_name || '')) : 'Usuario Verificado' }}
                        </p>
                        @if (review.is_verified_purchase) {
                          <p class="text-[10px] text-green-600 font-black uppercase tracking-widest flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            Compra Verificada
                          </p>
                        }
                      </div>
                    </div>
                  </div>
                }
              } @else {
                <div class="bg-slate-50 rounded-3xl p-16 text-center border border-dashed border-slate-200">
                  <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-sm">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h4 class="text-xl font-bold text-slate-900 mb-2">Aún no hay reseñas</h4>
                  <p class="text-slate-500">Sé el primero en calificar este producto.</p>
                </div>
              }
            </div>
          </div>
        </section>
      </div>
    } @else {
      <div class="h-96 flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }
  `,
})
export class ProductDetails implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly analytics = inject(AnalyticsService);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly customerAuth = inject(CustomerAuthService);
  protected readonly toast = inject(ToastService);

  readonly product = signal<Product | null>(null);
  readonly relatedProducts = signal<Product[]>([]);
  readonly reviews = signal<ProductReview[]>([]);
  readonly reviewsCount = signal(0);
  readonly qty = signal(1);
  readonly added = signal(false);
  readonly math = Math;

  // Review Form State
  readonly reviewForm = signal({
    rating: 0,
    title: '',
    review: ''
  });
  readonly isSubmittingReview = signal(false);
  readonly reviewStep = signal<'form' | 'success'>('form');

  // Variant Management
  readonly selectedOptions = signal<Record<string, string>>({});

  readonly selectedVariant = computed(() => {
    const p = this.product();
    const selected = this.selectedOptions();
    if (!p?.variants?.length || Object.keys(selected).length === 0) return null;

    return p.variants.find(v => {
      return Object.entries(selected).every(([key, val]) => v.options[key] === val);
    }) || null;
  });

  readonly displayPrice = computed(() => {
    const v = this.selectedVariant();
    const p = this.product();
    return v?.price ?? p?.price ?? 0;
  });

  readonly displayComparePrice = computed(() => {
    const v = this.selectedVariant();
    const p = this.product();
    return v?.compare_at_price ?? p?.compare_at_price ?? null;
  });

  readonly displayImage = computed(() => {
    const v = this.selectedVariant();
    const p = this.product();
    return v?.image_url || p?.primary_image_url || p?.images?.[0]?.url;
  });

  readonly isSelectionComplete = computed(() => {
    const p = this.product();
    if (!p?.options?.length) return true;
    const selectedCount = Object.keys(this.selectedOptions()).length;
    return selectedCount === p.options.length;
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadProduct(params['id']);
      }
    });
  }

  async loadProduct(id: string) {
    try {
      const data = await this.productsService.getProduct(id);
      if (data) {
        // Infer options if missing
        if (!data.options || data.options.length === 0) {
          const optionsMap: Record<string, Set<string>> = {};
          (data.variants || []).forEach(v => {
            Object.entries(v.options || {}).forEach(([key, val]) => {
              if (!optionsMap[key]) optionsMap[key] = new Set();
              optionsMap[key].add(val);
            });
          });

          data.options = Object.entries(optionsMap).map(([name, values]) => ({
            name,
            values: Array.from(values)
          }));
        }

        this.product.set(data);
        this.analytics.trackProductView(data.id);
        this.loadRelatedProducts(data);
        this.loadReviews(data.id);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    }
  }

  async loadRelatedProducts(product: Product) {
    try {
      // Extract category IDs from the product categories join
      const categoryIds = (product as any).categories
        ?.map((c: any) => c.category?.id)
        .filter(Boolean) || [];

      if (categoryIds.length > 0) {
        const related = await this.productsService.getRelatedProducts(product.id, categoryIds);
        this.relatedProducts.set(related);
      }
    } catch (error) {
      console.error('Error loading related products:', error);
    }
  }

  async loadReviews(productId: string) {
    try {
      const { data, count } = await this.reviewsService.getReviews(productId);
      this.reviews.set(data);
      this.reviewsCount.set(count);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  }

  async submitReview() {
    const p = this.product();
    const form = this.reviewForm();
    if (!p || form.rating === 0 || this.isSubmittingReview()) return;

    if (!this.auth.isAuthenticated()) {
      this.toast.warning('Debes iniciar sesión para publicar una reseña.');
      this.customerAuth.openLogin();
      return;
    }

    this.isSubmittingReview.set(true);
    try {
      // Ensure customer record exists find it first
      const customer = await this.customerAuth.ensureCustomer();
      if (!customer) throw new Error('No se pudo identificar al cliente');

      await this.reviewsService.createReview({
        product_id: p.id,
        customer_id: customer.id,
        rating: form.rating as any,
        title: form.title,
        review: form.review,
      });
      this.reviewStep.set('success');
      this.reviewForm.set({ rating: 0, title: '', review: '' });
      this.toast.success('¡Gracias! Tu reseña ha sido enviada.');
    } catch (error) {
      console.error('Error submitting review:', error);
      this.toast.error('Ocurrió un error al enviar tu reseña.');
    } finally {
      this.isSubmittingReview.set(false);
    }
  }

  setRating(rating: number) {
    this.reviewForm.update(f => ({ ...f, rating }));
  }

  addToCart() {
    const p = this.product();
    if (p) {
      const variant = this.selectedVariant();
      this.cartService.addToCart(p, this.qty(), variant || undefined);
      this.analytics.trackAddToCart(p.id, this.qty());

      // Show feedback
      this.added.set(true);
      setTimeout(() => this.added.set(false), 2000);
    }
  }

  selectOption(name: string, value: string) {
    this.selectedOptions.update(opts => ({
      ...opts,
      [name]: value
    }));
  }
}
