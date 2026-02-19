import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    input,
    OnInit,
    output,
    signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@core/models/category';
import { CategoriesService } from '@core/services/categories';
import { ToastService } from '@core/services/toast';

@Component({
    selector: 'app-category-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './category-form.html',
    styleUrl: './category-form.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly categoriesService = inject(CategoriesService);
    private readonly toast = inject(ToastService);

    /** Pass a category to enable edit mode */
    category = input<Category | null>(null);
    /** All categories for the parent selector (excluding the one being edited) */
    categories = input<Category[]>([]);

    saved = output<Category>();
    cancelled = output<void>();

    readonly isSaving = signal(false);
    readonly isEditMode = signal(false);
    readonly slugManuallyEdited = signal(false);

    readonly form = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
        description: [''],
        parent_id: [''],
        is_active: [true],
    });

    constructor() {
        effect(() => {
            const cat = this.category();
            if (cat) {
                this.isEditMode.set(true);
                this.form.patchValue({
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description ?? '',
                    parent_id: cat.parent_id ?? '',
                    is_active: cat.is_active,
                });
                this.form.markAsPristine();
            } else {
                this.isEditMode.set(false);
                this.form.reset({ is_active: true });
                this.slugManuallyEdited.set(false);
            }
        });
    }

    ngOnInit() { }

    get parentCategories(): Category[] {
        const editing = this.category();
        return this.categories().filter(c => c.id !== editing?.id && !c.parent_id);
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
            const dto: CreateCategoryDto = {
                name: raw.name,
                slug: raw.slug,
                description: raw.description || undefined,
                parent_id: raw.parent_id || undefined,
                is_active: raw.is_active,
            };

            let result: Category;
            if (this.isEditMode() && this.category()) {
                result = await this.categoriesService.updateCategory(this.category()!.id, dto as UpdateCategoryDto);
                this.toast.success(`Categoría "${result.name}" actualizada correctamente.`);
            } else {
                result = await this.categoriesService.createCategory(dto);
                this.toast.success(`Categoría "${result.name}" creada correctamente.`);
            }

            this.saved.emit(result);
            this.form.reset({ is_active: true });
            this.slugManuallyEdited.set(false);
        } catch (error: any) {
            console.error('Error saving category:', error);
            this.toast.error(error?.message ?? 'Error al guardar la categoría.');
        } finally {
            this.isSaving.set(false);
        }
    }

    cancel() {
        this.form.reset({ is_active: true });
        this.slugManuallyEdited.set(false);
        this.cancelled.emit();
    }

    hasError(field: string): boolean {
        const control = this.form.get(field);
        return !!(control?.invalid && control?.touched);
    }
}
