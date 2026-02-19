import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '@core/models/category';
import { CategoriesService } from '@core/services/categories';
import { ToastService } from '@core/services/toast';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { ColumnDef, TableAction } from '@core/types/table';
import { CategoryForm } from '../category-form/category-form';

@Component({
    selector: 'app-categories-list',
    standalone: true,
    imports: [CommonModule, DynamicTable, CategoryForm],
    templateUrl: './categories-list.html',
    styleUrl: './categories-list.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesList implements OnInit {
    private readonly categoriesService = inject(CategoriesService);
    private readonly toast = inject(ToastService);

    readonly isLoading = signal(false);
    readonly categories = signal<Category[]>([]);
    readonly showDrawer = signal(false);
    readonly editingCategory = signal<Category | null>(null);
    readonly deletingId = signal<string | null>(null);

    // Stats
    readonly totalCategories = computed(() => this.categories().length);
    readonly activeCategories = computed(() => this.categories().filter(c => c.is_active).length);
    readonly inactiveCategories = computed(() => this.categories().filter(c => !c.is_active).length);

    // Flat list (no tree) for the table
    readonly flatCategories = computed(() => this.categories());

    readonly columns: ColumnDef<Category>[] = [
        {
            key: 'name',
            label: 'Categoría',
            sortable: true,
            type: 'text',
        },
        {
            key: 'slug',
            label: 'Slug',
            sortable: true,
            type: 'text',
            formatter: (val) => `/${val}`,
        },
        {
            key: 'parent_id',
            label: 'Tipo',
            type: 'text',
            formatter: (val) => val ? 'Subcategoría' : 'Principal',
        },
        {
            key: 'is_active',
            label: 'Estado',
            type: 'status',
            formatter: (val) => val ? 'active' : 'inactive',
        },
    ];

    readonly actions: TableAction<Category>[] = [
        {
            id: 'edit',
            label: 'Editar',
            className: 'hover:text-indigo-600 dark:hover:text-indigo-400 font-medium',
            callback: (item) => this.openEdit(item),
        },
        {
            id: 'toggle',
            label: 'Activar/Desactivar',
            className: 'hover:text-amber-600 dark:hover:text-amber-400 font-medium',
            callback: (item) => this.toggleStatus(item),
        },
        {
            id: 'delete',
            label: 'Eliminar',
            className: 'hover:text-red-600 dark:hover:text-red-400 font-medium',
            callback: (item) => this.deleteCategory(item),
        },
    ];

    async ngOnInit() {
        await this.loadCategories();
    }

    async loadCategories() {
        this.isLoading.set(true);
        try {
            // Get flat list for table display
            const data = await this.categoriesService.getCategories(false);
            this.categories.set(data);
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error al cargar las categorías.');
        } finally {
            this.isLoading.set(false);
        }
    }

    openCreate() {
        this.editingCategory.set(null);
        this.showDrawer.set(true);
    }

    openEdit(category: Category) {
        this.editingCategory.set(category);
        this.showDrawer.set(true);
    }

    closeDrawer() {
        this.showDrawer.set(false);
        this.editingCategory.set(null);
    }

    async toggleStatus(category: Category) {
        try {
            const updated = await this.categoriesService.updateCategory(category.id, {
                is_active: !category.is_active,
            });
            this.categories.update(cats =>
                cats.map(c => c.id === updated.id ? updated : c)
            );
            this.toast.success(
                `Categoría "${updated.name}" ${updated.is_active ? 'activada' : 'desactivada'}.`
            );
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error al cambiar el estado.');
        }
    }

    async deleteCategory(category: Category) {
        const confirmed = await this.toast.confirm(
            `¿Eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
            'Eliminar Categoría'
        );

        if (!confirmed) return;

        this.deletingId.set(category.id);
        try {
            await this.categoriesService.deleteCategory(category.id);
            this.categories.update(cats => cats.filter(c => c.id !== category.id));
            this.toast.success(`Categoría "${category.name}" eliminada.`);
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error al eliminar la categoría.');
        } finally {
            this.deletingId.set(null);
        }
    }

    onCategorySaved(category: Category) {
        const exists = this.categories().some(c => c.id === category.id);
        if (exists) {
            this.categories.update(cats => cats.map(c => c.id === category.id ? category : c));
        } else {
            this.categories.update(cats => [...cats, category]);
        }
        this.closeDrawer();
    }
}
