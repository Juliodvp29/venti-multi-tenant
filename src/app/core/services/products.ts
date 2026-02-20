import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { CreateProductDto, Product, ProductImage, UpdateProductDto } from '@core/models/product';
import { Nullable, PaginatedState } from '@core/types';
import { TenantService } from './tenant';
import { StorageService } from './storage';

@Injectable({
    providedIn: 'root',
})
export class ProductsService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);
    private readonly storageService = inject(StorageService);

    async getProducts(
        page: number = 1,
        pageSize: number = 10,
        filters?: Record<string, any>
    ): Promise<{ data: Product[]; count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        let query = this.supabase.client
            .from('products')
            .select('*, images:product_images(*)', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .is('deleted_at', null)
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (filters?.['search']) {
            const term = filters['search'];
            query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
        }

        if (filters?.['status']) {
            query = query.eq('status', filters['status']);
        }

        if (filters?.['category_id']) {
            // Logic to filter by category relation would go here
            // This is complex in Supabase without a view or rpc for many-to-many
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return { data: data as any[], count: count ?? 0 };
    }

    async getProduct(id: string): Promise<Product | null> {
        const { data, error } = await this.supabase.client
            .from('products')
            .select(`
        *,
        images:product_images(*),
        categories:product_categories(category:categories(*)),
        variants:product_variants(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as any;
    }

    async createProduct(product: CreateProductDto): Promise<Product> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const { data, error } = await this.supabase.client
            .from('products')
            .insert({
                ...product,
                tenant_id: tenantId,
            })
            .select()
            .single();

        if (error) throw error;
        return data as any;
    }

    async updateProduct(id: string, product: UpdateProductDto): Promise<Product> {
        const { data, error } = await this.supabase.client
            .from('products')
            .update({
                ...product,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as any;
    }

    async deleteProduct(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('products')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Replaces all category associations for a product.
     * Deletes existing rows in product_categories then inserts new ones.
     */
    async setProductCategories(productId: string, categoryIds: string[]): Promise<void> {

        // Delete existing associations
        const { error: deleteError } = await this.supabase.client
            .from('product_categories')
            .delete()
            .eq('product_id', productId);

        if (deleteError) throw deleteError;

        if (!categoryIds.length) return;

        // Insert new associations
        const rows = categoryIds.map(categoryId => ({
            product_id: productId,
            category_id: categoryId,
        }));

        const { error: insertError } = await this.supabase.client
            .from('product_categories')
            .insert(rows);

        if (insertError) throw insertError;
    }

    async setPrimaryImage(productId: string, imageId: string): Promise<void> {
        // Reset all images for this product
        await this.supabase.client
            .from('product_images')
            .update({ is_primary: false })
            .eq('product_id', productId);

        // Set the selected image as primary
        const { error } = await this.supabase.client
            .from('product_images')
            .update({ is_primary: true })
            .eq('id', imageId);

        if (error) throw error;
    }

    async uploadImage(
        file: File,
        productId: string,
        isPrimary: boolean = false,
        altText?: string,
        sortOrder: number = 0
    ): Promise<ProductImage> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const folder = `${tenantId}/products/${productId}`;
        const result = await this.storageService.uploadImage('products', file, folder);

        const { data, error: dbError } = await this.supabase.client
            .from('product_images')
            .insert({
                product_id: productId,
                tenant_id: tenantId,
                url: result.url,
                is_primary: isPrimary,
                alt_text: altText ?? null,
                sort_order: sortOrder,
            })
            .select()
            .single();

        if (dbError) throw dbError;
        return data as ProductImage;
    }

    async deleteProductImage(imageId: string, imageUrl: string): Promise<void> {
        // Delete DB row
        const { error } = await this.supabase.client
            .from('product_images')
            .delete()
            .eq('id', imageId);

        if (error) throw error;

        // Delete storage file (best effort - don't fail if file not found)
        try {
            const storagePath = this.storageService.extractPathFromUrl(imageUrl);
            await this.storageService.deleteFile('products', storagePath);
        } catch (e) {
            console.warn('[ProductsService] Could not delete storage file:', e);
        }
    }
}
