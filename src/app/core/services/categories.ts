import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@core/models/category';
import { TenantService } from './tenant';

@Injectable({
    providedIn: 'root',
})
export class CategoriesService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getCategories(includeTree: boolean = true): Promise<Category[]> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const { data, error } = await this.supabase.client
            .from('categories')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        if (includeTree) {
            return this.buildCategoryTree(data as Category[]);
        }
        return data as Category[];
    }

    async getCategory(id: string): Promise<Category | null> {
        const { data, error } = await this.supabase.client
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Category;
    }

    async createCategory(category: CreateCategoryDto): Promise<Category> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const { data, error } = await this.supabase.client
            .from('categories')
            .insert({
                ...category,
                tenant_id: tenantId,
            })
            .select()
            .single();

        if (error) throw error;
        return data as Category;
    }

    async updateCategory(id: string, category: UpdateCategoryDto): Promise<Category> {
        const { data, error } = await this.supabase.client
            .from('categories')
            .update({
                ...category,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Category;
    }

    async deleteCategory(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    private buildCategoryTree(categories: Category[]): Category[] {
        const map = new Map<string, Category>();
        const roots: Category[] = [];

        // First pass: create map and add children array
        categories.forEach(cat => {
            map.set(cat.id, { ...cat, children: [] });
        });

        // Second pass: link children to parents
        map.forEach(cat => {
            if (cat.parent_id && map.has(cat.parent_id)) {
                map.get(cat.parent_id)?.children?.push(cat);
            } else {
                roots.push(cat);
            }
        });

        return roots;
    }
}
