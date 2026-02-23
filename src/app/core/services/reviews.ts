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
            .select('*, customer:customers(first_name, last_name)', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
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
                status: 'pending',
                is_approved: false
            })
            .select()
            .single();

        if (error) throw error;
        return data as ProductReview;
    }

    // ── Admin Methods ────────────────────────────────────────

    async getAdminReviews(
        page: number = 1,
        pageSize: number = 10,
        status?: 'pending' | 'approved' | 'rejected'
    ): Promise<{ data: ProductReview[]; count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        let query = this.supabase.client
            .from('product_reviews')
            .select('*, customer:customers(first_name, last_name, email), product:products(name, sku, product_images(url, is_primary))', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data as ProductReview[], count: count ?? 0 };
    }

    async updateReviewStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
        const { data: { user } } = await this.supabase.auth.getUser();

        const updateData: any = {
            status,
            is_approved: status === 'approved',
            updated_at: new Date().toISOString()
        };

        if (status === 'approved') {
            updateData.approved_at = new Date().toISOString();
            updateData.approved_by = user?.id;
        }

        const { error } = await this.supabase.client
            .from('product_reviews')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
    }

    async getReviewStats(): Promise<{ average: number; total: number; pending: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const { data, error } = await this.supabase.client
            .from('product_reviews')
            .select('rating, status')
            .eq('tenant_id', tenantId);

        if (error) throw error;

        const total = data.length;
        const pending = data.filter(r => r.status === 'pending').length;
        const sum = data.reduce((acc, r) => acc + (r.rating || 0), 0);
        const average = total > 0 ? Number((sum / total).toFixed(1)) : 0;

        return { average, total, pending };
    }
}
