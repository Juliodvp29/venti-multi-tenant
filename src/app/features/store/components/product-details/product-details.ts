import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '@core/services/products';
import { CartService } from '@core/services/cart';
import { AnalyticsService } from '@core/services/analytics';
import { ReviewsService } from '@core/services/reviews';
import { AuthService } from '@core/services/auth';
import { CustomerAuthService } from '@core/services/customer-auth';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';
import { Product, ProductVariant } from '@core/models/product';
import { ProductReview } from '@core/models/review';
import { StorefrontSection } from '@core/models';
import { ProductCard } from '../product-card/product-card';
import { FormsModule } from '@angular/forms';
import { SeoService } from '@core/services/seo';

@Component({
  selector: 'app-product-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ProductCard, FormsModule, CurrencyPipe, DecimalPipe],
  template: `
    @if (product()) {
      <div
        class="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-16 animate-in fade-in duration-500"
      >
        <!-- Main Product Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <!-- Image Gallery -->
          <div class="space-y-3">
            <div
              class="aspect-square md:aspect-[4/5] max-h-[520px] w-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm cursor-zoom-in relative group"
              (click)="isZoomed.set(true)"
            >
              <img
                [src]="displayImage()"
                [alt]="$safeNavigationMigration(product()?.name)"
                loading="lazy"
                class="w-full h-full object-cover object-top transition-all duration-700 hover:scale-105"
              />
              <div
                class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <div
                  class="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform"
                >
                  <svg
                    class="w-5 h-5 text-slate-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </div>
              </div>

              <!-- Navigation Arrows -->
              @if ((product()?.images?.length || 0) > 1) {
                <button
                  (click)="prevImage($event)"
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-slate-900 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10 shadow-md border border-slate-200/60"
                  title="Previous image"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  (click)="nextImage($event)"
                  class="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-slate-900 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10 shadow-md border border-slate-200/60"
                  title="Next image"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              }
            </div>
            @if ((product()?.images?.length || 0) > 1) {
              <div class="grid grid-cols-5 gap-2">
                @for (img of product()?.images; track img.id) {
                  <div
                    (click)="selectedImage.set(img.url)"
                    class="aspect-square bg-white rounded-lg border-2 overflow-hidden cursor-pointer hover:border-sky-500 transition-all"
                    [class.border-sky-500]="displayImage() === img.url"
                    [class.border-slate-200]="displayImage() !== img.url"
                  >
                    <img
                      [src]="img.url"
                      [alt]="$safeNavigationMigration(product()?.name) + ' view'"
                      loading="lazy"
                      class="w-full h-full object-cover object-top"
                    />
                  </div>
                }
              </div>
            }
          </div>

          <!-- Zoom Overlay -->
          @if (isZoomed()) {
            <div
              class="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm p-4 cursor-zoom-out"
              (click)="isZoomed.set(false)"
              (mousemove)="onZoomMouseMove($event)"
            >
              <div
                class="relative w-full h-full overflow-hidden flex items-center justify-center pointer-events-none"
              >
                <img
                  [src]="displayImage()"
                  [style.transform]="'scale(2)'"
                  [style.transformOrigin]="zoomOrigin()"
                  class="max-w-none h-full w-auto object-contain transition-transform duration-300 ease-out"
                />
              </div>

              <!-- Close button -->
              <button
                class="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md hover:scale-110 active:scale-95 shadow-2xl"
              >
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div
                class="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/40 backdrop-blur-md text-white/80 text-sm font-medium rounded-full pointer-events-none border border-white/10"
              >
                Mueve el ratón para desplazar · Haz clic para cerrar
              </div>
            </div>
          }

          <!-- Info panel -->
          <div class="flex flex-col md:sticky md:top-6 md:self-start">
            <nav class="flex mb-3 text-sm text-slate-500">
              <a
                routerLink="/store"
                queryParamsHandling="preserve"
                class="hover:text-slate-900 transition-colors"
                >Tienda</a
              >
              <span class="mx-2">/</span>
              <span class="text-slate-900 font-medium truncate max-w-[200px]">{{
                product()?.name
              }}</span>
            </nav>

            <h1 class="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">
              {{ product()?.name }}
            </h1>

            <div class="flex items-center flex-wrap gap-3 mb-4">
              <span class="text-xl md:text-2xl font-bold text-slate-900">{{
                displayPrice() | currency: currency()
              }}</span>
              @if (displayComparePrice()) {
                <span class="text-base text-slate-400 line-through">{{
                  displayComparePrice() | currency: currency()
                }}</span>
                <span class="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                  -{{
                    ((displayComparePrice()! - displayPrice()) / displayComparePrice()!) * 100
                      | number: '1.0-0'
                  }}%
                </span>
              }
            </div>

            <p class="text-slate-600 mb-5 leading-relaxed text-sm">{{ product()?.description }}</p>

            <!-- Variants Selection -->
            @if (product()?.variants?.length) {
              <div class="space-y-4 mb-5">
                @for (opt of product()?.options; track opt.name) {
                  <div class="space-y-2">
                    <p class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {{ opt.name }}
                    </p>
                    <div class="flex flex-wrap gap-2">
                      @for (val of opt.values; track val) {
                        <button
                          (click)="selectOption(opt.name, val)"
                          class="px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all cursor-pointer"
                          [class.border-sky-600]="selectedOptions()[opt.name] === val"
                          [class.bg-sky-50]="selectedOptions()[opt.name] === val"
                          [class.text-sky-700]="selectedOptions()[opt.name] === val"
                          [class.border-slate-200]="selectedOptions()[opt.name] !== val"
                          [class.text-slate-600]="selectedOptions()[opt.name] !== val"
                          [class.hover:border-slate-300]="selectedOptions()[opt.name] !== val"
                        >
                          {{ val }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <div class="mt-auto space-y-3 pt-4 border-t border-slate-100">
              <div class="flex items-center gap-4">
                <div
                  class="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
                >
                  <button
                    (click)="qty.set(math.max(1, qty() - 1))"
                    class="px-4 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-r border-slate-100 text-slate-700 font-bold"
                  >
                    −
                  </button>
                  <span class="px-4 py-2.5 font-bold min-w-[3rem] text-center text-slate-900">{{
                    qty()
                  }}</span>
                  <button
                    (click)="qty.set(qty() + 1)"
                    class="px-4 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-l border-slate-100 text-slate-700 font-bold"
                  >
                    +
                  </button>
                </div>
                <p class="text-sm text-slate-500">
                  @if (selectedVariant()) {
                    {{ selectedVariant()?.stock_quantity }} disponibles
                  } @else {
                    {{ product()?.stock_quantity }} disponibles
                  }
                </p>
              </div>

              <button
                (click)="addToCart()"
                [disabled]="!isSelectionComplete()"
                class="w-full py-3.5 rounded-xl font-bold shadow-lg shadow-slate-200 transition-all duration-300 transform active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-base"
                [class]="
                  added()
                    ? 'bg-green-500 text-white shadow-green-100'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                "
              >
                @if (added()) {
                  <span
                    class="flex items-center justify-center gap-2 animate-in zoom-in duration-300"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M5 13l4 4L19 7"
                      />
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
              <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-2">
                Productos Similares
              </h2>
              <p class="text-slate-500 font-medium">Otros productos que podrían interesarte.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              @for (p of relatedProducts(); track p.id) {
                <app-product-card
                  [product]="p"
                  class="animate-in fade-in slide-in-from-bottom-2 duration-500"
                ></app-product-card>
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
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                      </svg>
                    }
                  </div>
                  <span class="text-2xl font-bold text-slate-900"
                    >{{ reviews().length }} Reseñas</span
                  >
                </div>
                <p class="text-slate-500">Comparte tu experiencia con otros clientes.</p>
              </div>

              <!-- Review Form -->
              <div class="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                @if (reviewStep() === 'form') {
                  <h3 class="text-xl font-bold text-slate-900 mb-6">Dejar una reseña</h3>
                  <div class="space-y-6">
                    <div>
                      <label
                        class="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3"
                        >Tu Valoración</label
                      >
                      <div class="flex gap-2">
                        @for (star of [1, 2, 3, 4, 5]; track star) {
                          <button
                            (click)="setRating(star)"
                            class="p-1 transition-all hover:scale-110 cursor-pointer"
                            [class.text-amber-400]="reviewForm().rating >= star"
                            [class.text-slate-300]="reviewForm().rating < star"
                          >
                            <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
                              />
                            </svg>
                          </button>
                        }
                      </div>
                    </div>

                    <div>
                      <label
                        class="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2"
                        >Título (Opcional)</label
                      >
                      <input
                        [(ngModel)]="reviewForm().title"
                        type="text"
                        placeholder="p. ej. ¡Me encantó!"
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label
                        class="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2"
                        >Reseña (Opcional)</label
                      >
                      <textarea
                        [(ngModel)]="reviewForm().review"
                        rows="4"
                        placeholder="Cuéntanos qué te pareció el producto..."
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all resize-none"
                      ></textarea>
                    </div>

                    <button
                      (click)="submitReview()"
                      [disabled]="reviewForm().rating === 0 || isSubmittingReview()"
                      class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {{ isSubmittingReview() ? 'Enviando...' : 'Publicar Reseña' }}
                    </button>
                  </div>
                } @else {
                  <div class="text-center py-8 animate-in zoom-in duration-500">
                    <div
                      class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-2">¡Gracias por tu reseña!</h3>
                    <p class="text-slate-500 mb-6">
                      Tu reseña ha sido enviada exitosamente y será visible tan pronto como sea
                      aprobada.
                    </p>
                    <button
                      (click)="reviewStep.set('form')"
                      class="text-sky-600 font-bold hover:underline"
                    >
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
                  <div
                    class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
                  >
                    <div class="flex justify-between items-start mb-6">
                      <div>
                        <div class="flex text-amber-400 mb-2">
                          @for (star of [1, 2, 3, 4, 5]; track star) {
                            <svg
                              class="w-4 h-4"
                              [class.fill-current]="review.rating >= star"
                              [class.text-slate-200]="review.rating < star"
                              viewBox="0 0 20 20"
                            >
                              <path
                                d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
                              />
                            </svg>
                          }
                        </div>
                        <h4 class="text-xl font-bold text-slate-900">
                          {{ review.title || 'Sin título' }}
                        </h4>
                      </div>
                      <span class="text-sm text-slate-400 font-medium">{{
                        review.created_at | date: 'mediumDate' : timezone() : 'es'
                      }}</span>
                    </div>

                    <p class="text-slate-600 leading-relaxed mb-6">
                      {{ review.review || 'Sin reseña.' }}
                    </p>

                    <div class="flex items-center gap-3 border-t border-slate-50 pt-6">
                      <div
                        class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 uppercase"
                      >
                        {{ review.customer?.first_name?.[0] || 'U' }}
                      </div>
                      <div>
                        <p class="text-sm font-bold text-slate-900">
                          {{
                            review.customer
                              ? review.customer.first_name + ' ' + (review.customer.last_name || '')
                              : 'Usuario Verificado'
                          }}
                        </p>
                        @if (review.is_verified_purchase) {
                          <p
                            class="text-[10px] text-green-600 font-black uppercase tracking-widest flex items-center gap-1"
                          >
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                              />
                            </svg>
                            Compra Verificada
                          </p>
                        }
                      </div>
                    </div>
                  </div>
                }
              } @else {
                <div
                  class="bg-slate-50 rounded-3xl p-16 text-center border border-dashed border-slate-200"
                >
                  <div
                    class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-sm"
                  >
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                  </div>
                  <h4 class="text-xl font-bold text-slate-900 mb-2">Aún no hay reseñas</h4>
                  <p class="text-slate-500">Sé el primero en calificar este producto.</p>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Product Detail Configured Sections (e.g. Benefits) -->
        @for (section of sections(); track section.id) {
          @if (section.isActive && section.type === 'benefits') {
            <div class="py-12 border-t border-slate-100">
              <h3 class="text-xl font-bold text-center text-slate-900 mb-8">
                {{ asAny(section.content).title }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                @for (item of asAny(section.content).items || []; track item.id) {
                  <div
                    class="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-center space-y-2"
                  >
                    <span class="text-3xl block">{{ item.icon || '🛡️' }}</span>
                    <h4 class="text-sm font-bold text-slate-900">{{ item.title }}</h4>
                    <p class="text-xs text-slate-500">{{ item.description }}</p>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    } @else {
      <div class="h-96 flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    }
  `,
})
export class ProductDetails implements OnInit {
  asAny(val: any): any {
    return val;
  }
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly analytics = inject(AnalyticsService);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly customerAuth = inject(CustomerAuthService);
  private readonly seo = inject(SeoService);
  private readonly tenantService = inject(TenantService);
  protected readonly toast = inject(ToastService);

