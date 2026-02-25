import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { DiscountCode } from '@core/models/discount.model';
import { TenantService } from './tenant';

@Injectable({
    providedIn: 'root',
})
export class DiscountsService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getDiscountCodes(
        page: number = 1,
        pageSize: number = 20
    ): Promise<{ data: DiscountCode[]; count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const { data, error, count } = await this.supabase.client
            .from('discount_codes')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) throw error;
        return { data: data as DiscountCode[], count: count ?? 0 };
    }

    async getDiscountById(id: string): Promise<DiscountCode> {
        const { data, error } = await this.supabase.client
            .from('discount_codes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as DiscountCode;
    }

    async validateCode(code: string): Promise<DiscountCode | null> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return null;
        const { data, error } = await this.supabase.client
            .from('discount_codes')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error) return null;

        const discount = data as DiscountCode;

        // Basic validation (more validation in storefront logic)
        const now = new Date();
        if (discount.starts_at && new Date(discount.starts_at) > now) return null;
        if (discount.ends_at && new Date(discount.ends_at) < now) return null;
        if (discount.usage_limit && discount.usage_count >= discount.usage_limit) return null;

        return discount;
    }

    async createDiscountCode(discount: Partial<DiscountCode>): Promise<DiscountCode> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');
        const { data, error } = await this.supabase.client
            .from('discount_codes')
            .insert({
                ...discount,
                tenant_id: tenantId,
                code: discount.code?.toUpperCase(),
                usage_count: 0
            } as any)
            .select()
            .single();

        if (error) throw error;
        return data as DiscountCode;
    }

    async updateDiscountCode(id: string, discount: Partial<DiscountCode>): Promise<DiscountCode> {
        const { data, error } = await this.supabase.client
            .from('discount_codes')
            .update({
                ...discount,
                code: discount.code?.toUpperCase(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as DiscountCode;
    }

    async deleteDiscountCode(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('discount_codes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
