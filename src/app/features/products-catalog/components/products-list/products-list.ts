import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Product } from '@core/models/product';
import { Category } from '@core/models/category';
import { ProductsService } from '@core/services/products';
import { CategoriesService } from '@core/services/categories';
import { TenantService } from '@core/services/tenant';
import { SubscriptionService } from '@core/services/subscription';
import { ToastService } from '@core/services/toast';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { DateRangePicker, DateRange } from '@shared/components/date-range-picker/date-range-picker';
import { Dropdown, DropdownOption } from '@shared/components/dropdown/dropdown';
import { ColumnDef, TableAction } from '@core/types/table';
import { ProductForm } from '../product-form/product-form';
import { ProductStatus } from '@core/enums';

const PAGE_SIZE = 20;

@Component({
    selector: 'app-products-list',
    imports: [CommonModule, DynamicTable, ProductForm, DateRangePicker, Dropdown],
    templateUrl: './products-list.html',
    styleUrl: './products-list.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [CurrencyPipe],
})
export class ProductsList implements OnInit {
    private readonly productsService = inject(ProductsService);
    private readonly categoriesService = inject(CategoriesService);
    private readonly tenantService = inject(TenantService);
    private readonly subscriptionService = inject(SubscriptionService);
    private readonly toast = inject(ToastService);
    private readonly currencyPipe = inject(CurrencyPipe);

    private initialized = false;

    constructor() {
        // Load data as soon as the tenant becomes available
        effect(() => {
            const tenantId = this.tenantService.tenantId();
            if (tenantId && !this.initialized) {
                this.initialized = true;
                this.loadProducts();
                this.loadCategories();
            }
        });
    }

    readonly isLoading = signal(false);
    readonly products = signal<Product[]>([]);
    readonly categories = signal<Category[]>([]);
    readonly showDrawer = signal(false);
    readonly editingProduct = signal<Product | null>(null);

    readonly categoryDropdownOptions = computed<DropdownOption[]>(() => {
        return [
            { label: 'All categories', value: '' },
            ...this.categories().map(cat => ({ label: cat.name, value: cat.id }))
        ];
    });

    readonly statusDropdownOptions: DropdownOption[] = [
        { label: 'All statuses', value: '' },
        { label: 'Active', value: ProductStatus.Active },
        { label: 'Draft', value: ProductStatus.Draft },
        { label: 'Out of Stock', value: ProductStatus.OutOfStock },
        { label: 'Archived', value: ProductStatus.Archived },
    ];
    readonly statusFilter = signal<string>('');
    readonly categoryFilter = signal<string>('');
    readonly dateRange = signal<DateRange>({ start: null, end: null });
    readonly searchQuery = signal('');

    readonly hasActiveFilters = computed(() => {
        return !!this.statusFilter() || !!this.categoryFilter();
    });

    // Server-side pagination
    readonly currentPage = signal(1);
    readonly totalCount = signal(0);
    readonly PAGE_SIZE = PAGE_SIZE;

    // Stats
    readonly totalProducts = computed(() => this.totalCount());
    readonly activeProducts = computed(() => this.products().filter(p => p.status === ProductStatus.Active).length);
    readonly draftProducts = computed(() => this.products().filter(p => p.status === ProductStatus.Draft).length);
    readonly lowStockProducts = computed(() =>
        this.products().filter(p => p.track_inventory && p.stock_quantity <= p.low_stock_threshold).length
    );

    // Filtered products for the table (status filter applied client-side on the current page)
    readonly filteredProducts = computed(() => {
        const filter = this.statusFilter();
        if (!filter) return this.products();
        if (filter === ProductStatus.OutOfStock) {
            // Match products explicitly marked out_of_stock OR
            // active products tracking inventory with 0 stock
            return this.products().filter(p =>
                p.status === ProductStatus.OutOfStock ||
                (p.track_inventory && p.stock_quantity === 0)
            );
        }
        return this.products().filter(p => p.status === filter);
    });

