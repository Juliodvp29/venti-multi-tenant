import { computed, inject, Injectable, signal } from '@angular/core';
import {Tenant, TenantMember } from '@core/models';
import { Nullable } from '@core/types';
import { Supabase } from './supabase';
import { TenantRole } from '@core/enums';
import { AuthService } from './auth';

interface TenantState {
  currentTenant: Nullable<Tenant>;
  memberInfo: Nullable<TenantMember>;
  tenants: Tenant[];
  loading: boolean;
}

@Injectable({
  providedIn: 'root',
})

export class TenantService {
   private readonly supabase = inject(Supabase);
  private readonly authService = inject(AuthService);

  private readonly _state = signal<TenantState>({
    currentTenant: null,
    memberInfo: null,
    tenants: [],
    loading: false,
  });

  // ── Computed ─────────────────────────────────────────────
  readonly currentTenant = computed(() => this._state().currentTenant);
  readonly tenants = computed(() => this._state().tenants);
  readonly isLoading = computed(() => this._state().loading);
  readonly memberRole = computed(() => this._state().memberInfo?.role ?? null);
  readonly tenantId = computed(() => this._state().currentTenant?.id ?? null);

  readonly isOwner = computed(
    () => this._state().memberInfo?.role === TenantRole.Owner
  );
  readonly isAdmin = computed(() =>
    [TenantRole.Owner, TenantRole.Admin].includes(
      this._state().memberInfo?.role as TenantRole
    )
  );
  readonly canEdit = computed(() =>
    [TenantRole.Owner, TenantRole.Admin, TenantRole.Editor].includes(
      this._state().memberInfo?.role as TenantRole
    )
  );

  // ── Methods ──────────────────────────────────────────────

  async loadUserTenants(): Promise<void> {
    const userId = this.authService.userId();
    if (!userId) return;

    this._state.update((s) => ({ ...s, loading: true }));

    const { data, error } = await this.supabase.client
      .from('tenants')
      .select('*')
      .eq('owner_id', userId)
      .is('deleted_at', null);

    if (error) {
      this._state.update((s) => ({ ...s, loading: false }));
      throw error;
    }

    this._state.update((s) => ({
      ...s,
      tenants: data ?? [],
      // Auto-select first tenant
      currentTenant: data?.[0] ?? null,
      loading: false,
    }));

    if (data?.[0]) {
      await this.loadMemberInfo(data[0].id);
    }
  }

  async setCurrentTenant(tenantId: string): Promise<void> {
    const tenant = this._state().tenants.find((t) => t.id === tenantId);
    if (!tenant) return;
    this._state.update((s) => ({ ...s, currentTenant: tenant }));
    await this.loadMemberInfo(tenantId);
  }

  private async loadMemberInfo(tenantId: string): Promise<void> {
    const userId = this.authService.userId();
    if (!userId) return;

    const { data } = await this.supabase.client
      .from('tenant_members')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    this._state.update((s) => ({ ...s, memberInfo: data }));
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await this.supabase.client
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;

    this._state.update((s) => ({
      ...s,
      currentTenant: data,
      tenants: s.tenants.map((t) => (t.id === tenantId ? data : t)),
    }));

    return data;
  }

  clearTenant(): void {
    this._state.set({ currentTenant: null, memberInfo: null, tenants: [], loading: false });
  }
}
