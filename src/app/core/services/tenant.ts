import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Tenant, TenantMember, TenantSettingItem, TenantBranding, StorefrontLayout } from '@core/models';
import { Nullable } from '@core/types';
import { Supabase } from './supabase';
import { TenantRole } from '@core/enums';
import { AuthService } from './auth';
import { environment } from '@env/environment';

interface TenantState {
  currentTenant: Nullable<Tenant>;
  memberInfo: Nullable<TenantMember>;
  tenants: Tenant[];
  loading: boolean;
  error: Nullable<string>;
  initialized: boolean;
  settings: TenantSettingItem[];
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
    error: null,
    initialized: false,
    settings: [],
  });

  // ── Computed ─────────────────────────────────────────────
  readonly currentTenant = computed(() => this._state().currentTenant);
  readonly tenant = computed(() => this._state().currentTenant); // Alias for Settings
  readonly tenants = computed(() => this._state().tenants);
  readonly isLoading = computed(() => this._state().loading);
  readonly loading = computed(() => this._state().loading); // Alias for Settings
  readonly error = computed(() => this._state().error);
  readonly initialized = computed(() => this._state().initialized);
  readonly memberRole = computed(() => this._state().memberInfo?.role ?? null);
  readonly tenantId = computed(() => this._state().currentTenant?.id ?? null);
  readonly businessName = computed(() => this._state().currentTenant?.business_name ?? null);
  readonly settings = computed(() => this._state().settings);
  readonly storefrontLayout = computed<StorefrontLayout>(() => {
    const settings = this._state().currentTenant?.settings as any;
    return settings?.storefront_layout || { sections: [] };
  });

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

  readonly branding = computed<Nullable<TenantBranding>>(() => {
    const t = this._state().currentTenant;
    if (!t) return null;
    return {
      logo_url: t.logo_url,
      favicon_url: t.favicon_url,
      business_name: t.business_name,
      description: t.description,
      primary_color: t.primary_color,
      secondary_color: t.secondary_color,
      accent_color: t.accent_color,
      font_family: t.font_family,
      layout: t.layout,
    };
  });

  constructor() {
    // Effect: Load tenant when user is authenticated
    effect(() => {
      const userId = this.authService.userId();
      const isAuth = this.authService.isAuthenticated();
      const isAuthInit = this.authService.isInitialized();

      if (isAuthInit && isAuth && userId && !this.initialized()) {
        this.loadUserTenants();
      } else if (isAuthInit && !isAuth) {
        // Clear tenant when logged out
        this.clearTenant();
      }
    });
  }

  // ── Methods ──────────────────────────────────────────────

  async loadUserTenants(): Promise<void> {
    const userId = this.authService.userId();

    // If no user, we are initialized but with no tenants
    if (!userId) {
      this._state.update(s => ({ ...s, initialized: true, loading: false }));
      return;
    }

    this._state.update((s) => ({
      ...s,
      loading: true,
      error: null
    }));

    try {
      const { data, error } = await this.supabase.client
        .from('tenants')
        .select('*')
        .eq('owner_id', userId)
        .is('deleted_at', null);

      if (error) throw error;

      const tenants = data ?? [];

      // Prioritize "real" tenants over seed data
      const sortedTenants = [...tenants].sort((a, b) => {
        const aIsSeed = (a.business_name || '').toLowerCase().includes('seed');
        const bIsSeed = (b.business_name || '').toLowerCase().includes('seed');
        if (aIsSeed && !bIsSeed) return 1;
        if (!aIsSeed && bIsSeed) return -1;
        return 0;
      });

      const savedId = localStorage.getItem('last_tenant_id');
      let selected = tenants.find(t => t.id === savedId);

      // If we have a saved seed store but there is a real store available, switch to the real one
      const firstReal = sortedTenants.find(t => !(t.business_name || '').toLowerCase().includes('seed'));
      if (selected && (selected.business_name || '').toLowerCase().includes('seed') && firstReal) {
        selected = firstReal;
      }

      const selectedTenant = selected || sortedTenants[0] || null;

      this._state.update((s) => ({
        ...s,
        tenants: sortedTenants, // Use sorted list for better UX if we ever show it again
        currentTenant: selectedTenant,
      }));

      if (selectedTenant) {
        if (selectedTenant.id !== savedId) {
          localStorage.setItem('last_tenant_id', selectedTenant.id);
        }
        await this.loadMemberInfo(selectedTenant.id);
        await this.loadTenantSettings(selectedTenant.id);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
      this._state.update((s) => ({
        ...s,
        error: 'Failed to load tenant information',
      }));
    } finally {
      // ALWAYS ensure initialized is set to true, regardless of success or failure
      this._state.update((s) => ({
        ...s,
        loading: false,
        initialized: true,
      }));
    }
  }

  async resolveTenantBySubdomain(subdomain: string): Promise<boolean> {
    this._state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const { data, error } = await this.supabase.client
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        this._state.update(s => ({ ...s, loading: false, currentTenant: null }));
        return false;
      }

      this._state.update(s => ({
        ...s,
        currentTenant: data,
        loading: false,
        initialized: true
      }));

      await this.loadTenantSettings(data.id);
      return true;
    } catch (error) {
      console.error('Error resolving tenant by subdomain:', error);
      this._state.update(s => ({ ...s, loading: false, error: 'Store not found' }));
      return false;
    }
  }

  async setCurrentTenant(tenantId: string): Promise<void> {
    const tenant = this._state().tenants.find((t) => t.id === tenantId);
    if (!tenant) return;
    this._state.update((s) => ({ ...s, currentTenant: tenant }));
    localStorage.setItem('last_tenant_id', tenantId);
    await this.loadMemberInfo(tenantId);
    await this.loadTenantSettings(tenantId);
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
      .maybeSingle();

    this._state.update((s) => ({ ...s, memberInfo: data }));
  }

  async loadTenantSettings(tenantId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }

    this._state.update((s) => ({ ...s, settings: data as TenantSettingItem[] }));
  }

  async updateSetting(key: string, value: unknown, type: 'string' | 'number' | 'boolean' | 'json' = 'string'): Promise<void> {
    const tenantId = this.tenantId();
    if (!tenantId) return;

    const { data, error } = await this.supabase.client
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        setting_key: key,
        setting_value: value,
        setting_type: type,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,setting_key' })
      .select()
      .single();

    if (error) throw error;

    this._state.update((s) => ({
      ...s,
      settings: [
        ...s.settings.filter(item => item.setting_key !== key),
        data as TenantSettingItem
      ]
    }));
  }

  async getSetting<T = unknown>(key: string): Promise<T | null> {
    const setting = this._state().settings.find(s => s.setting_key === key);
    return setting ? (setting.setting_value as T) : null;
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await this.supabase.client
      .from('tenants')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
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

  /**
   * Update business information
   */
  async updateBusinessInfo(info: {
    business_name?: string;
    contact_email?: string;
    contact_phone?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) {
      return { success: false, error: 'No tenant found' };
    }

    this._state.update((s) => ({ ...s, loading: true, error: null }));

    try {
      await this.updateTenant(tenantId, info as any);
      this._state.update((s) => ({ ...s, loading: false }));
      return { success: true };
    } catch (error) {
      console.error('Error updating business info:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update business info';
      this._state.update((s) => ({
        ...s,
        error: errorMessage,
        loading: false,
      }));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update branding colors and logos
   */
  async updateBranding(branding: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    logo_url?: string | null;
    favicon_url?: string | null;
    font_family?: string;
    layout?: 'modern' | 'classic' | 'minimal';
  }): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) {
      return { success: false, error: 'No tenant found' };
    }

    this._state.update((s) => ({ ...s, loading: true, error: null }));

    try {
      await this.updateTenant(tenantId, branding as any);
      this._state.update((s) => ({ ...s, loading: false }));
      return { success: true };
    } catch (error) {
      console.error('Error updating branding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update branding';
      this._state.update((s) => ({
        ...s,
        error: errorMessage,
        loading: false,
      }));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update storefront layout in the settings JSONB column
   */
  async updateStorefrontLayout(layout: StorefrontLayout): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) return { success: false, error: 'No tenant selected' };

    this._state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const currentTenant = this._state().currentTenant;
      const currentSettings = currentTenant?.settings as any || {};

      const updatedSettings = {
        ...currentSettings,
        storefront_layout: layout
      };

      const { data, error } = await this.supabase.client
        .from('tenants')
        .update({ settings: updatedSettings })
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;

      this._state.update(s => ({
        ...s,
        currentTenant: data,
        loading: false
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating storefront layout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update storefront layout';
      this._state.update(s => ({ ...s, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update business address
   */
  async updateAddress(address: {
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) {
      return { success: false, error: 'No tenant found' };
    }

    this._state.update((s) => ({ ...s, loading: true, error: null }));

    try {
      await this.updateTenant(tenantId, address as any);
      this._state.update((s) => ({ ...s, loading: false }));
      return { success: true };
    } catch (error) {
      console.error('Error updating address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update address';
      this._state.update((s) => ({
        ...s,
        error: errorMessage,
        loading: false,
      }));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Refresh tenant data
   */
  async refreshTenant(): Promise<void> {
    await this.loadUserTenants();
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
    if (!tenantId) return { success: false, error: 'Tenant ID required' };

    this._state.update((s) => ({ ...s, loading: true, error: null }));

    try {
      // Soft delete by setting deleted_at
      const { error } = await this.supabase.client
        .from('tenants')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', tenantId);

      if (error) throw error;

      // Remove from local state
      this._state.update((s) => ({
        ...s,
        tenants: s.tenants.filter((t) => t.id !== tenantId),
        currentTenant: null, // Clear current tenant as it's deleted
        memberInfo: null,
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('Error deleting tenant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tenant';
      this._state.update((s) => ({
        ...s,
        error: errorMessage,
        loading: false,
      }));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload branding asset (logo or favicon)
   */
  async uploadBrandingAsset(
    file: File,
    type: 'logo' | 'favicon'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) return { success: false, error: 'No tenant found' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const bucketName = environment.storage.buckets.products;
      const { error: uploadError } = await this.supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = this.supabase.storage.from(bucketName).getPublicUrl(filePath);

      // Update tenant with new URL
      const updateData = type === 'logo' ? { logo_url: data.publicUrl } : { favicon_url: data.publicUrl };
      await this.updateTenant(tenantId, updateData);

      return { success: true, url: data.publicUrl };
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to upload ${type}`
      };
    }
  }

  /**
   * Get all members of the current tenant
   */
  async getMembers(): Promise<TenantMember[]> {
    const tenantId = this.tenantId();
    if (!tenantId) return [];

    const { data, error } = await this.supabase.client
      .from('tenant_members')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data as TenantMember[];
  }

  /**
   * Invite a new member to the tenant
   */
  async inviteMember(email: string, role: TenantRole): Promise<void> {
    const tenantId = this.tenantId();
    if (!tenantId) return;

    // First check if user exists in auth.users by email
    // Note: In a real app, you might use a signup or invitation flow
    // For now, we'll assume we invite by email and the system handles the rest
    const { data: userData, error: userError } = await this.supabase.client
      .from('profiles') // Assuming profiles table linked to auth.users
      .select('id')
      .eq('email', email)
      .single();

    if (userError) throw new Error('User not found. They must have an account first.');

    const { error } = await this.supabase.client
      .from('tenant_members')
      .insert({
        tenant_id: tenantId,
        user_id: userData.id,
        role: role,
        invited_by: this.authService.userId(),
        invited_at: new Date().toISOString(),
        is_active: true,
      });

    if (error) throw error;
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(memberId: string, role: TenantRole): Promise<void> {
    const { error } = await this.supabase.client
      .from('tenant_members')
      .update({
        role: role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId);

    if (error) throw error;
  }

  /**
   * Remove a member from the tenant
   */
  async removeMember(memberId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('tenant_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  clearTenant(): void {
    this._state.set({
      currentTenant: null,
      memberInfo: null,
      tenants: [],
      loading: false,
      error: null,
      initialized: false,
      settings: [],
    });
  }
}
