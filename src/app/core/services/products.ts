import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { CreateProductDto, Product, ProductImage, ProductVariant, UpdateProductDto } from '@core/models/product';
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

        const columns = filters?.['categoryId']
            ? '*, images:product_images(*), product_categories!inner(category_id), variants:product_variants(stock_quantity)'
            : '*, images:product_images(*), variants:product_variants(stock_quantity)';

        let query = this.supabase.client
            .from('products')
            .select(columns, { count: 'exact' })
            .eq('tenant_id', tenantId)
            .is('deleted_at', null)
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (filters?.['categoryId']) {
            query = query.eq('product_categories.category_id', filters['categoryId']);
        }

        const sortBy = filters?.['sortBy'] || 'newest';
        switch (sortBy) {
            case 'price_asc':
                query = query.order('price', { ascending: true });
                break;
            case 'price_desc':
                query = query.order('price', { ascending: false });
                break;
            case 'popular':
                query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
                break;
            case 'best_sellers':
                query = query.order('created_at', { ascending: false });
                break;
            case 'newest':
            default:
                query = query.order('created_at', { ascending: false });
                break;
        }

        if (filters?.['search']) {
            const term = filters['search'];
            query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
        }

        if (filters?.['status']) {
            if (filters['status'] === 'out_of_stock') {
                query = query.or(
                    `status.eq.out_of_stock,and(track_inventory.eq.true,stock_quantity.eq.0)`
                );
            } else {
                query = query.eq('status', filters['status']);
            }
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
            } as any)
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

    async syncProductVariants(productId: string, variants: Partial<ProductVariant>[]): Promise<void> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        // 1. Get existing variants
        const { data: existingVariants, error: fetchError } = await this.supabase.client
            .from('product_variants')
            .select('id')
            .eq('product_id', productId);

        if (fetchError) throw fetchError;

        const currentIds = (existingVariants || []).map(v => v.id);
        const newIds = variants.map(v => v.id).filter(Boolean) as string[];

        // 2. Identify variants to delete
        const idsToDelete = currentIds.filter(id => !newIds.includes(id));
        if (idsToDelete.length > 0) {
            const { error: deleteError } = await this.supabase.client
                .from('product_variants')
                .delete()
                .in('id', idsToDelete);
            if (deleteError) throw deleteError;
        }

        // 3. Identify variants to upsert (insert or update)
        const entries = variants.map(v => {
            const entry: any = {
                ...v,
                product_id: productId,
                tenant_id: tenantId,
                updated_at: new Date().toISOString()
            };
            if (!entry.id) delete entry.id;
            if (entry.sku === '') entry.sku = null;
            return entry;
        });

        if (entries.length > 0) {
            const { error: upsertError } = await this.supabase.client
                .from('product_variants')
                .upsert(entries);
            if (upsertError) throw upsertError;
        }
    }

    async getRelatedProducts(productId: string, categoryIds: string[], limit: number = 4): Promise<Product[]> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId || !categoryIds.length) return [];

        const { data, error } = await this.supabase.client
            .from('product_categories')
            .select(`
                product:products(
                    *,
                    images:product_images(*)
                )
            `)
            .in('category_id', categoryIds)
            .neq('product_id', productId)
            .limit(limit * 2); // Fetch more to allow for filtering duplicates/status

        if (error) throw error;

        const products = (data?.map((item: any) => item.product).filter(Boolean) as Product[]) || [];

        // Remove duplicates and ensure active
        const seen = new Set();
        return products.filter(p => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return p.status === 'active' && !p.deleted_at;
        }).slice(0, limit);
    }
}
