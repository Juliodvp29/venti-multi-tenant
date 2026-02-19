import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    input,
    output,
    signal,
    ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Product, CreateProductDto, UpdateProductDto } from '@core/models/product';
import { Category } from '@core/models/category';
import { ProductsService } from '@core/services/products';
import { ToastService } from '@core/services/toast';
import { ProductStatus } from '@core/enums';
import { ProductImageUploader } from '../product-image-uploader/product-image-uploader';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ProductImageUploader],
    templateUrl: './product-form.html',
    styleUrl: './product-form.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm {
    @ViewChild(ProductImageUploader) imageUploader?: ProductImageUploader;

    private readonly fb = inject(FormBuilder);
    private readonly productsService = inject(ProductsService);
    private readonly toast = inject(ToastService);

    product = input<Product | null>(null);
    categories = input<Category[]>([]);

    saved = output<Product>();
    cancelled = output<void>();

    readonly isSaving = signal(false);
    readonly isEditMode = signal(false);
    readonly slugManuallyEdited = signal(false);
    readonly selectedCategoryIds = signal<Set<string>>(new Set());

    readonly statusOptions: { value: ProductStatus; label: string }[] = [
        { value: ProductStatus.Draft, label: 'Borrador' },
        { value: ProductStatus.Active, label: 'Activo' },
        { value: ProductStatus.Archived, label: 'Archivado' },
        { value: ProductStatus.OutOfStock, label: 'Sin Stock' },
    ];

    readonly form = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
        description: [''],
        sku: [''],
        price: [0, [Validators.required, Validators.min(0)]],
        compare_at_price: [null as number | null],
        cost_price: [null as number | null],
        status: [ProductStatus.Draft as ProductStatus, Validators.required],
        track_inventory: [false],
        stock_quantity: [0, [Validators.min(0)]],
        is_featured: [false],
    });

    constructor() {
        effect(() => {
            const p = this.product();
            if (p) {
                this.isEditMode.set(true);
                this.form.patchValue({
                    name: p.name,
                    slug: p.slug,
                    description: p.description ?? '',
                    sku: p.sku ?? '',
                    price: p.price,
                    compare_at_price: p.compare_at_price,
                    cost_price: p.cost_price,
                    status: p.status,
                    track_inventory: p.track_inventory,
                    stock_quantity: p.stock_quantity,
                    is_featured: p.is_featured,
                });
                // Populate selected categories from product relation
                const catIds = (p.categories ?? []).map((c: any) =>
                    c?.category?.id ?? c?.id ?? c
                ).filter(Boolean);
                this.selectedCategoryIds.set(new Set(catIds));
                this.form.markAsPristine();
            } else {
                this.isEditMode.set(false);
                this.form.reset({ status: ProductStatus.Draft, track_inventory: false, stock_quantity: 0, price: 0 });
                this.slugManuallyEdited.set(false);
                this.selectedCategoryIds.set(new Set());
            }
        });
    }

    toggleCategory(id: string) {
        this.selectedCategoryIds.update(set => {
            const next = new Set(set);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    onNameInput(event: Event) {
        if (this.slugManuallyEdited()) return;
        const name = (event.target as HTMLInputElement).value;
        this.form.patchValue({ slug: this.generateSlug(name) }, { emitEvent: false });
    }

    onSlugInput() {
        this.slugManuallyEdited.set(true);
    }

    autoGenerateSlug() {
        const name = this.form.getRawValue().name;
        this.form.patchValue({ slug: this.generateSlug(name) });
        this.slugManuallyEdited.set(false);
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    async submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.toast.error('Por favor, corrige los errores en el formulario.');
            return;
        }

        this.isSaving.set(true);

        try {
            const raw = this.form.getRawValue();
            const dto: CreateProductDto = {
                name: raw.name,
                slug: raw.slug,
                price: raw.price,
                status: raw.status,
                description: raw.description || undefined,
                sku: raw.sku || undefined,
                track_inventory: raw.track_inventory,
                stock_quantity: raw.stock_quantity,
            };

            let result: Product;
            if (this.isEditMode() && this.product()) {
                const updateDto: UpdateProductDto = {
                    ...dto,
                    compare_at_price: raw.compare_at_price ?? undefined,
                    cost_price: raw.cost_price ?? undefined,
                    is_featured: raw.is_featured,
                };
                result = await this.productsService.updateProduct(this.product()!.id, updateDto);
                this.toast.success(`Producto "${result.name}" actualizado correctamente.`);
            } else {
                result = await this.productsService.createProduct(dto);
                // Upload any pending images for the newly created product
                if (this.imageUploader) {
                    await this.imageUploader.uploadAllPending(result.id);
                }
                this.toast.success(`Producto "${result.name}" creado correctamente.`);
            }

            // Save category associations
            const catIds = [...this.selectedCategoryIds()];
            await this.productsService.setProductCategories(result.id, catIds);

            this.saved.emit(result);
            this.form.reset({ status: ProductStatus.Draft, track_inventory: false, stock_quantity: 0, price: 0 });
            this.slugManuallyEdited.set(false);
            this.selectedCategoryIds.set(new Set());
        } catch (error: any) {
            console.error('Error saving product:', error);
            this.toast.error(error?.message ?? 'Error al guardar el producto.');
        } finally {
            this.isSaving.set(false);
        }
    }

    cancel() {
        this.form.reset({ status: ProductStatus.Draft, track_inventory: false, stock_quantity: 0, price: 0 });
        this.slugManuallyEdited.set(false);
        this.cancelled.emit();
    }

    hasError(field: string): boolean {
        const control = this.form.get(field);
        return !!(control?.invalid && control?.touched);
    }
}
