import { inject, Injectable, signal } from '@angular/core';
import { Supabase } from './supabase';
import { CreateProductDto, Product, UpdateProductDto } from '@core/models/product.model';
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
            query = query.ilike('name', `%${filters['search']}%`);
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

    async uploadImage(file: File, productId: string, isPrimary: boolean = false): Promise<string> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        // Use StorageService to handle validation, optimization and upload
        const folder = `${tenantId}/products/${productId}`;

        // We can use the 'products' bucket if it exists, or a general 'media' bucket
        // Assuming 'products' is a valid bucket key in environment
        const result = await this.storageService.uploadImage('products', file, folder);

        // Save metadata to product_images table
        const { error: dbError } = await this.supabase.client
            .from('product_images')
            .insert({
                product_id: productId,
                tenant_id: tenantId,
                url: result.url,
                is_primary: isPrimary,
                // We could also save width, height, size if StorageService returned them
                // or if we processed them here.
            });

        if (dbError) throw dbError;

        return result.url;
    }
}