    readonly statusOptions = [
        { value: '', label: 'All statuses' },
        { value: ProductStatus.Active, label: 'Active' },
        { value: ProductStatus.Draft, label: 'Draft' },
        { value: ProductStatus.Archived, label: 'Archived' },
        { value: ProductStatus.OutOfStock, label: 'Out of Stock' },
    ];

    readonly columns: ColumnDef<Product>[] = [
        {
            key: 'primary_image_url',
            label: '',
            type: 'image',
            formatter: (val, item) => val || item.images?.[0]?.url || '',
        },
        {
            key: 'name',
            label: 'Product',
            sortable: true,
            type: 'text',
        },
        {
            key: 'sku',
            label: 'SKU',
            type: 'text',
            formatter: (val) => val ?? '—',
        },
        {
            key: 'price',
            label: 'Price',
            sortable: true,
            type: 'currency',
        },
        {
            key: 'stock_quantity',
            label: 'Stock',
            sortable: true,
            type: 'number',
            formatter: (val, item) => item['track_inventory'] ? String(val) : 'Unlimited',
        },
        {
            key: 'status',
            label: 'Status',
            type: 'status',
            formatter: (val) => {
                const map: Record<string, string> = {
                    [ProductStatus.Active]: 'active',
                    [ProductStatus.Draft]: 'inactive',
                    [ProductStatus.Archived]: 'inactive',
                    [ProductStatus.OutOfStock]: 'Out of Stock',
                };
                return map[val] ?? val;
            },
        },
    ];

    readonly actions: TableAction<Product>[] = [
        {
            id: 'edit',
            label: 'Edit',
            className: 'hover:text-indigo-600 dark:hover:text-indigo-400 font-medium',
            callback: (item) => this.openEdit(item),
        },
        {
            id: 'delete',
            label: 'Delete',
            className: 'hover:text-red-600 dark:hover:text-red-400 font-medium',
            callback: (item) => this.deleteProduct(item),
        },
    ];

    ngOnInit() {
        // Data loading is handled by the constructor effect once tenant is ready
    }

    async loadProducts(page: number = 1) {
        this.isLoading.set(true);
        try {
            const filters: Record<string, any> = {};
            if (this.searchQuery().trim()) filters['search'] = this.searchQuery().trim();
            if (this.statusFilter()) filters['status'] = this.statusFilter();
            if (this.categoryFilter()) filters['categoryId'] = this.categoryFilter();
            const { data, count } = await this.productsService.getProducts(page, PAGE_SIZE, filters);
            this.products.set(data);
            this.totalCount.set(count);
            this.currentPage.set(page);
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error loading products.');
        } finally {
            this.isLoading.set(false);
        }
    }

    clearFilters() {
        this.searchQuery.set('');
        this.statusFilter.set('');
        this.categoryFilter.set('');
        this.loadProducts(1);
    }

    async loadCategories() {
        try {
            const data = await this.categoriesService.getCategories(false);
            this.categories.set(data);
        } catch (err: any) {
            console.error('[ProductsList] Error loading categories:', err);
        }
    }

    async openCreate() {
        const canAdd = await this.subscriptionService.canAddResource('products');
        if (!canAdd) {
            this.toast.error("You've reached the products limit for your plan. Please upgrade to add more.");
            return;
        }
        this.editingProduct.set(null);
        this.showDrawer.set(true);
    }

    async openEdit(product: Product) {
        this.isLoading.set(true);
        try {
            const fullProduct = await this.productsService.getProduct(product.id);
            this.editingProduct.set(fullProduct);
            this.showDrawer.set(true);
        } catch (error: any) {
            this.toast.error('Could not load product details.');
        } finally {
            this.isLoading.set(false);
        }
    }

    closeDrawer() {
        this.showDrawer.set(false);
        this.editingProduct.set(null);
    }

    async deleteProduct(product: Product) {
        const confirmed = await this.toast.confirm(
            `Delete product "${product.name}"? This action cannot be undone.`,
            'Delete Product'
        );

        if (!confirmed) return;

        try {
            await this.productsService.deleteProduct(product.id);
            this.toast.success(`Product "${product.name}" deleted.`);

            // Reload table to avoid "Sin resultados" if deleted last item
            if (this.products().length <= 1 && this.currentPage() > 1) {
                this.loadProducts(this.currentPage() - 1);
            } else {
                this.loadProducts(this.currentPage());
            }
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error deleting product.');
        }
    }

