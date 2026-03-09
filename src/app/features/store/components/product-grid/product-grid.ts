import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsService } from '@core/services/products';
import { Product } from '@core/models/product';
import { ProductCard } from '../product-card/product-card';
import { SeoService } from '@core/services/seo';
import { TenantService } from '@core/services/tenant';
import { CategoriesService } from '@core/services/categories';
import { Category } from '@core/models/category';

@Component({
    selector: 'app-product-grid',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ProductCard],
    template: `
    <div class="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        @if (!hideHeaderContent()) {
        <div>
            <h2 class="text-4xl font-black text-slate-900 tracking-tight mb-2">Descubre lo Nuevo</h2>
            <p class="text-slate-500 font-medium">Explora nuestra selección de productos destacados para ti.</p>
        </div>
        }
        
        <div class="flex items-center gap-3" [class.ml-auto]="hideHeaderContent()">
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

      <!-- Categories Navigation -->
      @if (categories().length > 0) {
      <div class="flex flex-wrap gap-2 px-2 pb-6 border-b border-slate-100">
        <button 
            (click)="selectCategory(null)"
            [class.bg-slate-900]="!selectedCategory()"
            [class.text-white]="!selectedCategory()"
            [class.bg-white]="selectedCategory()"
            [class.text-slate-600]="selectedCategory()"
            class="px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95">
            Todo
        </button>
        
        @for (cat of categories(); track cat.id) {
            <button 
                (click)="selectCategory(cat)"
                [class.bg-slate-900]="isCategoryActive(cat)"
                [class.text-white]="isCategoryActive(cat)"
                [class.bg-white]="!isCategoryActive(cat)"
                [class.text-slate-600]="!isCategoryActive(cat)"
                class="px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95">
                {{ cat.name }}
            </button>
        }
      </div>
      
      <!-- Subcategories Navigation -->
      @if (selectedCategory() && selectedCategory()!.children && selectedCategory()!.children!.length > 0) {
      <div class="flex flex-wrap gap-2 px-6 py-4 bg-slate-50/50 rounded-3xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-500">
        @for (sub of selectedCategory()!.children; track sub.id) {
             <button 
                (click)="selectCategory(sub)"
                [class.bg-white]="selectedCategoryId() === sub.id"
                [class.text-indigo-600]="selectedCategoryId() === sub.id"
                [class.font-black]="selectedCategoryId() === sub.id"
                [class.text-slate-500]="selectedCategoryId() !== sub.id"
                class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:text-indigo-600">
                {{ sub.name }}
            </button>
        }
      </div>
      }
      }

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
              <h3 class="text-xl font-bold text-slate-900 mb-1">No se encontraron productos</h3>
              <p class="text-slate-500">Estamos preparando nuevas sorpresas para ti. Vuelve pronto.</p>
          </div>
      }
    </div>
  `,
})
export class ProductGrid {
    private readonly productsService = inject(ProductsService);
    private readonly categoriesService = inject(CategoriesService);
    private readonly seo = inject(SeoService);
    private readonly tenantService = inject(TenantService);

    readonly products = signal<Product[]>([]);
    readonly allCategories = signal<Category[]>([]);
    readonly categories = signal<Category[]>([]); // Tree-ready or flat for nav
    readonly isLoading = signal(true);
    readonly sortBy = signal('popular');
    readonly search = signal('');
    readonly selectedCategoryId = signal<string | null>(null);
    readonly limit = input<number>(0);
    readonly hideHeaderContent = input(false);
    readonly isSortMenuOpen = signal(false);
    readonly hasProducts = output<boolean>();

    readonly selectedCategory = computed(() => {
        const id = this.selectedCategoryId();
        if (!id) return null;
        return this.findCategoryInTree(id, this.categories());
    });

    readonly sortOptions = [
        { label: 'Más Populares', value: 'popular' },
        { label: 'Más recientes', value: 'newest' },
        { label: 'Más vendidos', value: 'best_sellers' },
        { label: 'Precio: Menor a Mayor', value: 'price_asc' },
        { label: 'Precio: Mayor a Menor', value: 'price_desc' },
    ];

    readonly sortLabel = computed(() => {
        return this.sortOptions.find(o => o.value === this.sortBy())?.label || 'Ordenar';
    });

    constructor() {
        // Load categories once on initialization
        effect(() => {
            const tenantId = this.tenantService.tenantId();
            const initialized = this.tenantService.initialized();
            if (initialized && tenantId) {
                this.loadCategories();
            }
        }, { allowSignalWrites: true });

        // Re-load products whenever any dependency changes
        effect(() => {
            const tenantId = this.tenantService.tenantId();
            const initialized = this.tenantService.initialized();
            const sort = this.sortBy();
            const search = this.search();
            const categoryId = this.selectedCategoryId();

            if (initialized && tenantId) {
                this.loadProducts();
            } else if (initialized && !tenantId) {
                this.isLoading.set(false);
                this.products.set([]);
            }
        });
    }

    async loadProducts() {
        try {
            this.isLoading.set(true);
            const limit = this.limit();
            const categoryId = this.selectedCategoryId();

            let categoryFilter: string | string[] | undefined = categoryId || undefined;

            // If category is selected, also include all its subcategories
            if (categoryId) {
                const descendantIds = this.categoriesService.getAllDescendantIds(categoryId, this.allCategories());
                if (descendantIds.length > 0) {
                    categoryFilter = [categoryId, ...descendantIds];
                }
            }

            const { data } = await this.productsService.getProducts(1, limit > 0 ? limit : 40, {
                sortBy: this.sortBy(),
                search: this.search(),
                categoryId: categoryFilter
            });
            this.products.set(data);
            this.hasProducts.emit(data.length > 0);
            this.updateSeo();
        } catch (error) {
            console.error('Error loading products:', error);
            this.products.set([]);
            this.hasProducts.emit(false);
        } finally {
            this.isLoading.set(false);
        }
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.search.set(input.value);
        // loadProducts is now called automatically by the effect
    }

    changeSort(value: string) {
        this.sortBy.set(value);
        this.isSortMenuOpen.set(false);
        // loadProducts is now called automatically by the effect
    }

    async loadCategories() {
        try {
            const flatCategories = await this.categoriesService.getCategories(false);
            this.allCategories.set(flatCategories);

            // Build tree for navigation (only roots)
            const tree = await this.categoriesService.getCategories(true);
            this.categories.set(tree);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    selectCategory(category: Category | null) {
        this.selectedCategoryId.set(category?.id || null);
    }

    isCategoryActive(cat: Category): boolean {
        const selectedId = this.selectedCategoryId();
        if (!selectedId) return false;
        if (selectedId === cat.id) return true;

        // If subcategory is selected, parent should be active
        return !!cat.children?.some(child => child.id === selectedId);
    }

    private findCategoryInTree(id: string, tree: Category[]): Category | null {
        for (const cat of tree) {
            if (cat.id === id) return cat;
            if (cat.children && cat.children.length > 0) {
                const found = this.findCategoryInTree(id, cat.children);
                if (found) return found;
            }
        }
        return null;
    }

    private updateSeo() {
        const businessName = this.tenantService.branding()?.business_name || 'Venti Store';
        this.seo.updateTags({
            title: 'Productos',
            description: `Explora nuestra colección de productos en ${businessName}. Envío rápido y la mejor calidad.`,
            type: 'website',
            siteName: businessName
        });

        // Set Organization schema on main grid
        this.seo.setOrganizationSchema({
            name: businessName,
            logo: this.tenantService.branding()?.logo_url || undefined
        });
    }
}
