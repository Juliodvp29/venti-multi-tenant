import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsService } from '@core/services/products';
import { Product } from '@core/models/product';
import { ProductCard } from '../product-card/product-card';

@Component({
    selector: 'app-product-grid',
     changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ProductCard],
    template: `
    <div class="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
            <h2 class="text-4xl font-black text-slate-900 tracking-tight mb-2">Descubre lo Nuevo</h2>
            <p class="text-slate-500 font-medium">Explora nuestra selección de productos destacados para ti.</p>
        </div>
        
        <div class="flex items-center gap-3">
             <div class="relative">
                <input 
                    type="text" 
                    placeholder="Buscar productos..." 
                    (input)="onSearch($event)"
                    class="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm">
                <svg class="w-4 h-4 absolute left-4 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
             
             <div class="relative">
                <button 
                    (click)="isSortMenuOpen.set(!isSortMenuOpen())"
                    class="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm cursor-pointer flex items-center justify-between min-w-[180px] hover:border-slate-300">
                    <span class="font-medium text-slate-700">{{ sortLabel() }}</span>
                    <svg class="w-4 h-4 absolute right-4 text-slate-400 transition-transform duration-300" [class.rotate-180]="isSortMenuOpen()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                @if (isSortMenuOpen()) {
                    <div class="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        @for (opt of sortOptions; track opt.value) {
                            <button 
                                (click)="changeSort(opt.value)"
                                class="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
                                [class.text-indigo-600]="sortBy() === opt.value"
                                [class.font-bold]="sortBy() === opt.value"
                                [class.bg-indigo-50]="sortBy() === opt.value">
                                <span>{{ opt.label }}</span>
                                @if (sortBy() === opt.value) {
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                }
                            </button>
                        }
                    </div>
                    <!-- Click outside backdrop -->
                    <div class="fixed inset-0 z-40" (click)="isSortMenuOpen.set(false)"></div>
                }
             </div>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
        @for (product of products(); track product.id) {
            <app-product-card [product]="product"></app-product-card>
        }
      </div>

      @if (isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
            @for (i of [1,2,3,4]; track i) {
                <div class="animate-pulse space-y-4">
                    <div class="aspect-[4/5] bg-slate-200 rounded-3xl"></div>
                    <div class="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div class="h-4 bg-slate-200 rounded w-1/4"></div>
                </div>
            }
        </div>
      }

      @if (!isLoading() && products().length === 0) {
          <div class="py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📦</div>
              <h3 class="text-xl font-bold text-slate-900 mb-1">No hay productos</h3>
              <p class="text-slate-500">Estamos preparando nuevas sorpresas para ti. Vuelve pronto.</p>
          </div>
      }
    </div>
  `,
})
export class ProductGrid {
    private readonly productsService = inject(ProductsService);

    readonly products = signal<Product[]>([]);
    readonly isLoading = signal(true);
    readonly sortBy = signal('popular');
    readonly search = signal('');
    readonly isSortMenuOpen = signal(false);

    readonly sortOptions = [
        { label: 'Más Populares', value: 'popular' },
        { label: 'Lo más Nuevo', value: 'newest' },
        { label: 'Más Vendidos', value: 'best_sellers' },
        { label: 'Precio: Menor a Mayor', value: 'price_asc' },
        { label: 'Precio: Mayor a Menor', value: 'price_desc' },
    ];

    readonly sortLabel = computed(() => {
        return this.sortOptions.find(o => o.value === this.sortBy())?.label || 'Ordenar';
    });

    constructor() {
        this.loadProducts();
    }

    async loadProducts() {
        try {
            this.isLoading.set(true);
            const { data } = await this.productsService.getProducts(1, 40, {
                sortBy: this.sortBy(),
                search: this.search()
            });
            this.products.set(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.search.set(input.value);
        this.loadProducts();
    }

    changeSort(value: string) {
        this.sortBy.set(value);
        this.isSortMenuOpen.set(false);
        this.loadProducts();
    }
}
