import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { ShippingZone, ShippingRate, TaxRate } from '@core/models';

@Injectable({
    providedIn: 'root',
})
export class ShippingService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    private get tenantId() {
        const id = this.tenantService.tenantId();
        if (!id) throw new Error('No tenant ID found');
        return id;
    }


    async getShippingZones() {
        const { data, error } = await this.supabase.client
            .from('shipping_zones')
            .select('*, rates:shipping_rates(*)')
            .eq('tenant_id', this.tenantId)
            .is('deleted_at', null);

        if (error) throw error;
        return data as ShippingZone[];
    }

    async createShippingZone(zone: Partial<ShippingZone>) {
        const { data, error } = await this.supabase.client
            .from('shipping_zones')
            .insert({
                ...zone,
                tenant_id: this.tenantId,
            } as any)
            .select()
            .single();

        if (error) throw error;
        return data as ShippingZone;
    }

    async updateShippingZone(id: string, updates: Partial<ShippingZone>) {
        const { data, error } = await this.supabase.client
            .from('shipping_zones')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('tenant_id', this.tenantId)
            .select()
            .single();

        if (error) throw error;
        return data as ShippingZone;
    }

    async deleteShippingZone(id: string) {
        const { error } = await this.supabase.client
            .from('shipping_zones')
            .delete()
            .eq('id', id)
            .eq('tenant_id', this.tenantId);

        if (error) throw error;
    }


    async createShippingRate(rate: Partial<ShippingRate>) {
        const { data, error } = await this.supabase.client
            .from('shipping_rates')
            .insert({
                ...rate,
                tenant_id: this.tenantId,
            } as any)
            .select()
            .single();

        if (error) throw error;
        return data as ShippingRate;
    }

    async updateShippingRate(id: string, updates: Partial<ShippingRate>) {
        const { data, error } = await this.supabase.client
            .from('shipping_rates')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('tenant_id', this.tenantId)
            .select()
            .single();

        if (error) throw error;
        return data as ShippingRate;
    }

    async deleteShippingRate(id: string) {
        const { error } = await this.supabase.client
            .from('shipping_rates')
            .delete()
            .eq('id', id)
            .eq('tenant_id', this.tenantId);

        if (error) throw error;
    }


    async getTaxRates() {
        const { data, error } = await this.supabase.client
            .from('tax_rates')
            .select('*')
            .eq('tenant_id', this.tenantId);

        if (error) throw error;
        return data as TaxRate[];
    }

    async createTaxRate(rate: Partial<TaxRate>) {
        const { data, error } = await this.supabase.client
            .from('tax_rates')
            .insert({
                ...rate,
                tenant_id: this.tenantId,
            } as any)
            .select()
            .single();

        if (error) throw error;
        return data as TaxRate;
    }

    async updateTaxRate(id: string, updates: Partial<TaxRate>) {
        const { data, error } = await this.supabase.client
            .from('tax_rates')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('tenant_id', this.tenantId)
            .select()
            .single();

        if (error) throw error;
        return data as TaxRate;
    }

    async deleteTaxRate(id: string) {
        const { error } = await this.supabase.client
            .from('tax_rates')
            .delete()
            .eq('id', id)
            .eq('tenant_id', this.tenantId);

        if (error) throw error;
    }
}
