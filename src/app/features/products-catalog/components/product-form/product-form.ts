import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    input,
    OnDestroy,
    OnInit,
    output,
    signal,
    ViewChild,
} from '@angular/core';
import { Product, CreateProductDto, UpdateProductDto, ProductVariant, ProductOption } from '@core/models/product';
import { Category } from '@core/models/category';
import { ProductsService } from '@core/services/products';
import { ToastService } from '@core/services/toast';
import { AiAssistantService } from '@core/services/ai-assistant';
import { ProductStatus } from '@core/enums';
import { ProductImageUploader } from '../product-image-uploader/product-image-uploader';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Dropdown } from '@shared/components/dropdown/dropdown';

@Component({
    selector: 'app-product-form',
    imports: [CommonModule, ReactiveFormsModule, ProductImageUploader, Dropdown],
    templateUrl: './product-form.html',
    styleUrl: './product-form.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm implements OnInit, OnDestroy {
    @ViewChild(ProductImageUploader) imageUploader?: ProductImageUploader;

    private readonly fb = inject(FormBuilder);
    private readonly productsService = inject(ProductsService);
    private readonly toast = inject(ToastService);
    private readonly aiService = inject(AiAssistantService);

    product = input<Product | null>(null);
    categories = input<Category[]>([]);

    saved = output<Product>();
    cancelled = output<void>();

    readonly isSaving = signal(false);
    readonly isEditMode = signal(false);
    readonly slugManuallyEdited = signal(false);
    readonly selectedCategoryIds = signal<Set<string>>(new Set());

    // Variants & Options State
    readonly hasVariants = signal(false);
    toggleVariants() {
        const newState = !this.hasVariants();
        this.hasVariants.set(newState);
        if (newState) {
            this.form.patchValue({ track_inventory: true });
        }
    }
    readonly optionDefinitions = signal<ProductOption[]>([]); // UI state for the generator

    readonly statusOptions: { value: ProductStatus; label: string }[] = [
        { value: ProductStatus.Draft, label: 'Draft' },
        { value: ProductStatus.Active, label: 'Active' },
        { value: ProductStatus.Archived, label: 'Archived' },
        { value: ProductStatus.OutOfStock, label: 'Out of Stock' },
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
        variants: this.fb.array([]), // FormArray for variants
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

                // Load Variants if they exist
                if (p.variants && p.variants.length > 0) {
                    this.hasVariants.set(true);
                    this.setVariants(p.variants);
                    this.inferOptionsFromVariants(p.variants);
                } else {
                    this.hasVariants.set(false);
                    this.variants.clear();
                    this.optionDefinitions.set([]);
                }

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

    ngOnInit() {
        this.aiService.hide();
    }

    ngOnDestroy() {
        this.aiService.show();
    }

    get variants() {
        return this.form.get('variants') as FormArray;
    }

    private setVariants(variants: ProductVariant[]) {
        this.variants.clear();
        variants.forEach(v => {
            this.variants.push(this.fb.group({
                id: [v.id],
                name: [v.name, Validators.required],
                sku: [v.sku],
                price: [v.price, [Validators.min(0)]],
                compare_at_price: [v.compare_at_price],
                cost_price: [v.cost_price],
                stock_quantity: [v.stock_quantity, [Validators.min(0)]],
                options: [v.options], // Immutable metadata
                is_active: [v.is_active]
            }));
        });
    }

    private inferOptionsFromVariants(variants: ProductVariant[]) {
        const optionsMap: Record<string, Set<string>> = {};
        variants.forEach(v => {
            Object.entries(v.options || {}).forEach(([key, val]) => {
                if (!optionsMap[key]) optionsMap[key] = new Set();
                optionsMap[key].add(val);
            });
        });

        const defs = Object.entries(optionsMap).map(([name, values]) => ({
            name,
            values: Array.from(values)
        }));
        this.optionDefinitions.set(defs);
    }

    addOption() {
        this.optionDefinitions.update(prev => [...prev, { name: '', values: [] }]);
    }

    removeOption(index: number) {
        this.optionDefinitions.update(prev => prev.filter((_, i) => i !== index));
        this.generateVariantsFromOptions();
    }

    updateOptionName(index: number, name: string) {
        this.optionDefinitions.update(prev => {
            const next = [...prev];
            next[index] = { ...next[index], name };
            return next;
        });
        this.generateVariantsFromOptions();
    }

    updateOptionValues(index: number, valuesStr: string) {
        const values = valuesStr.split(',').map(v => v.trim()).filter(Boolean);
        this.optionDefinitions.update(prev => {
            const next = [...prev];
            next[index] = { ...next[index], values };
            return next;
        });
        this.generateVariantsFromOptions();
    }

    generateVariantsFromOptions() {
        const defs = this.optionDefinitions().filter(d => d.name && d.values.length > 0);
        if (defs.length === 0) {
            this.variants.clear();
            return;
        }

        // Cartesian product
        const generateLevel = (level: number, currentOptions: Record<string, string>, currentNames: string[]): any[] => {
            if (level === defs.length) {
                return [{
                    name: currentNames.join(' / '),
                    options: { ...currentOptions },
                    sku: null,
                    price: this.form.getRawValue().price,
                    stock_quantity: this.form.getRawValue().stock_quantity || 99,
                    is_active: true
                }];
            }

            const def = defs[level];
            let results: any[] = [];
            def.values.forEach(val => {
                results = results.concat(generateLevel(
                    level + 1,
                    { ...currentOptions, [def.name]: val },
                    [...currentNames, val]
                ));
            });
            return results;
        };

        const newVariants = generateLevel(0, {}, []);

        // Sync with FormArray, preserving data for existing matches
        const currentVariants = this.variants.getRawValue();
        this.variants.clear();

        newVariants.forEach(nv => {
            // Try to find existing variant with same options to preserve data
            const existing = currentVariants.find(cv =>
                JSON.stringify(cv.options) === JSON.stringify(nv.options)
            );

            this.variants.push(this.fb.group({
                id: [existing?.id || null],
                name: [nv.name, Validators.required],
                sku: [existing?.sku ?? null],
                price: [existing?.price || nv.price, [Validators.min(0)]],
                compare_at_price: [existing?.compare_at_price || null],
                cost_price: [existing?.cost_price || null],
                stock_quantity: [existing?.stock_quantity ?? nv.stock_quantity, [Validators.min(0)]],
                options: [nv.options],
                is_active: [existing?.is_active ?? true]
            }));
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
            this.toast.error('Please correct the errors in the form.');
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
                track_inventory: this.hasVariants() ? true : raw.track_inventory,
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
                this.toast.success(`Product "${result.name}" updated successfully.`);
            } else {
                result = await this.productsService.createProduct(dto);
                // Upload any pending images for the newly created product
                if (this.imageUploader) {
                    await this.imageUploader.uploadAllPending(result.id);
                }
                this.toast.success(`Product "${result.name}" created successfully.`);
            }

            // Save category associations
            const catIds = [...this.selectedCategoryIds()];
            await this.productsService.setProductCategories(result.id, catIds);

            // Sync variants if enabled
            if (this.hasVariants()) {
                const variantsData = this.variants.getRawValue();
                await this.productsService.syncProductVariants(result.id, variantsData);
            } else {
                // If variants were disabled, we should probably delete them
                await this.productsService.syncProductVariants(result.id, []);
            }

            this.saved.emit(result);
            this.form.reset({ status: ProductStatus.Draft, track_inventory: false, stock_quantity: 0, price: 0 });
            this.slugManuallyEdited.set(false);
            this.selectedCategoryIds.set(new Set());
        } catch (error: any) {
            console.error('Error saving product:', error);
            this.toast.error(error?.message ?? 'Error saving product.');
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
