import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Product } from '@core/models/product';
import { Category } from '@core/models/category';
import { ProductsService } from '@core/services/products';
import { CategoriesService } from '@core/services/categories';
import { ToastService } from '@core/services/toast';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { ColumnDef, TableAction } from '@core/types/table';
import { ProductForm } from '../product-form/product-form';
import { ProductStatus } from '@core/enums';

@Component({
    selector: 'app-products-list',
    standalone: true,
    imports: [CommonModule, DynamicTable, ProductForm],
    templateUrl: './products-list.html',
    styleUrl: './products-list.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [CurrencyPipe],
})
export class ProductsList implements OnInit {
    private readonly productsService = inject(ProductsService);
    private readonly categoriesService = inject(CategoriesService);
    private readonly toast = inject(ToastService);
    private readonly currencyPipe = inject(CurrencyPipe);

    readonly isLoading = signal(false);
    readonly products = signal<Product[]>([]);
    readonly categories = signal<Category[]>([]);
    readonly showDrawer = signal(false);
    readonly editingProduct = signal<Product | null>(null);
    readonly statusFilter = signal<string>('');

    // Stats
    readonly totalProducts = computed(() => this.products().length);
    readonly activeProducts = computed(() => this.products().filter(p => p.status === ProductStatus.Active).length);
    readonly draftProducts = computed(() => this.products().filter(p => p.status === ProductStatus.Draft).length);
    readonly lowStockProducts = computed(() =>
        this.products().filter(p => p.track_inventory && p.stock_quantity <= p.low_stock_threshold).length
    );

    // Filtered products for the table
    readonly filteredProducts = computed(() => {
        const filter = this.statusFilter();
        if (!filter) return this.products();
        return this.products().filter(p => p.status === filter);
    });

    readonly statusOptions = [
        { value: '', label: 'Todos los estados' },
        { value: ProductStatus.Active, label: 'Activo' },
        { value: ProductStatus.Draft, label: 'Borrador' },
        { value: ProductStatus.Archived, label: 'Archivado' },
        { value: ProductStatus.OutOfStock, label: 'Sin Stock' },
    ];

    readonly columns: ColumnDef<Product>[] = [
        {
            key: 'primary_image_url',
            label: '',
            type: 'image',
        },
        {
            key: 'name',
            label: 'Producto',
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
            label: 'Precio',
            sortable: true,
            type: 'currency',
        },
        {
            key: 'stock_quantity',
            label: 'Stock',
            sortable: true,
            type: 'number',
            formatter: (val, item) => item['track_inventory'] ? String(val) : '∞',
        },
        {
            key: 'status',
            label: 'Estado',
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
            label: 'Editar',
            className: 'hover:text-indigo-600 dark:hover:text-indigo-400 font-medium',
            callback: (item) => this.openEdit(item),
        },
        {
            id: 'delete',
            label: 'Eliminar',
            className: 'hover:text-red-600 dark:hover:text-red-400 font-medium',
            callback: (item) => this.deleteProduct(item),
        },
    ];

    async ngOnInit() {
        await Promise.all([this.loadProducts(), this.loadCategories()]);
    }

    async loadProducts() {
        this.isLoading.set(true);
        try {
            const { data } = await this.productsService.getProducts(1, 100);
            this.products.set(data);
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error al cargar los productos.');
        } finally {
            this.isLoading.set(false);
        }
    }

    async loadCategories() {
        try {
            const data = await this.categoriesService.getCategories(false);
            this.categories.set(data);
        } catch (err) {
            console.error('[ProductsList] Error loading categories:', err);
        }
    }

    openCreate() {
        this.editingProduct.set(null);
        this.showDrawer.set(true);
    }

    openEdit(product: Product) {
        this.editingProduct.set(product);
        this.showDrawer.set(true);
    }

    closeDrawer() {
        this.showDrawer.set(false);
        this.editingProduct.set(null);
    }

    async deleteProduct(product: Product) {
        const confirmed = await this.toast.confirm(
            `¿Eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`,
            'Eliminar Producto'
        );

        if (!confirmed) return;

        try {
            await this.productsService.deleteProduct(product.id);
            this.products.update(ps => ps.filter(p => p.id !== product.id));
            this.toast.success(`Producto "${product.name}" eliminado.`);
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error al eliminar el producto.');
        }
    }

    onProductSaved(product: Product) {
        const exists = this.products().some(p => p.id === product.id);
        if (exists) {
            this.products.update(ps => ps.map(p => p.id === product.id ? product : p));
        } else {
            this.products.update(ps => [product, ...ps]);
        }
        this.closeDrawer();
    }

    setStatusFilter(value: string) {
        this.statusFilter.set(value);
    }

    onStatusFilterChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.statusFilter.set(select.value);
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

        this.toast.info(`Importando ${total} producto${total > 1 ? 's' : ''}...`);

        for (const batch of batches) {
            const results = await Promise.allSettled(
                batch.map(async (row) => {
                    const name = String(row['name'] ?? '').trim();
                    if (!name) throw new Error('Campo "name" vacío');

                    const price = Number(row['price']);
                    if (isNaN(price)) throw new Error(`"${name}": precio inválido ("${row['price']}")`);

                    const slug = String(row['slug'] ?? '').trim()
                        ? toSlug(String(row['slug']))
                        : toSlug(name);

                    const product = await this.productsService.createProduct({
                        name,
                        slug,
                        price,
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
                    this.products.update(ps => [result.value, ...ps]);
                    created++;
                } else {
                    failed++;
                    errors.push((result.reason as Error)?.message ?? 'Error desconocido');
                }
            }

            await new Promise(r => setTimeout(r, 50));
        }

        if (created > 0 && failed === 0) {
            this.toast.success(`✅ ${created} producto${created > 1 ? 's' : ''} importado${created > 1 ? 's' : ''} correctamente.`);
        } else if (created > 0 && failed > 0) {
            this.toast.warning(`⚠️ ${created} importados, ${failed} con error. Revisa la consola.`);
            console.warn('[Import Products] Errores:', errors);
        } else {
            this.toast.error(`❌ Ningún producto pudo importarse. Verifica el archivo.`);
            console.error('[Import Products] Errores:', errors);
        }
    }
}
