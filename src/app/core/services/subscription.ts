import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { BILLING_PLANS, SubscriptionHistoryEntry, BillingPlan } from '@core/models/billing.model';
import { SubscriptionPlan, SubscriptionStatus } from '@core/models/tenant.model';

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
    const tenantId = this.tenantService.tenantId();
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

    return (data || []).map((entry) => ({
      ...entry,
      amount: entry.amount != null ? Number(entry.amount) : 0,
    })) as unknown as SubscriptionHistoryEntry[];
  }

  /**
   * Get the current active plan details
   */
  getCurrentPlanDetails(): BillingPlan | undefined {
    const planId = this.tenantService.tenant()?.plan;
    return BILLING_PLANS.find((p) => p.id === planId);
  }

  /**
   * Get current resource usage for the tenant
   */
  async getUsage(): Promise<{ products: number; members: number; categories: number }> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return { products: 0, members: 0, categories: 0 };

    const [products, members, categories] = await Promise.all([
      this.supabase.client
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      this.supabase.client
        .from('tenant_members')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      this.supabase.client
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
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

    // Check if subscription has completely expired
    if (this.isSubscriptionExpired()) {
      return false;
    }

    const usage = await this.getUsage();
    const limit = plan.limitations[resourceType];

    if (limit === null) {
      return true; // No limit for this resource type
    }

    return usage[resourceType] < limit;
  }

  /**
   * Checks whether the current subscription is expired (past ends_at or expired status)
   */
  isSubscriptionExpired(): boolean {
    const tenant = this.tenantService.tenant();
    if (!tenant) return false;
    if (tenant.plan_status === 'expired') return true;

    if (tenant.plan_status === 'cancelled' && tenant.subscription_ends_at) {
      return new Date(tenant.subscription_ends_at) < new Date();
    }

    return false;
  }

  /**
   * Checks whether the current tenant has active access to their plan features
   * (Active, Trial, OR Cancelled but before the end date)
   */
  hasActiveAccess(): boolean {
    const tenant = this.tenantService.tenant();
    if (!tenant) return true;
    if (tenant.plan_status === 'active' || tenant.plan_status === 'trial') return true;

    if (tenant.plan_status === 'cancelled') {
      if (!tenant.subscription_ends_at) return true;
      return new Date(tenant.subscription_ends_at) >= new Date();
    }

    return false;
  }

  /**
   * Cancel subscription: user keeps access until subscription_ends_at / billing_period_end
   */
  async cancelSubscription(reason: string = 'user_cancelled'): Promise<void> {
    const tenant = this.tenantService.tenant();
    const tenantId = this.tenantService.tenantId();
    if (!tenant || !tenantId) throw new Error('No tenant found');

    // Get the latest history entry to determine billing_period_end if not set
    let endsAt = tenant.subscription_ends_at;
    if (!endsAt) {
      const history = await this.getSubscriptionHistory();
      if (history.length > 0 && history[0].billing_period_end) {
        endsAt = history[0].billing_period_end;
      } else {
        // Default to 1 month from creation/now
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        endsAt = date.toISOString();
      }
    }

    // 1. Update tenants table
    await this.tenantService.updateTenant(tenantId, {
      plan_status: 'cancelled' as SubscriptionStatus,
      subscription_ends_at: endsAt,
    });

    // 2. Insert record into subscription_history
    const { error: historyError } = await this.supabase.client
      .from('subscription_history')
      .insert({
        tenant_id: tenantId,
        plan: tenant.plan,
        status: 'cancelled',
        amount: 0,
        currency: this.tenantService.currency(),
        billing_period_start: new Date().toISOString(),
        billing_period_end: endsAt,
        payment_method: 'cancellation',
        metadata: {
          reason,
          cancelled_at: new Date().toISOString(),
          access_until: endsAt,
        },
      });

    if (historyError) {
      console.warn('Could not insert cancellation history record:', historyError);
    }
  }

  /**
   * Reactivate subscription before expiration
   */
  async reactivateSubscription(): Promise<void> {
    const tenant = this.tenantService.tenant();
    const tenantId = this.tenantService.tenantId();
    if (!tenant || !tenantId) throw new Error('No tenant found');

    const currentPlan = this.getCurrentPlanDetails();

    // 1. Update tenants table
    await this.tenantService.updateTenant(tenantId, {
      plan_status: 'active' as SubscriptionStatus,
    });

    // 2. Insert record into subscription_history
    const { error: historyError } = await this.supabase.client
      .from('subscription_history')
      .insert({
        tenant_id: tenantId,
        plan: tenant.plan,
        status: 'active',
        amount: currentPlan?.price || 0,
        currency: this.tenantService.currency(),
        billing_period_start: new Date().toISOString(),
        billing_period_end: tenant.subscription_ends_at || new Date(Date.now() + 30 * 86400000).toISOString(),
        payment_method: 'reactivation',
        metadata: {
          reactivated_at: new Date().toISOString(),
        },
      });

    if (historyError) {
      console.warn('Could not insert reactivation history record:', historyError);
    }
  }

  /**
   * Change plan
   */
  async changePlan(planId: SubscriptionPlan): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) throw new Error('No tenant found');

    const newPlan = BILLING_PLANS.find((p) => p.id === planId);
    const endsAt = new Date(Date.now() + 30 * 86400000).toISOString();

    // 1. Update tenant
    await this.tenantService.updateTenant(tenantId, {
      plan: planId,
      plan_status: 'active' as SubscriptionStatus,
      subscription_ends_at: endsAt,
    });

    // 2. Insert history record
    const { error: historyError } = await this.supabase.client
      .from('subscription_history')
      .insert({
        tenant_id: tenantId,
        plan: planId,
        status: 'active',
        amount: newPlan?.price || 0,
        currency: this.tenantService.currency(),
        billing_period_start: new Date().toISOString(),
        billing_period_end: endsAt,
        payment_method: 'plan_change',
        metadata: {
          changed_at: new Date().toISOString(),
        },
      });

    if (historyError) {
      console.warn('Could not insert change plan history record:', historyError);
    }
  }
}

