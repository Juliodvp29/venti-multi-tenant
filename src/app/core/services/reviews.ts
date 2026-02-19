import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { ProductReview } from '@core/models/review';
import { TenantService } from './tenant';

@Injectable({
    providedIn: 'root',
})
export class ReviewsService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getReviews(
        productId?: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<{ data: ProductReview[]; count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        let query = this.supabase.client
            .from('product_reviews')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data as ProductReview[], count: count ?? 0 };
    }

    async approveReview(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('product_reviews')
            .update({
                is_approved: true,
                approved_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;
    }

    async createReview(review: Partial<ProductReview>): Promise<ProductReview> {
        const tenantId = this.tenantService.tenantId();
        const { data, error } = await this.supabase.client
            .from('product_reviews')
            .insert({
                ...review,
                tenant_id: tenantId,
            })
            .select()
            .single();

        if (error) throw error;
        return data as ProductReview;
    }
}