  readonly pageConfig = computed(() => this.tenantService.getPageLayout('product_detail'));
  readonly sections = computed<StorefrontSection[]>(() => this.pageConfig()?.sections || []);
  readonly currency = this.tenantService.currency;
  readonly timezone = this.tenantService.timezone;

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

  nextImage(event: Event) {
    event.stopPropagation();
    const images = this.product()?.images || [];
    if (images.length <= 1) return;

    const currentUrl = this.displayImage();
    const currentIndex = images.findIndex((img) => img.url === currentUrl);
    const nextIndex = (currentIndex + 1) % images.length;
    this.selectedImage.set(images[nextIndex].url);
  }

  prevImage(event: Event) {
    event.stopPropagation();
    const images = this.product()?.images || [];
    if (images.length <= 1) return;

    const currentUrl = this.displayImage();
    const currentIndex = images.findIndex((img) => img.url === currentUrl);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    this.selectedImage.set(images[prevIndex].url);
  }

  // Review Form State
  readonly reviewForm = signal({
    rating: 0,
    title: '',
    review: '',
  });
  readonly isSubmittingReview = signal(false);
  readonly reviewStep = signal<'form' | 'success'>('form');

  // Variant Management
  readonly selectedOptions = signal<Record<string, string>>({});

  readonly selectedVariant = computed(() => {
    const p = this.product();
    const selected = this.selectedOptions();
    if (!p?.variants?.length || Object.keys(selected).length === 0) return null;

    return (
      p.variants.find((v: ProductVariant) => {
        return Object.entries(selected).every(([key, val]) => v.options[key] === val);
      }) || null
    );
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
    this.route.params.subscribe((params) => {
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
          (data.variants || []).forEach((v) => {
            Object.entries(v.options || {}).forEach(([key, val]) => {
              if (!optionsMap[key]) optionsMap[key] = new Set();
              optionsMap[key].add(val);
            });
          });

          data.options = Object.entries(optionsMap).map(([name, values]) => ({
            name,
            values: Array.from(values),
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
      const categoryIds =
        (product as any).categories?.map((c: any) => c.category?.id).filter(Boolean) || [];

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
      this.toast.success('¡Gracias! Tu reseña ha sido enviada.');
    } catch (error) {
      console.error('Error submitting review:', error);
      this.toast.error('Ocurrió un error al enviar tu reseña.');
    } finally {
      this.isSubmittingReview.set(false);
    }
  }

  setRating(rating: number) {
    this.reviewForm.update((f) => ({ ...f, rating }));
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
    this.selectedOptions.update((opts) => ({
      ...opts,
      [name]: value,
    }));
  }

  private updateSeo(product: Product) {
    this.seo.updateTags({
      title: product.name,
      description: product.description || undefined,
      image: product.primary_image_url || product.images?.[0]?.url || undefined,
      type: 'product',
      keywords: [product.name, 'ecommerce', 'venti'],
    });

    this.seo.setProductSchema({
      name: product.name,
      description: product.description || undefined,
      image: product.primary_image_url || product.images?.[0]?.url || undefined,
      price: product.price,
      currency: this.currency(),
      sku: product.sku || undefined,
      availability: product.stock_quantity > 0 ? 'InStock' : 'OutOfStock',
    });
  }
}
