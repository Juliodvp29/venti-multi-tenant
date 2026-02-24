import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { BILLING_PLANS, SubscriptionHistoryEntry, BillingPlan } from '@core/models/billing.model';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    /**
     * Get all available billing plans
     */
    getPlans(): BillingPlan[] {
        return BILLING_PLANS;
    }

    /**
     * Get current subscription history for the current tenant
     */
    async getSubscriptionHistory(): Promise<SubscriptionHistoryEntry[]> {
        const tenantId = this.tenantService.tenant()?.id;
        if (!tenantId) return [];

        const { data, error } = await this.supabase.client
            .from('subscription_history')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching subscription history:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get the current active plan details
     */
    getCurrentPlanDetails(): BillingPlan | undefined {
        const planId = this.tenantService.tenant()?.plan;
        return BILLING_PLANS.find(p => p.id === planId);
    }

    /**
   * Get current resource usage for the tenant
   */
    async getUsage(): Promise<{ products: number; members: number; categories: number }> {
        const tenantId = this.tenantService.tenant()?.id;
        if (!tenantId) return { products: 0, members: 0, categories: 0 };

        const [products, members, categories] = await Promise.all([
            this.supabase.client.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            this.supabase.client.from('tenant_members').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            this.supabase.client.from('categories').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        ]);

        return {
            products: products.count || 0,
            members: members.count || 0,
            categories: categories.count || 0,
        };
    }

    /**
     * Check if a resource can be added
     */
    async canAddResource(resourceType: 'products' | 'members' | 'categories'): Promise<boolean> {
        const plan = this.getCurrentPlanDetails();
        if (!plan) return false;

        const usage = await this.getUsage();
        const limit = plan.limitations[resourceType];

        return usage[resourceType] < limit;
    }

    /**
     * Placeholder for upgrading/changing plan
       * This would typically integrate with Stripe or another payment provider
       */
    async changePlan(planId: string) {
        // Logic for changing plan would go here
        console.log('Changing plan to:', planId);
        // For now, this is just a placeholder
        return Promise.resolve({ success: true });
    }
}
