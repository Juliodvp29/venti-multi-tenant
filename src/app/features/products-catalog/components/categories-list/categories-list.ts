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

        // Split into batches
        const batches: Record<string, any>[][] = [];
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            batches.push(rows.slice(i, i + BATCH_SIZE));
        }

        this.toast.info(`Importando ${total} categoría${total > 1 ? 's' : ''}...`);

        for (const batch of batches) {
            const results = await Promise.allSettled(
                batch.map(async (row) => {
                    const name = String(row['name'] ?? '').trim();
                    if (!name) throw new Error('Campo "name" vacío');

                    const slug = String(row['slug'] ?? '').trim()
                        ? toSlug(String(row['slug']))
                        : toSlug(name);

                    return this.categoriesService.createCategory({
                        name,
                        slug,
                        description: String(row['description'] ?? '').trim() || undefined,
                        parent_id: String(row['parent_id'] ?? '').trim() || undefined,
                        is_active: String(row['is_active'] ?? 'true').toLowerCase() !== 'false',
                        sort_order: row['sort_order'] ? Number(row['sort_order']) : 0,
                    });
                })
            );

            for (const result of results) {
                if (result.status === 'fulfilled') {
                    this.categories.update(cats => [...cats, result.value]);
                    created++;
                } else {
                    failed++;
                    errors.push((result.reason as Error)?.message ?? 'Error desconocido');
                }
            }

            // Yield between batches to keep UI responsive
            await new Promise(r => setTimeout(r, 50));
        }

        if (created > 0 && failed === 0) {
            this.toast.success(`✅ ${created} categoría${created > 1 ? 's' : ''} importada${created > 1 ? 's' : ''} correctamente.`);
        } else if (created > 0 && failed > 0) {
            this.toast.warning(`⚠️ ${created} importadas, ${failed} con error. Revisa la consola.`);
            console.warn('[Import] Errores:', errors);
        } else {
            this.toast.error(`❌ Ninguna categoría pudo importarse. Verifica el archivo.`);
            console.error('[Import] Errores:', errors);
        }
    }
}
