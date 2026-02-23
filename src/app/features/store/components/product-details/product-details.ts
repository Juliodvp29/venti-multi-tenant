import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '@core/services/products';
import { CartService } from '@core/services/cart';
import { AnalyticsService } from '@core/services/analytics';
import { Product } from '@core/models/product';
import { ProductCard } from '../product-card/product-card';

@Component({
    selector: 'app-product-details',
    standalone: true,
    imports: [CommonModule, RouterLink, ProductCard],
    template: `
    @if (product()) {
      <div class="space-y-24 animate-in fade-in duration-500">
        <!-- Main Product Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <!-- Image Gallery -->
          <div class="space-y-4">
            <div class="aspect-square bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <img [src]="product()?.images?.[0]?.url" [alt]="product()?.name" class="w-full h-full object-cover">
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
              <span class="text-3xl font-bold" [style.color]="'var(--primary-color)'">{{ product()?.price | currency }}</span>
              @if (product()?.compare_at_price) {
                <span class="text-xl text-slate-400 line-through">{{ product()?.compare_at_price | currency }}</span>
              }
            </div>

            <p class="text-slate-600 mb-8 leading-relaxed">{{ product()?.description }}</p>

            <div class="mt-auto space-y-4">
              <div class="flex items-center gap-4">
                <div class="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button (click)="qty.set(math.max(1, qty() - 1))" class="px-4 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-r border-slate-100">-</button>
                  <span class="px-4 py-2 font-bold min-w-[3rem] text-center text-slate-900">{{ qty() }}</span>
                  <button (click)="qty.set(qty() + 1)" class="px-4 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-l border-slate-100">+</button>
                </div>
                <p class="text-sm text-slate-500">Sólo {{ product()?.stock_quantity }} disponibles</p>
              </div>

              <button 
                (click)="addToCart()" 
                class="w-full py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
                [class]="added() ? 'bg-green-500 text-white shadow-green-100' : 'bg-slate-900 text-white hover:bg-slate-800'">
                
                @if (added()) {
                  <span class="flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Añadido al Carrito!
                  </span>
                } @else {
                  Añadir al Carrito
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
    private readonly analytics = inject(AnalyticsService);
    private readonly route = inject(ActivatedRoute);

    readonly product = signal<Product | null>(null);
    readonly relatedProducts = signal<Product[]>([]);
    readonly qty = signal(1);
    readonly added = signal(false);
    readonly math = Math;

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
            this.product.set(data);
            if (data) {
                this.analytics.trackProductView(data.id);
                this.loadRelatedProducts(data);
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

    addToCart() {
        const p = this.product();
        if (p) {
            this.cartService.addToCart(p, this.qty());
            this.analytics.trackAddToCart(p.id, this.qty());

            // Show feedback
            this.added.set(true);
            setTimeout(() => this.added.set(false), 2000);
        }
    }
}
