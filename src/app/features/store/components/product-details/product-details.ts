import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
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
import { SeoService } from '@core/services/seo';

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
            <div class="aspect-[4/5] bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-sm cursor-zoom-in relative group" (click)="isZoomed.set(true)">
              <img [src]="displayImage()" [alt]="product()?.name" loading="lazy" 
                   class="w-full h-full object-cover object-top transition-all duration-700 hover:scale-105">
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div class="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                  <svg class="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-4">
              @for (img of product()?.images; track img.id) {
                <div (click)="selectedImage.set(img.url)" 
                     class="aspect-[4/5] bg-white rounded-xl border-2 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all"
                     [class.border-indigo-500]="displayImage() === img.url"
                     [class.border-transparent]="displayImage() !== img.url">
                  <img [src]="img.url" [alt]="product()?.name + ' view'" loading="lazy" class="w-full h-full object-cover object-top">
                </div>
              }
            </div>
          </div>

          <!-- Zoom Overlay -->
          @if (isZoomed()) {
            <div class="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm p-4 cursor-zoom-out" 
                 (click)="isZoomed.set(false)" 
                 (mousemove)="onZoomMouseMove($event)">
              
              <div class="relative w-full h-full overflow-hidden flex items-center justify-center pointer-events-none">
                <img [src]="displayImage()" 
                     [style.transform]="'scale(2)'"
                     [style.transformOrigin]="zoomOrigin()"
                     class="max-w-none h-full w-auto object-contain transition-transform duration-300 ease-out">
              </div>

              <!-- Close button -->
              <button class="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md hover:scale-110 active:scale-95 shadow-2xl">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div class="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/40 backdrop-blur-md text-white/80 text-sm font-medium rounded-full pointer-events-none border border-white/10">
                Move mouse to pan · Click to close
              </div>
            </div>
          }

          <!-- Info -->
          <div class="flex flex-col">
            <nav class="flex mb-4 text-sm text-slate-500">
              <a routerLink="/store" queryParamsHandling="preserve" class="hover:text-slate-900">Store</a>
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
                    {{ selectedVariant()?.stock_quantity }} available
                  } @else {
                    Only {{ product()?.stock_quantity }} available
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
                    Added to Cart!
                  </span>
                } @else {
                  {{ isSelectionComplete() ? 'Add to Cart' : 'Select an option' }}
                }
              </button>
            </div>
          </div>
        </div>

        <!-- Related Products Section -->
        @if (relatedProducts().length > 0) {
          <section class="pt-12 border-t border-slate-100">
            <div class="mb-8">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Similar Products</h2>
              <p class="text-slate-500 font-medium">Other products that might interest you.</p>
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
                <h2 class="text-4xl font-black text-slate-900 tracking-tight mb-4">Reviews</h2>
                <div class="flex items-center gap-4 mb-2">
                  <div class="flex text-amber-400">
                    @for (star of [1,2,3,4,5]; track star) {
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    }
                  </div>
                  <span class="text-2xl font-bold text-slate-900">{{ reviews().length }} Reviews</span>
                </div>
                <p class="text-slate-500">Share your experience with other customers.</p>
              </div>

              <!-- Review Form -->
              <div class="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                @if (reviewStep() === 'form') {
                  <h3 class="text-xl font-bold text-slate-900 mb-6">Leave a review</h3>
                  <div class="space-y-6">
                    <div>
                      <label class="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Your Rating</label>
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
                      <label class="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Title (Optional)</label>
                      <input 
                        [(ngModel)]="reviewForm().title"
                        type="text" 
                        placeholder="e.g. I loved it!"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    </div>

                    <div>
                      <label class="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Review (Optional)</label>
                      <textarea 
                        [(ngModel)]="reviewForm().review"
                        rows="4" 
                        placeholder="Tell us how you liked the product..."
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
                    </div>

                    <button 
                      (click)="submitReview()"
                      [disabled]="reviewForm().rating === 0 || isSubmittingReview()"
                      class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                      {{ isSubmittingReview() ? 'Sending...' : 'Post Review' }}
                    </button>
                  </div>
                } @else {
                  <div class="text-center py-8 animate-in zoom-in duration-500">
                    <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-2">Thank you for your review!</h3>
                    <p class="text-slate-500 mb-6">Your review has been successfully submitted and will be visible as soon as it is approved.</p>
                    <button 
                      (click)="reviewStep.set('form')"
                      class="text-indigo-600 font-bold hover:underline">
                      Submit another review
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
                        <h4 class="text-xl font-bold text-slate-900">{{ review.title || 'Untitled' }}</h4>
                      </div>
                      <span class="text-sm text-slate-400 font-medium">{{ review.created_at | date:'mediumDate' }}</span>
                    </div>

                    <p class="text-slate-600 leading-relaxed mb-6">{{ review.review || 'No review.' }}</p>

                    <div class="flex items-center gap-3 border-t border-slate-50 pt-6">
                      <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                        {{ review.customer?.first_name?.[0] || 'U' }}
                      </div>
                      <div>
                        <p class="text-sm font-bold text-slate-900">
                          {{ review.customer ? (review.customer.first_name + ' ' + (review.customer.last_name || '')) : 'Verified User' }}
                        </p>
                        @if (review.is_verified_purchase) {
                          <p class="text-[10px] text-green-600 font-black uppercase tracking-widest flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            Verified Purchase
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
                  <h4 class="text-xl font-bold text-slate-900 mb-2">No reviews yet</h4>
                  <p class="text-slate-500">Be the first to review this product.</p>
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
  private readonly seo = inject(SeoService);
  protected readonly toast = inject(ToastService);

  readonly product = signal<Product | null>(null);
  readonly relatedProducts = signal<Product[]>([]);
  readonly reviews = signal<ProductReview[]>([]);
  readonly reviewsCount = signal(0);
  readonly qty = signal(1);
  readonly added = signal(false);
  readonly math = Math;

  readonly selectedImage = signal<string | null>(null);
  readonly isZoomed = signal(false);
  readonly zoomOrigin = signal('center');

  @HostListener('window:keydown.escape')
  closeZoom() {
    this.isZoomed.set(false);
  }

  onZoomMouseMove(event: MouseEvent) {
    if (!this.isZoomed()) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    this.zoomOrigin.set(`${x * 100}% ${y * 100}%`);
  }

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

    return p.variants.find((v: ProductVariant) => {
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
    if (this.selectedImage()) return this.selectedImage();
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
        this.updateSeo(data);
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
      this.toast.warning('You must log in to post a review.');
      this.customerAuth.openLogin();
      return;
    }

    this.isSubmittingReview.set(true);
    try {
      // Ensure customer record exists find it first
      const customer = await this.customerAuth.ensureCustomer();
      if (!customer) throw new Error('Could not identify the customer');

      await this.reviewsService.createReview({
        product_id: p.id,
        customer_id: customer.id,
        rating: form.rating as any,
        title: form.title,
        review: form.review,
      });
      this.reviewStep.set('success');
      this.reviewForm.set({ rating: 0, title: '', review: '' });
      this.toast.success('Thank you! Your review has been submitted.');
    } catch (error) {
      console.error('Error submitting review:', error);
      this.toast.error('An error occurred while sending your review.');
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

  private updateSeo(product: Product) {
    this.seo.updateTags({
      title: product.name,
      description: product.description || undefined,
      image: product.primary_image_url || product.images?.[0]?.url || undefined,
      type: 'product',
      keywords: [product.name, 'ecommerce', 'venti']
    });

    this.seo.setProductSchema({
      name: product.name,
      description: product.description || undefined,
      image: product.primary_image_url || product.images?.[0]?.url || undefined,
      price: product.price,
      currency: 'USD',
      sku: product.sku || undefined,
      availability: product.stock_quantity > 0 ? 'InStock' : 'OutOfStock'
    });
  }
}
