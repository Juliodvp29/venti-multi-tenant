import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Tenant, TenantMember, TenantSettingItem } from '@core/models';
import { Nullable } from '@core/types';
import { Supabase } from './supabase';
import { TenantRole } from '@core/enums';
import { AuthService } from './auth';

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

  readonly branding = computed(() => {
    const t = this._state().currentTenant;
    if (!t) return null;
    return {
      logo_url: t.logo_url,
      favicon_url: t.favicon_url,
      primary_color: t.primary_color,
      secondary_color: t.secondary_color,
      accent_color: t.accent_color,
      font_family: t.font_family,
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
    if (!userId) return;

    this._state.update((s) => ({ ...s, loading: true, error: null }));

    try {
      const { data, error } = await this.supabase.client
        .from('tenants')
        .select('*')
        .eq('owner_id', userId)
        .is('deleted_at', null);

      if (error) throw error;

      this._state.update((s) => ({
        ...s,
        tenants: data ?? [],
        // Auto-select first tenant
        currentTenant: data?.[0] ?? null,
        loading: false,
        initialized: true,
      }));

      if (data?.[0]) {
        await this.loadMemberInfo(data[0].id);
        await this.loadTenantSettings(data[0].id);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
      this._state.update((s) => ({
        ...s,
        error: 'Failed to load tenant information',
        loading: false,
        initialized: true,
      }));
    }
  }

  async setCurrentTenant(tenantId: string): Promise<void> {
    const tenant = this._state().tenants.find((t) => t.id === tenantId);
    if (!tenant) return;
    this._state.update((s) => ({ ...s, currentTenant: tenant }));
    this._state.update((s) => ({ ...s, currentTenant: tenant }));
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
      .single();

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

      const { error: uploadError } = await this.supabase.storage
        .from('branding')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = this.supabase.storage.from('branding').getPublicUrl(filePath);

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