    onProductSaved(product: Product) {
        const exists = this.products().some(p => p.id === product.id);
        if (exists) {
            this.products.update(ps => ps.map(p => p.id === product.id ? product : p));
        } else {
            this.loadProducts(1);
        }
        this.closeDrawer();
    }

    setStatusFilter(value: string) {
        this.statusFilter.set(value);
    }

    onStatusFilterChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.statusFilter.set(select.value);
        this.loadProducts(1);
    }

    onCategoryFilterChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.categoryFilter.set(select.value);
        this.loadProducts(1);
    }

    private searchTimer: any;
    onSearchChange(query: string) {
        this.searchQuery.set(query);
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.loadProducts(1), 400);
    }

    async onImportData(rows: Record<string, any>[]) {
        if (!rows.length) return;

        const BATCH_SIZE = 5;
        const total = rows.length;
        let created = 0;
        let failed = 0;
        const errors: string[] = [];

        const toSlug = (str: string) => str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Build a name→id map from loaded categories (case-insensitive)
        const categoryMap = new Map<string, string>();
        for (const cat of this.categories()) {
            categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
        }

        const resolveCategoryIds = (rawNames: string): string[] => {
            if (!rawNames.trim()) return [];
            return rawNames.split(',')
                .map(n => n.trim().toLowerCase())
                .map(n => categoryMap.get(n))
                .filter((id): id is string => !!id);
        };

        const batches: Record<string, any>[][] = [];
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            batches.push(rows.slice(i, i + BATCH_SIZE));
        }

        this.toast.info(`Importing ${total} product${total > 1 ? 's' : ''}...`);

        for (const batch of batches) {
            const results = await Promise.allSettled(
                batch.map(async (row) => {
                    const name = String(row['name'] ?? '').trim();
                    if (!name) throw new Error('Empty "name" field');

                    const price = Number(row['price'] ?? 0);

                    const slug = String(row['slug'] ?? '').trim()
                        ? toSlug(String(row['slug']))
                        : toSlug(name);

                    const product = await this.productsService.createProduct({
                        name,
                        slug,
                        price: isNaN(price) ? 0 : price,
                        sku: String(row['sku'] ?? '').trim() || undefined,
                        description: String(row['description'] ?? '').trim() || undefined,
                        status: (row['status'] as any) || ProductStatus.Draft,
                        track_inventory: String(row['track_inventory'] ?? 'false').toLowerCase() === 'true',
                        stock_quantity: row['stock_quantity'] ? Number(row['stock_quantity']) : 0,
                    });

                    // Assign categories if column present
                    const rawCats = String(row['category_name'] ?? '').trim();
                    if (rawCats) {
                        const catIds = resolveCategoryIds(rawCats);
                        if (catIds.length) {
                            await this.productsService.setProductCategories(product.id, catIds);
                        }
                    }

                    return product;
                })
            );

            for (const result of results) {
                if (result.status === 'fulfilled') {
                    created++;
                } else {
                    failed++;
                    errors.push((result.reason as Error)?.message ?? 'Error desconocido');
                }
            }

            await new Promise(r => setTimeout(r, 50));
        }

        if (created > 0 && failed === 0) {
            this.toast.success(`✅ ${created} product${created > 1 ? 's' : ''} imported successfully.`);
        } else if (created > 0 && failed > 0) {
            this.toast.warning(`⚠️ ${created} imported, ${failed} with error. Check console.`);
            console.warn('[Import Products] Errores:', errors);
        } else {
            this.toast.error(`❌ No products could be imported. Check the file.`);
            console.error('[Import Products] Errores:', errors);
        }

        // Reload to reflect newly imported products
        if (created > 0) {
            await this.loadProducts(1);
        }
    }

    onDateRangeChange(range: DateRange) {
        this.dateRange.set(range);
    }
}
