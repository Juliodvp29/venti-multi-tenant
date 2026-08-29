import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { Customer, CustomerAddress } from '@core/models/customer';
import { TenantService } from './tenant';
import { Database } from '../types/database.types';

export interface CustomerFilters {
    search?: string;
    accepts_marketing?: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class CustomersService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getCustomers(
        page: number = 1,
        pageSize: number = 10,
        filters?: CustomerFilters
    ): Promise<{ data: Customer[]; count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return { data: [], count: 0 };

        let query = this.supabase.client
            .from('customers')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId);

        if (filters) {
            if (filters.search) {
                query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }
            if (filters.accepts_marketing !== undefined) {
                query = query.eq('accepts_marketing', filters.accepts_marketing);
            }
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: (data as unknown as Customer[]) || [], count: count ?? 0 };
    }

    async getCustomer(id: string): Promise<Customer | null> {
        const { data, error } = await this.supabase.client
            .from('customers')
            .select(`
        *,
        addresses:customer_addresses(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as Customer;
    }

    async createCustomer(customer: Partial<Customer>): Promise<Customer> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const { data, error } = await this.supabase.client
            .from('customers')
            .insert({
                ...customer,
                tenant_id: tenantId,
            } as unknown as Database['public']['Tables']['customers']['Insert'])
            .select()
            .single();

        if (error) throw error;
        return data as unknown as Customer;
    }

    async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
        const { data, error } = await this.supabase.client
            .from('customers')
            .update({
                ...customer,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as Customer;
    }

    async deleteCustomer(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // Address Methods
    async addAddress(customerId: string, address: Partial<CustomerAddress>): Promise<CustomerAddress> {
        const tenantId = this.tenantService.tenantId();
        const { data, error } = await this.supabase.client
            .from('customer_addresses')
            .insert({
                ...address,
                customer_id: customerId,
                tenant_id: tenantId,
            } as unknown as Database['public']['Tables']['customer_addresses']['Insert'])
            .select()
            .single();

        if (error) throw error;
        return data as unknown as CustomerAddress;
    }

    async getCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
        const { data, error } = await this.supabase.client
            .from('customer_addresses')
            .select('*')
            .eq('customer_id', customerId)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as unknown as CustomerAddress[]) || [];
    }

    async updateAddress(id: string, address: Partial<CustomerAddress>): Promise<CustomerAddress> {
        const { data, error } = await this.supabase.client
            .from('customer_addresses')
            .update({
                ...address,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as CustomerAddress;
    }

    async deleteAddress(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('customer_addresses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async setDefaultAddress(customerId: string, addressId: string, type: 'shipping' | 'billing' = 'shipping'): Promise<void> {
        const clearObj: Database['public']['Tables']['customer_addresses']['Update'] =
            type === 'shipping' ? { is_default: false } : { is_billing_default: false };

        await this.supabase.client
            .from('customer_addresses')
            .update(clearObj)
            .eq('customer_id', customerId);

        const setObj: Database['public']['Tables']['customer_addresses']['Update'] =
            type === 'shipping' ? { is_default: true } : { is_billing_default: true };

        const { error } = await this.supabase.client
            .from('customer_addresses')
            .update(setObj)
            .eq('id', addressId);

        if (error) throw error;
    }
}
