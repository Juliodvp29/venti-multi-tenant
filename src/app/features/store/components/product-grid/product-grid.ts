import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  effect,
  input,
  output,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  imports: [CommonModule, RouterModule, ProductCard],
  template: `
    <div class="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <!-- Catalog Page Configured Sections -->
      @if (!hideHeaderContent()) {
        @for (section of catalogSections(); track section.id) {
          @if (section.isActive && section.type === 'promo_banner') {
            <div
              class="rounded-2xl p-6 bg-gradient-to-r from-sky-600 to-purple-600 text-white text-center space-y-2 shadow-sm"
            >
              @if (asAny(section.content).badge) {
                <span
                  class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-white/20 rounded-full inline-block"
                  >{{ asAny(section.content).badge }}</span
                >
              }
              <h2 class="text-xl sm:text-2xl font-bold">{{ asAny(section.content).title }}</h2>
              <p class="text-xs text-white/80 max-w-lg mx-auto">
                {{ asAny(section.content).subtitle }}
              </p>
            </div>
          }
        }
      }

      <!-- Header Area -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        @if (!hideHeaderContent()) {
          <div>
            <h2
              class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1"
              [style.font-family]="'var(--store-font-heading)'"
            >
              Descubre lo Nuevo
            </h2>
            <p class="text-xs sm:text-sm text-slate-500">
              Explora nuestra selección de productos destacados para ti.
            </p>
          </div>
        }

        <div class="flex items-center gap-2.5 flex-wrap" [class.ml-auto]="hideHeaderContent()">
          <div class="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Buscar productos..."
              class="pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm w-full sm:w-56 focus:ring-2 focus:ring-sky-500 outline-none transition-all shadow-xs"
              (input)="onSearch($event)"
            />
            <svg
              class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div class="relative">
            <button
              class="pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all shadow-xs cursor-pointer flex items-center justify-between min-w-[150px] hover:border-slate-300"
              (click)="isSortMenuOpen.set(!isSortMenuOpen())"
            >
              <span class="font-medium text-slate-700 truncate">{{ sortLabel() }}</span>
              <svg
                class="w-3.5 h-3.5 absolute right-3 text-slate-400 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                [class.rotate-180]="isSortMenuOpen()"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            @if (isSortMenuOpen()) {
              <div
                class="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
              >
                @for (opt of sortOptions; track opt.value) {
                  <button
                    class="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
                    [class.text-sky-600]="sortBy() === opt.value"
                    [class.font-bold]="sortBy() === opt.value"
                    [class.bg-sky-50]="sortBy() === opt.value"
                    (click)="changeSort(opt.value)"
                  >
                    <span>{{ opt.label }}</span>
                    @if (sortBy() === opt.value) {
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
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
        <div class="flex flex-wrap gap-2 px-1 pb-4 border-b border-slate-100 dark:border-gray-800">
          <a
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            [class.bg-slate-900]="!selectedCategory()"
            [class.text-white]="!selectedCategory()"
            [class.bg-white]="selectedCategory()"
            [class.text-slate-600]="selectedCategory()"
            [class.border]="selectedCategory()"
            [class.border-slate-200]="selectedCategory()"
            [routerLink]="categoryLink(null)"
            queryParamsHandling="preserve"
            (click)="onCategoryClick($event, null)"
          >
            Todo
          </a>

          @for (cat of categories(); track cat.id) {
            <a
              class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
              [class.bg-slate-900]="isCategoryActive(cat)"
              [class.text-white]="isCategoryActive(cat)"
              [class.bg-white]="!isCategoryActive(cat)"
              [class.text-slate-600]="!isCategoryActive(cat)"
              [class.border]="!isCategoryActive(cat)"
              [class.border-slate-200]="!isCategoryActive(cat)"
              [routerLink]="categoryLink(cat)"
              queryParamsHandling="preserve"
              (click)="onCategoryClick($event, cat)"
            >
              {{ cat.name }}
            </a>
          }
        </div>

        <!-- Subcategories Navigation -->
        @if (
          selectedCategory() &&
          selectedCategory()!.children &&
          selectedCategory()!.children!.length > 0
        ) {
          <div
            class="flex flex-wrap gap-1.5 px-4 py-3 bg-slate-50/70 dark:bg-gray-800/40 rounded-2xl border border-slate-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-500"
          >
            @for (sub of selectedCategory()!.children; track sub.id) {
              <a
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:text-sky-600 cursor-pointer"
                [class.bg-white]="selectedCategoryId() === sub.id"
                [class.text-sky-600]="selectedCategoryId() === sub.id"
                [class.font-bold]="selectedCategoryId() === sub.id"
                [class.shadow-xs]="selectedCategoryId() === sub.id"
                [class.text-slate-600]="selectedCategoryId() !== sub.id"
                [routerLink]="categoryLink(sub)"
                queryParamsHandling="preserve"
                (click)="onCategoryClick($event, sub)"
              >
                {{ sub.name }}
              </a>
            }
          </div>
        }
      }

      <!-- Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        @for (product of products(); track product.id) {
          <app-product-card [product]="product" />
        }
      </div>

      @if (isLoading()) {
        <div
          class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-1"
        >
          @for (i of [1, 2, 3, 4]; track i) {
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
          <div
            class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
          >
            📦
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-1">No se encontraron productos</h3>
          <p class="text-slate-500">Estamos preparando nuevas sorpresas para ti. Vuelve pronto.</p>
        </div>
      }
    </div>
  `,
})
export class ProductGrid implements OnInit {
  asAny(val: any): any {
    return val;
  }
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly seo = inject(SeoService);
  private readonly tenantService = inject(TenantService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly catalogConfig = computed(() => this.tenantService.getPageLayout('catalog'));
  readonly catalogSections = computed(() => this.catalogConfig()?.sections || []);

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
  /** Slug de categoría pendiente de resolver (llega por ruta antes de cargar categorías) */
  readonly pendingSlug = signal<string | null>(null);
  /** El grid está embebido (home) cuando recibe limit > 0: sin sincronización de URL */
  readonly isEmbedded = computed(() => this.limit() > 0);

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
    return this.sortOptions.find((o) => o.value === this.sortBy())?.label || 'Ordenar';
  });

  constructor() {
    // Load categories once on initialization
    effect(() => {
      const tenantId = this.tenantService.tenantId();
      const initialized = this.tenantService.initialized();
      if (initialized && tenantId) {
        this.loadCategories();
      }
    });

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
        const descendantIds = this.categoriesService.getAllDescendantIds(
          categoryId,
          this.allCategories(),
        );
        if (descendantIds.length > 0) {
          categoryFilter = [categoryId, ...descendantIds];
        }
      }

      const { data } = await this.productsService.getProducts(1, limit > 0 ? limit : 40, {
        sortBy: this.sortBy(),
        search: this.search(),
        categoryId: categoryFilter,
      });
      if (this.destroyRef.destroyed) return;
      this.products.set(data);
      this.hasProducts.emit(data.length > 0);
      this.updateSeo();
    } catch (error) {
      console.error('Error loading products:', error);
      if (this.destroyRef.destroyed) return;
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

      // Resolver slug de ruta que llegó antes de tener categorías (ej. entrada directa)
      this.resolvePendingSlug();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  ngOnInit() {
    // URL canónica por slug: /store/categoria/:slug (igual que productos por slug)
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        this.pendingSlug.set(null);
        if (!this.isEmbedded()) {
          this.selectedCategoryId.set(null);
        }
        return;
      }
      this.pendingSlug.set(slug);
      this.resolvePendingSlug();
    });
  }

  private resolvePendingSlug(): void {
    const slug = this.pendingSlug();
    if (!slug || this.allCategories().length === 0) return;

    const flat = this.allCategories();
    const found = flat.find((c) => c.slug === slug) ?? flat.find((c) => c.id === slug);
    if (!found) {
      this.pendingSlug.set(null);
      if (!this.isEmbedded()) {
        this.selectedCategoryId.set(null);
      }
      return;
    }

    this.pendingSlug.set(null);
    this.selectedCategoryId.set(found.id);

    // Si llegó por id, redirigir a la URL canónica por slug
    if (found.slug && found.slug !== slug && !this.isEmbedded()) {
      this.router.navigate(['/store/categoria', found.slug], {
        replaceUrl: true,
        queryParamsHandling: 'preserve',
      });
    }
  }

  selectCategory(category: Category | null) {
    // Embebido (home): filtrado local sin tocar la URL
    if (this.isEmbedded()) {
      this.selectedCategoryId.set(category?.id || null);
      return;
    }
    if (!category) {
      this.router.navigate(['/store/productos'], { queryParamsHandling: 'preserve' });
      return;
    }
    this.router.navigate(['/store/categoria', category.slug || category.id], {
      queryParamsHandling: 'preserve',
    });
  }

  /**
   * Link rastreable para crawlers. En modo embebido (home) devuelve null
   * y el filtrado es local vía onCategoryClick.
   */
  categoryLink(category: Category | null): string[] | null {
    if (this.isEmbedded()) return null;
    if (!category) return ['/store/productos'];
    return ['/store/categoria', category.slug || category.id];
  }

  onCategoryClick(event: Event, category: Category | null): void {
    if (this.isEmbedded()) {
      event.preventDefault();
      this.selectCategory(category);
    }
    // En modo ruteado navega el routerLink y el paramMap sincroniza el estado
  }

  private storeUrl(path: string): string {
    const shop = this.route.snapshot.queryParamMap.get('s');
    const suffix = shop ? `?s=${encodeURIComponent(shop)}` : '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}${suffix}`;
    }
    return `${path}${suffix}`;
  }

  isCategoryActive(cat: Category): boolean {
    const selectedId = this.selectedCategoryId();
    if (!selectedId) return false;
    if (selectedId === cat.id) return true;

    // If subcategory is selected, parent should be active
    return !!cat.children?.some((child) => child.id === selectedId);
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
    const category = this.selectedCategory();
    this.seo.updateTags({
      title: category ? `${category.name} | ${businessName}` : 'Productos',
      description:
        category?.meta_description ||
        category?.description ||
        `Explora nuestra colección de productos en ${businessName}. Envío rápido y la mejor calidad.`,
      type: 'website',
      siteName: businessName,
    });

    // Limpiar schemas de la página anterior (ej. Product al volver al catálogo)
    this.seo.clearSchemas();

    // Breadcrumb: Inicio > Productos (> Categoría)
    const crumbs = [
      { name: 'Inicio', url: this.storeUrl('/store') },
      { name: 'Productos', url: this.storeUrl('/store/productos') },
    ];
    if (category) {
      crumbs.push({
        name: category.name,
        url: this.storeUrl(`/store/categoria/${category.slug || category.id}`),
      });
    }
    this.seo.setBreadcrumbSchema(crumbs);

    // Set Organization schema on main grid
    this.seo.setOrganizationSchema({
      name: businessName,
      logo: this.tenantService.branding()?.logo_url || undefined,
    });
  }
}
