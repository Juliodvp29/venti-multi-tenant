import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { Customer, CustomerAddress } from '@core/models/customer';
import { TenantService } from './tenant';

@Injectable({
    providedIn: 'root',
})
export class CustomersService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getCustomers(
        page: number = 1,
        pageSize: number = 20,
        filters?: Record<string, any>
    ): Promise<{ data: Customer[]; count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        let query = this.supabase.client
            .from('customers')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (filters?.['search']) {
            query = query.or(`email.ilike.%${filters['search']}%,first_name.ilike.%${filters['search']}%,last_name.ilike.%${filters['search']}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data as Customer[], count: count ?? 0 };
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
        return data as Customer;
    }

    async createCustomer(customer: Partial<Customer>): Promise<Customer> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        const { data, error } = await this.supabase.client
            .from('customers')
            .insert({
                ...customer,
                tenant_id: tenantId,
            })
            .select()
            .single();

        if (error) throw error;
        return data as Customer;
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
        return data as Customer;
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
            })
            .select()
            .single();

        if (error) throw error;
        return data as CustomerAddress;
    }
}
