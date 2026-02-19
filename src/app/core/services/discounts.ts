import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { DiscountCode, DiscountUsage } from '@core/models/discount.';
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
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) throw error;
        return { data: data as DiscountCode[], count: count ?? 0 };
    }

    async validateCode(code: string): Promise<DiscountCode | null> {
        const tenantId = this.tenantService.tenantId();
        const { data, error } = await this.supabase.client
            .from('discount_codes')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (error) return null;
        return data as DiscountCode;
    }

    async createDiscountCode(discount: Partial<DiscountCode>): Promise<DiscountCode> {
        const tenantId = this.tenantService.tenantId();
        const { data, error } = await this.supabase.client
            .from('discount_codes')
            .insert({
                ...discount,
                tenant_id: tenantId,
            })
            .select()
            .single();

        if (error) throw error;
        return data as DiscountCode;
    }
}
