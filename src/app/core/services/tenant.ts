import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Tenant, TenantMember, TenantSettingItem, TenantBranding, StorefrontLayout, TenantSettings, TenantInvitation, SocialLinks, ThemeTokens, ThemePresetId, StorePageId, PageLayoutConfig, DEFAULT_PAGE_LAYOUTS, getDefaultPageLayout, ThemeDesignSnapshot, CustomThemePreset, ThemeDesignVersion, StoreDesignState, BackgroundPatternOption, BrandGalleryItem } from '@core/models';
import { THEME_PRESETS } from '@core/constants/theme-presets';
import { Nullable } from '@core/types';
import { Supabase } from './supabase';
import { TenantRole } from '@core/enums';
import { AuthService } from './auth';
import { environment } from '@env/environment';
import { Database } from '../types/database.types';

interface TenantState {
  currentTenant: Nullable<Tenant>;
  memberInfo: Nullable<TenantMember>;
  tenants: Tenant[];
  loading: boolean;
  error: Nullable<string>;
  initialized: boolean;
  settings: Record<string, unknown>;
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
    settings: {},
  });

  // ── Computed ─────────────────────────────────────────────
  readonly currentTenant = computed(() => this._state().currentTenant);
  readonly tenant = computed(() => this._state().currentTenant); // Alias for Settings
  readonly tenants = computed(() => this._state().tenants);
  readonly isLoading = computed(() => this._state().loading);
  readonly loading = computed(() => this._state().loading); // Alias for Settings
  readonly error = computed(() => this._state().error);
  readonly initialized = computed(() => this._state().initialized);
  readonly memberRole = computed(() => {
    const memberRole = this._state().memberInfo?.role;
    if (memberRole) return memberRole.toLowerCase() as string;

    const tenant = this._state().currentTenant;
    const userId = this.authService.userId();
    if (tenant && userId && tenant.owner_id === userId) {
      return 'owner';
    }

    return null;
  });
  // Typed alias used by some guards — normalized to lowercase
  readonly currentRole = computed(() => this.memberRole() as TenantRole | null);
  readonly tenantId = computed(() => this._state().currentTenant?.id ?? null);
  readonly businessName = computed(() => this._state().currentTenant?.business_name ?? null);
  readonly settings = computed(() => this._state().settings);
  readonly storeUrl = computed(() => {
    const tenant = this.currentTenant();
    if (!tenant) return '/store';
    if (tenant.custom_domain) {
      const domain = tenant.custom_domain.trim();
      return domain.startsWith('http://') || domain.startsWith('https://')
        ? domain
        : `https://${domain}`;
    }
    // For local development, we need to pass the subdomain as a query parameter
    // if we are not using custom local domains.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('vercel.app')) {
      return `/store?s=${tenant.subdomain}`;
    }
    return `/store`;
  });
  readonly storefrontLayout = computed<StorefrontLayout>(() => {
    const settings = this._state().currentTenant?.settings as Record<string, unknown> | undefined;
    const layout = settings?.['storefront_layout'] as StorefrontLayout | undefined;

    const defaultHomeSections = [
      {
        id: 'default-hero',
        type: 'hero' as const,
        isActive: true,
        content: {
          title: 'Bienvenido a nuestra tienda',
          subtitle: 'Descubre nuestras últimas novedades y colecciones exclusivas.',
          buttonText: 'Comprar ahora',
          buttonLink: '/store/productos',
          alignment: 'center' as const,
          overlayOpacity: 40
        }
      },
      {
        id: 'default-products',
        type: 'product_grid' as const,
        isActive: true,
        content: {
          title: 'Productos Destacados',
          description: 'Descubre nuestros productos más populares.',
          limit: 8
        }
      }
    ];

    const defaultNavigation = [
      { label: 'Productos', url: '/store/productos' },
      { label: 'Sobre Nosotros', url: '/store/nosotros' },
      { label: 'Contacto', url: '/store/contacto' }
    ];

    const homeSections = layout?.sections && layout.sections.length > 0 ? layout.sections : defaultHomeSections;
    const navigation = layout?.navigation || defaultNavigation;

    const pageKeys: StorePageId[] = ['home', 'catalog', 'product_detail', 'cart', 'checkout', 'contact', 'about'];
    const mergedPages: Partial<Record<StorePageId, PageLayoutConfig>> = {};

    for (const key of pageKeys) {
      const savedPage = layout?.pages?.[key];
      const defaultPage = getDefaultPageLayout(key, homeSections);
      if (savedPage) {
        mergedPages[key] = {
          ...defaultPage,
          ...savedPage,
          styles: {
            ...defaultPage.styles,
            ...(savedPage.styles || {})
          },
          sections: savedPage.sections !== undefined ? savedPage.sections : defaultPage.sections
        };
      } else {
        mergedPages[key] = defaultPage;
      }
    }

    // Keep home sections synchronized
    if (mergedPages.home) {
      mergedPages.home.sections = homeSections;
    }

    return {
      sections: homeSections,
      navigation,
      pages: mergedPages
    };
  });

  readonly themeTokens = computed<ThemeTokens>(() => {
    const settings = this._state().currentTenant?.settings as Record<string, unknown> | undefined;
    const presetId = (settings?.['theme_id'] as ThemePresetId) || 'minimalist';
    const baseTokens = THEME_PRESETS[presetId]?.tokens || THEME_PRESETS.minimalist.tokens;
    const savedTokens = settings?.['theme_config'] as ThemeTokens | undefined;

    if (savedTokens) {
      return {
        ...baseTokens,
        ...savedTokens,
        custom_css: savedTokens.custom_css ?? (settings?.['custom_css'] as string) ?? '',
        font_button: savedTokens.font_button || savedTokens.font_body || baseTokens.font_button || baseTokens.font_body || '"Inter", sans-serif',
        font_weight_heading: savedTokens.font_weight_heading || baseTokens.font_weight_heading || '700',
        font_size_base: savedTokens.font_size_base || baseTokens.font_size_base || '16px',
        line_height: savedTokens.line_height || baseTokens.line_height || '1.5',
        letter_spacing: savedTokens.letter_spacing || baseTokens.letter_spacing || '0em',
      };
    }

    const t = this._state().currentTenant;
    if (!t) return baseTokens;

    return {
      ...baseTokens,
      custom_css: (settings?.['custom_css'] as string) || '',
      font_heading: t.font_family || baseTokens.font_heading,
      font_body: t.font_family || baseTokens.font_body,
      font_button: t.font_family || baseTokens.font_button || baseTokens.font_body,
      font_weight_heading: baseTokens.font_weight_heading || '700',
      font_size_base: baseTokens.font_size_base || '16px',
      line_height: baseTokens.line_height || '1.5',
      letter_spacing: baseTokens.letter_spacing || '0em',
      colors: {
        ...baseTokens.colors,
        primary: t.primary_color || baseTokens.colors.primary,
        secondary: t.secondary_color || baseTokens.colors.secondary,
        accent: t.accent_color || baseTokens.colors.accent,
        background: t.background_color || baseTokens.colors.background,
        header: t.header_color || baseTokens.colors.header,
        footer: t.footer_color || baseTokens.colors.footer,
      }
    };
  });

  readonly isOwner = computed(
    () => this._state().memberInfo?.role?.toLowerCase() === TenantRole.Owner
  );
  readonly isAdmin = computed(() =>
    [TenantRole.Owner, TenantRole.Admin].includes(
      this._state().memberInfo?.role?.toLowerCase() as TenantRole
    )
  );
  readonly canEdit = computed(() =>
    [TenantRole.Owner, TenantRole.Admin, TenantRole.Editor].includes(
      this._state().memberInfo?.role?.toLowerCase() as TenantRole
    )
  );

  readonly isAdminOrOwner = computed(() =>
    [TenantRole.Owner, TenantRole.Admin].includes(
      this._state().memberInfo?.role?.toLowerCase() as TenantRole
    )
  );

  readonly branding = computed<Nullable<TenantBranding>>(() => {
    const t = this._state().currentTenant;
    if (!t) return null;
    return {
      logo_url: t.logo_url,
      logo_dark_url: t.logo_dark_url || (t.settings?.['logo_dark_url'] as string) || null,
      favicon_url: t.favicon_url,
      social_share_image_url: t.social_share_image_url || (t.settings?.['social_share_image_url'] as string) || null,
      main_banner_url: t.main_banner_url || (t.settings?.['main_banner_url'] as string) || null,
      background_image_url: t.background_image_url || (t.settings?.['background_image_url'] as string) || null,
      background_pattern: t.background_pattern || (t.settings?.['background_pattern'] as BackgroundPatternOption) || 'none',
      promo_video_url: t.promo_video_url || (t.settings?.['promo_video_url'] as string) || null,
      brand_gallery: t.brand_gallery || (t.settings?.['brand_gallery'] as BrandGalleryItem[]) || [],
      business_name: t.business_name,
      description: t.description ?? null,
      primary_color: t.primary_color,
      secondary_color: t.secondary_color,
      accent_color: t.accent_color,
      font_family: t.font_family,
      background_color: t.background_color,
      header_color: t.header_color,
      footer_color: t.footer_color,
      layout: t.layout,
      social_links: t.social_links,
    };
  });

  readonly currency = computed(() => {
    const currency = this._state().currentTenant?.settings?.['currency'];
    return typeof currency === 'string' && currency.length === 3 ? currency : 'USD';
  });

  readonly timezone = computed(() => {
    const timezone = this._state().currentTenant?.settings?.['timezone'];
    return typeof timezone === 'string' && timezone.length > 0 ? timezone : 'America/New_York';
  });

  // ── Store Design System State (Draft, Published, Presets, Versions) ──
  readonly storeDesignState = computed<StoreDesignState>(() => {
    const settings = this._state().currentTenant?.settings as Record<string, unknown> | undefined;
    const existing = settings?.['store_design_state'] as StoreDesignState | undefined;

    const publishedTokens = this.themeTokens();
    const publishedLayout = this.storefrontLayout();
    const branding = this.branding();
    const defaultSnapshot: ThemeDesignSnapshot = {
      theme_tokens: publishedTokens,
      storefront_layout: publishedLayout,
      branding: branding ? {
        logo_url: branding.logo_url,
        logo_dark_url: branding.logo_dark_url,
        main_banner_url: branding.main_banner_url,
        background_image_url: branding.background_image_url,
        background_pattern: branding.background_pattern,
        promo_video_url: branding.promo_video_url,
      } : undefined,
    };

    if (!existing) {
      return {
        draft: structuredClone(defaultSnapshot),
        published: structuredClone(defaultSnapshot),
        published_at: this._state().currentTenant?.updated_at || new Date().toISOString(),
        saved_presets: [],
        versions: [
          {
            id: 'v-initial',
            version_number: 1,
            name: 'Versión Inicial Publicada',
            notes: 'Configuración base de la tienda.',
            published_at: this._state().currentTenant?.created_at || new Date().toISOString(),
            snapshot: structuredClone(defaultSnapshot)
          }
        ],
        next_version_number: 2,
      };
    }

    return {
      draft: existing.draft || structuredClone(defaultSnapshot),
      published: existing.published || structuredClone(defaultSnapshot),
      published_at: existing.published_at || this._state().currentTenant?.updated_at || new Date().toISOString(),
      saved_presets: existing.saved_presets || [],
      versions: existing.versions || [],
      next_version_number: existing.next_version_number || ((existing.versions?.length || 0) + 1),
    };
  });

  readonly draftThemeTokens = computed<ThemeTokens>(() => {
    return this.storeDesignState().draft?.theme_tokens || this.themeTokens();
  });

  readonly draftStorefrontLayout = computed<StorefrontLayout>(() => {
    return (this.storeDesignState().draft?.storefront_layout as StorefrontLayout) || this.storefrontLayout();
  });

  readonly publishedThemeTokens = computed<ThemeTokens>(() => {
    return this.storeDesignState().published?.theme_tokens || this.themeTokens();
  });

  readonly publishedStorefrontLayout = computed<StorefrontLayout>(() => {
    return (this.storeDesignState().published?.storefront_layout as StorefrontLayout) || this.storefrontLayout();
  });

  readonly savedCustomPresets = computed<CustomThemePreset[]>(() => {
    return this.storeDesignState().saved_presets || [];
  });

  readonly designVersions = computed<ThemeDesignVersion[]>(() => {
    return this.storeDesignState().versions || [];
  });

  readonly hasUnpublishedChanges = computed<boolean>(() => {
    const state = this.storeDesignState();
    if (!state.draft || !state.published) return false;
    const draftTokensStr = JSON.stringify(state.draft.theme_tokens);
    const pubTokensStr = JSON.stringify(state.published.theme_tokens);
    const draftLayoutStr = JSON.stringify(state.draft.storefront_layout);
    const pubLayoutStr = JSON.stringify(state.published.storefront_layout);
    return draftTokensStr !== pubTokensStr || draftLayoutStr !== pubLayoutStr;
  });


  constructor() {
    // Effect: Load tenant when user is authenticated
    effect(() => {
      const userId = this.authService.userId();
      const isAuth = this.authService.isAuthenticated();
      const isAuthInit = this.authService.isInitialized();

      // If we are on the storefront, we don't want the staff-auth logic to clear
      // the tenant that was resolved via subdomain.
      const isStorefront = window.location.pathname.startsWith('/store');

      if (isAuthInit && isAuth && userId && !this.initialized()) {
        this.loadUserTenants();
      } else if (isAuthInit && !isAuth && !isStorefront) {
        // Clear tenant when logged out, but ONLY if not on storefront
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
      const [membershipsRes, ownedTenantsRes] = await Promise.all([
        this.supabase.client
          .from('tenant_members')
          .select('*, tenant:tenants(*)')
          .eq('user_id', userId)
          .eq('is_active', true),
        this.supabase.client
          .from('tenants')
          .select('*')
          .eq('owner_id', userId)
          .is('deleted_at', null)
      ]);

      if (membershipsRes.error) {
        console.error('Error loading memberships:', membershipsRes.error);
      }

      if (ownedTenantsRes.error) {
        console.error('Error loading owned stores:', ownedTenantsRes.error);
      }

      // Collect all tenants from both sources
      const membershipData = (membershipsRes.data as (TenantMember & { tenant: Tenant })[]) ?? [];
      const ownedTenants = (ownedTenantsRes.data as Tenant[]) ?? [];

      // Map to unique tenants
      const tenantMap = new Map<string, Tenant>();

      // Add from memberships first
      membershipData.forEach(m => {
        if (m.tenant && !m.tenant.deleted_at) {
          tenantMap.set(m.tenant.id, m.tenant);
        }
      });

      // Add from owned tenants (might include some missing from membershipData due to RLS)
      ownedTenants.forEach(t => {
        if (!tenantMap.has(t.id)) {
          tenantMap.set(t.id, t);
        }
      });

      const allTenants = Array.from(tenantMap.values());

      const sortedTenants = [...allTenants].sort((a, b) => {
        const aIsSeed = (a.business_name || '').toLowerCase().includes('seed');
        const bIsSeed = (b.business_name || '').toLowerCase().includes('seed');
        if (aIsSeed && !bIsSeed) return 1;
        if (!aIsSeed && bIsSeed) return -1;
        return 0;
      });

      const savedId = localStorage.getItem('last_tenant_id');
      let selectedMembership = membershipData.find(m => m.tenant?.id === savedId);

      const firstRealMembership = membershipData
        .filter(m => m.tenant && !(m.tenant.business_name || '').toLowerCase().includes('seed'))
        .sort((a, b) => (a.tenant.created_at > b.tenant.created_at ? -1 : 1))[0];

      if (selectedMembership && (selectedMembership.tenant?.business_name || '').toLowerCase().includes('seed') && firstRealMembership) {
        selectedMembership = firstRealMembership;
      }

      const finalMembership = selectedMembership || membershipData[0] || null;

      const isStorefront = window.location.pathname.startsWith('/store');
      const existingTenant = this.currentTenant();

      let selectedTenant = (isStorefront && existingTenant) ? existingTenant : (finalMembership?.tenant || null);

      if (!selectedTenant && sortedTenants.length > 0) {
        selectedTenant = sortedTenants[0];
      }

      this._state.update((s) => ({
        ...s,
        tenants: sortedTenants,
        currentTenant: selectedTenant,
        memberInfo: finalMembership ? {
          ...finalMembership,
          tenant: undefined
        } : null
      }));

      if (selectedTenant) {
        if (selectedTenant.id !== savedId) {
          localStorage.setItem('last_tenant_id', selectedTenant.id);
        }
        // Load settings
        await this.loadTenantSettings(selectedTenant.id);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
      this._state.update((s) => ({
        ...s,
        error: 'Failed to load tenant information',
      }));
    } finally {
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
        currentTenant: data as Tenant,
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

  async resolveTenantByDomain(domain: string): Promise<boolean> {
    this._state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const { data, error } = await this.supabase.client
        .from('tenants')
        .select('*')
        .eq('custom_domain', domain)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        this._state.update(s => ({ ...s, loading: false, currentTenant: null }));
        return false;
      }

      this._state.update(s => ({
        ...s,
        currentTenant: data as Tenant,
        loading: false,
        initialized: true
      }));

      await this.loadTenantSettings(data.id);
      return true;
    } catch (error) {
      console.error('Error resolving tenant by domain:', error);
      this._state.update(s => ({ ...s, loading: false, error: 'Store not found' }));
      return false;
    }
  }

  /**
   * Set current active tenant
   */
  async setCurrentTenant(tenantId: string): Promise<void> {
    const tenant = this._state().tenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    const userId = this.authService.userId();

    let memberInfo: Nullable<TenantMember> = null;
    if (userId) {
      const { data } = await this.supabase.client
        .from('tenant_members')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        memberInfo = data as TenantMember;
      } else if (tenant.owner_id === userId) {
        memberInfo = {
          id: 'owner',
          tenant_id: tenant.id,
          user_id: userId,
          role: TenantRole.Owner,
          is_active: true,
          created_at: tenant.created_at,
          permissions: [],
          invited_at: null,
          updated_at: null,
        };
      }
    }

    this._state.update((s) => ({
      ...s,
      currentTenant: tenant,
      memberInfo,
      settings: (tenant.settings as Record<string, unknown>) || {},
    }));
  }

  /**
   * Load tenant by slug (for public store)
   */
  async loadTenantBySlug(slug: string): Promise<Tenant | null> {
    this._state.update((s) => ({ ...s, loading: true, error: null }));

    try {
      const { data, error } = await this.supabase.client
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      this._state.update((s) => ({
        ...s,
        currentTenant: data as Tenant,
        loading: false,
        settings: (data?.settings as Record<string, unknown>) || {},
      }));

      return data as Tenant;
    } catch (error) {
      console.error('Error loading tenant by slug:', error);
      this._state.update((s) => ({
        ...s,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return null;
    }
  }

  /**
   * Load tenant by custom domain
   */
  async loadTenantByDomain(domain: string): Promise<Tenant | null> {
    this._state.update((s) => ({ ...s, loading: true, error: null }));

    try {
      const { data, error } = await this.supabase.client
        .from('tenants')
        .select('*')
        .eq('custom_domain', domain)
        .single();

      if (error) throw error;

      this._state.update((s) => ({
        ...s,
        currentTenant: data as Tenant,
        loading: false,
        settings: (data?.settings as Record<string, unknown>) || {},
      }));

      return data as Tenant;
    } catch (error) {
      console.error('Error loading tenant by domain:', error);
      this._state.update((s) => ({
        ...s,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return null;
    }
  }

  /**
   * Load member info for a tenant
   */
  async loadMemberInfo(tenantId: string, userId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('tenant_members')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    this._state.update((s) => ({ ...s, memberInfo: (data as TenantMember) || null }));
  }

  async loadTenantSettings(tenantId: string): Promise<void> {
    const tenant = this._state().tenants.find(t => t.id === tenantId) || this._state().currentTenant;
    if (!tenant) return;

    this._state.update((s) => ({ ...s, settings: (tenant.settings as Record<string, unknown>) || {} }));
  }

  async updateSetting(key: string, value: unknown, type: 'string' | 'number' | 'boolean' | 'json' = 'string'): Promise<void> {
    const tenantId = this.tenantId();
    if (!tenantId) return;

    const currentSettings = this._state().settings || {};
    const updatedSettings = { ...currentSettings, [key]: value };

    const { data, error } = await this.supabase.client
      .from('tenants')
      .update({
        settings: updatedSettings as unknown as Database['public']['Tables']['tenants']['Update']['settings'],
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;

    this._state.update((s) => ({
      ...s,
      currentTenant: data as unknown as Tenant,
      settings: updatedSettings
    }));
  }

  async getSetting<T = unknown>(key: string): Promise<T | null> {
    const settings = this._state().settings;
    return (settings[key] as T) ?? null;
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await this.supabase.client
      .from('tenants')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      } as unknown as Database['public']['Tables']['tenants']['Update'])
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;

    this._state.update((s) => ({
      ...s,
      currentTenant: data as unknown as Tenant,
      tenants: s.tenants.map((t) => (t.id === tenantId ? (data as unknown as Tenant) : t)),
      settings: updates.settings
        ? (data as unknown as Tenant).settings as Record<string, unknown>
        : s.settings,
    }));

    return data as unknown as Tenant;
  }

  async verifyCustomDomain(domain: string): Promise<{ status: 'verified' | 'error'; reason?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) throw new Error('No tenant found');

    const { data, error } = await this.supabase.client.functions.invoke('verify-domain', {
      body: { tenant_id: tenantId, domain },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    const currentTenant = this._state().currentTenant;
    if (currentTenant) {
      const updatedSettings = {
        ...currentTenant.settings,
        custom_domain_status: data.status,
        custom_domain_last_checked_at: new Date().toISOString(),
        custom_domain_error: data.reason || null,
      };
      this._state.update(state => ({
        ...state,
        currentTenant: { ...currentTenant, settings: updatedSettings },
      }));
    }

    return data as { status: 'verified' | 'error'; reason?: string };
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
      await this.updateTenant(tenantId, info);
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
   * Update branding colors, logos, and brand assets
   */
  async updateBranding(branding: Partial<TenantBranding> & { [key: string]: unknown }): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) {
      return { success: false, error: 'No tenant found' };
    }

    this._state.update((s) => ({ ...s, loading: true, error: null }));

    try {
      const {
        logo_dark_url,
        social_share_image_url,
        main_banner_url,
        background_image_url,
        background_pattern,
        promo_video_url,
        brand_gallery,
        social_links,
        ...tenantBranding
      } = branding;
      const currentSettings = (this._state().currentTenant?.settings as Record<string, unknown>) || {};
      const settings = {
        ...currentSettings,
        logo_dark_url,
        social_share_image_url,
        main_banner_url,
        background_image_url,
        background_pattern,
        promo_video_url,
        brand_gallery,
        social_links,
      };

      await this.updateTenant(tenantId, { ...tenantBranding, settings });
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
      const currentSettings = (currentTenant?.settings as Record<string, unknown>) || {};

      const updatedSettings = {
        ...currentSettings,
        storefront_layout: layout
      };

      const { data, error } = await this.supabase.client
        .from('tenants')
        .update({
          settings: updatedSettings as unknown as Database['public']['Tables']['tenants']['Update']['settings'],
          status: 'active' // Activate tenant when layout is saved
        })
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;

      this._state.update(s => ({
        ...s,
        currentTenant: data as unknown as Tenant,
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

  getPageLayout(pageId: StorePageId): PageLayoutConfig {
    const layout = this.publishedStorefrontLayout();
    if (layout?.pages?.[pageId]) {
      return layout.pages[pageId]!;
    }
    return getDefaultPageLayout(pageId, layout?.sections);
  }

  async updatePageLayout(pageId: StorePageId, pageConfig: PageLayoutConfig): Promise<{ success: boolean; error?: string }> {
    const currentLayout = this.storefrontLayout();
    const updatedPages = {
      ...(currentLayout.pages || {}),
      [pageId]: pageConfig
    };

    const updatedLayout: StorefrontLayout = {
      ...currentLayout,
      pages: updatedPages,
      sections: pageId === 'home' ? pageConfig.sections : currentLayout.sections
    };

    return this.updateStorefrontLayout(updatedLayout);
  }

  /**
   * Update theme tokens and preset configuration in settings and tenant columns
   */
  async updateThemeTokens(tokens: ThemeTokens): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) return { success: false, error: 'No tenant selected' };

    this._state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const currentTenant = this._state().currentTenant;
      const currentSettings = (currentTenant?.settings as Record<string, unknown>) || {};

      const updatedSettings = {
        ...currentSettings,
        theme_config: tokens,
        theme_id: tokens.theme_id
      };

      const brandingUpdates: Partial<Tenant> = {
        primary_color: tokens.colors.primary,
        secondary_color: tokens.colors.secondary,
        accent_color: tokens.colors.accent,
        background_color: tokens.colors.background,
        header_color: tokens.colors.header,
        footer_color: tokens.colors.footer,
        font_family: tokens.font_heading,
        settings: updatedSettings
      };

      await this.updateTenant(tenantId, brandingUpdates);
      this._state.update(s => ({ ...s, loading: false }));
      return { success: true };
    } catch (error: any) {
      console.error('Error updating theme tokens:', error);
      const errorMessage = error?.message || error?.details || (typeof error === 'string' ? error : 'Failed to update theme tokens');
      this._state.update(s => ({ ...s, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  // ── Store Design System Methods (Drafts, Publish, Presets, Rollback) ──

  /**
   * Save the current draft design without publishing to the live store
   */
  async saveDraft(snapshot: ThemeDesignSnapshot): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) return { success: false, error: 'No hay tienda seleccionada' };

    this._state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const currentState = this.storeDesignState();
      const updatedState: StoreDesignState = {
        ...currentState,
        draft: structuredClone(snapshot),
      };

      await this.updateSetting('store_design_state', updatedState, 'json');
      this._state.update(s => ({ ...s, loading: false }));
      return { success: true };
    } catch (error: any) {
      console.error('Error saving store draft:', error);
      const errorMessage = error?.message || 'Error al guardar el borrador de diseño';
      this._state.update(s => ({ ...s, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Publish the current draft design to the live store, creating a version snapshot
   */
  async publishDesign(versionName?: string, notes?: string): Promise<{ success: boolean; error?: string; version?: ThemeDesignVersion }> {
    const tenantId = this.tenantId();
    if (!tenantId) return { success: false, error: 'No hay tienda seleccionada' };

    this._state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const currentState = this.storeDesignState();
      const currentDraft = currentState.draft;
      const nextVersionNum = currentState.next_version_number || ((currentState.versions?.length || 0) + 1);
      const publishedAt = new Date().toISOString();

      const newVersion: ThemeDesignVersion = {
        id: `v-${nextVersionNum}-${Date.now()}`,
        version_number: nextVersionNum,
        name: versionName?.trim() || `Versión ${nextVersionNum}`,
        notes: notes?.trim() || undefined,
        published_at: publishedAt,
        published_by: this.authService.user()?.email || undefined,
        snapshot: structuredClone(currentDraft),
      };

      const updatedVersions = [newVersion, ...(currentState.versions || [])].slice(0, 30); // Keep last 30 versions

      const updatedState: StoreDesignState = {
        ...currentState,
        draft: structuredClone(currentDraft),
        published: structuredClone(currentDraft),
        published_at: publishedAt,
        versions: updatedVersions,
        next_version_number: nextVersionNum + 1,
      };

      const currentTenant = this._state().currentTenant;
      const currentSettings = (currentTenant?.settings as Record<string, unknown>) || {};

      const updatedSettings: Record<string, unknown> = {
        ...currentSettings,
        store_design_state: updatedState,
        theme_config: currentDraft.theme_tokens,
        theme_id: currentDraft.theme_tokens?.theme_id || 'custom',
        storefront_layout: currentDraft.storefront_layout,
        custom_css: currentDraft.theme_tokens?.custom_css || '',
      };

      const brandingUpdates: Partial<Tenant> = {
        settings: updatedSettings,
        status: 'active',
      };

      if (currentDraft.theme_tokens?.colors) {
        brandingUpdates.primary_color = currentDraft.theme_tokens.colors.primary;
        brandingUpdates.secondary_color = currentDraft.theme_tokens.colors.secondary;
        brandingUpdates.accent_color = currentDraft.theme_tokens.colors.accent;
        brandingUpdates.background_color = currentDraft.theme_tokens.colors.background;
        brandingUpdates.header_color = currentDraft.theme_tokens.colors.header;
        brandingUpdates.footer_color = currentDraft.theme_tokens.colors.footer;
      }
      if (currentDraft.theme_tokens?.font_heading) {
        brandingUpdates.font_family = currentDraft.theme_tokens.font_heading;
      }
      if (currentDraft.branding) {
        if (currentDraft.branding.logo_url !== undefined) brandingUpdates.logo_url = currentDraft.branding.logo_url;
        if (currentDraft.branding.logo_dark_url !== undefined) updatedSettings['logo_dark_url'] = currentDraft.branding.logo_dark_url;
        if (currentDraft.branding.main_banner_url !== undefined) updatedSettings['main_banner_url'] = currentDraft.branding.main_banner_url;
        if (currentDraft.branding.background_image_url !== undefined) updatedSettings['background_image_url'] = currentDraft.branding.background_image_url;
        if (currentDraft.branding.background_pattern !== undefined) updatedSettings['background_pattern'] = currentDraft.branding.background_pattern;
        if (currentDraft.branding.promo_video_url !== undefined) updatedSettings['promo_video_url'] = currentDraft.branding.promo_video_url;
      }

      await this.updateTenant(tenantId, brandingUpdates);
      this._state.update(s => ({ ...s, loading: false }));
      return { success: true, version: newVersion };
    } catch (error: any) {
      console.error('Error publishing store design:', error);
      const errorMessage = error?.message || 'Error al publicar los cambios de la tienda';
      this._state.update(s => ({ ...s, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Revert the draft to match the currently published design
   */
  async revertDraftToPublished(): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) return { success: false, error: 'No hay tienda seleccionada' };

    this._state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const currentState = this.storeDesignState();
      const updatedState: StoreDesignState = {
        ...currentState,
        draft: structuredClone(currentState.published),
      };

      await this.updateSetting('store_design_state', updatedState, 'json');
      this._state.update(s => ({ ...s, loading: false }));
      return { success: true };
    } catch (error: any) {
      console.error('Error reverting draft to published:', error);
      const errorMessage = error?.message || 'Error al restablecer el borrador al diseño publicado';
      this._state.update(s => ({ ...s, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Save the current design as a reusable custom preset
   */
  async saveCurrentAsPreset(name: string, description?: string, snapshot?: ThemeDesignSnapshot): Promise<{ success: boolean; error?: string; preset?: CustomThemePreset }> {
    const tenantId = this.tenantId();
    if (!tenantId) return { success: false, error: 'No hay tienda seleccionada' };

    const targetSnapshot = snapshot || this.storeDesignState().draft;
    if (!targetSnapshot) return { success: false, error: 'No hay diseño disponible para guardar' };

    this._state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const currentState = this.storeDesignState();
      const now = new Date().toISOString();

      const newPreset: CustomThemePreset = {
        id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        description: description?.trim() || undefined,
        created_at: now,
        updated_at: now,
        snapshot: structuredClone(targetSnapshot),
        preview_colors: targetSnapshot.theme_tokens?.colors ? {
          primary: targetSnapshot.theme_tokens.colors.primary,
          secondary: targetSnapshot.theme_tokens.colors.secondary,
          background: targetSnapshot.theme_tokens.colors.background,
          accent: targetSnapshot.theme_tokens.colors.accent,
        } : undefined,
      };

      const updatedPresets = [...(currentState.saved_presets || []), newPreset];
      const updatedState: StoreDesignState = {
        ...currentState,
        saved_presets: updatedPresets,
      };

      await this.updateSetting('store_design_state', updatedState, 'json');
      this._state.update(s => ({ ...s, loading: false }));
      return { success: true, preset: newPreset };
    } catch (error: any) {
      console.error('Error saving custom preset:', error);
      const errorMessage = error?.message || 'Error al guardar el preset personalizado';
      this._state.update(s => ({ ...s, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Duplicate an existing custom preset
   */
  async duplicatePreset(presetId: string): Promise<{ success: boolean; error?: string; preset?: CustomThemePreset }> {
    const currentState = this.storeDesignState();
    const sourcePreset = currentState.saved_presets?.find(p => p.id === presetId);
    if (!sourcePreset) return { success: false, error: 'Preset no encontrado' };

    return this.saveCurrentAsPreset(
      `${sourcePreset.name} (Copia)`,
      sourcePreset.description ? `Copia de: ${sourcePreset.description}` : 'Diseño duplicado',
      sourcePreset.snapshot
    );
  }

  /**
   * Delete a custom preset
   */
  async deleteCustomPreset(presetId: string): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) return { success: false, error: 'No hay tienda seleccionada' };

    this._state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const currentState = this.storeDesignState();
      const updatedPresets = (currentState.saved_presets || []).filter(p => p.id !== presetId);
      const updatedState: StoreDesignState = {
        ...currentState,
        saved_presets: updatedPresets,
      };

      await this.updateSetting('store_design_state', updatedState, 'json');
      this._state.update(s => ({ ...s, loading: false }));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting custom preset:', error);
      const errorMessage = error?.message || 'Error al eliminar el preset';
      this._state.update(s => ({ ...s, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Restore a previous version from the version history into the draft (with optional auto-publish)
   */
  async restoreVersion(versionId: string, autoPublish: boolean = false): Promise<{ success: boolean; error?: string }> {
    const currentState = this.storeDesignState();
    const version = currentState.versions?.find(v => v.id === versionId);
    if (!version) return { success: false, error: 'Versión no encontrada en el historial' };

    const saveResult = await this.saveDraft(version.snapshot);
    if (!saveResult.success) return saveResult;

    if (autoPublish) {
      return this.publishDesign(`Restaurado: ${version.name}`, `Restaurado desde versión anterior #${version.version_number}`);
    }

    return { success: true };
  }

  /**
   * Update address info
   */
  async updateAddress(address: Partial<Tenant>): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) {
      return { success: false, error: 'No tenant found' };
    }

    this._state.update((s) => ({ ...s, loading: true, error: null }));

    try {
      await this.updateTenant(tenantId, address);
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
   * Upload branding asset (logo, logo_dark, favicon, social_share, main_banner, background, etc.)
   */
  async uploadBrandingAsset(
    file: File,
    type: 'logo' | 'logo_dark' | 'favicon' | 'social_share' | 'main_banner' | 'background' | 'video' | 'media'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) return { success: false, error: 'No tenant found' };

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${tenantId}/${type}-${Date.now()}-${cleanName}`;

      const bucketName = environment.storage.buckets.media || environment.storage.buckets.products || 'product-images';
      const { error: uploadError } = await this.supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = this.supabase.storage.from(bucketName).getPublicUrl(filePath);

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
   * List all media assets belonging to the current tenant in storage
   */
  async listTenantMedia(): Promise<{ name: string; url: string; created_at?: string; size?: number; type: string }[]> {
    const tenantId = this.tenantId();
    if (!tenantId) return [];

    try {
      const bucketName = environment.storage.buckets.media || environment.storage.buckets.products || 'product-images';
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .list(tenantId, { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });

      if (error || !data) return [];

      return data.map(item => {
        const fullPath = `${tenantId}/${item.name}`;
        const { data: urlData } = this.supabase.storage.from(bucketName).getPublicUrl(fullPath);
        const ext = item.name.split('.').pop()?.toLowerCase() || '';
        const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
        return {
          name: item.name,
          url: urlData.publicUrl,
          created_at: item.created_at,
          size: (item.metadata as Record<string, any>)?.['size'],
          type: isVideo ? 'video' : 'image',
        };
      });
    } catch (err) {
      console.error('Error listing tenant media:', err);
      return [];
    }
  }

  /**
   * Delete a tenant media asset from storage
   */
  async deleteTenantMedia(fileName: string): Promise<{ success: boolean; error?: string }> {
    const tenantId = this.tenantId();
    if (!tenantId) return { success: false, error: 'No tenant found' };

    try {
      const bucketName = environment.storage.buckets.media || environment.storage.buckets.products || 'product-images';
      const filePath = `${tenantId}/${fileName}`;
      const { error } = await this.supabase.storage.from(bucketName).remove([filePath]);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error deleting media:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete media' };
    }
  }

  // ── Member Management Methods ──

  /**
   * Get all members for the current tenant
   */
  async getMembers(): Promise<TenantMember[]> {
    const tenantId = this.tenantId();
    if (!tenantId) return [];

    const { data, error } = await this.supabase.client.from('vw_tenant_members')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return (data as unknown as TenantMember[]) || [];
  }

  /**
   * Invite a new member to the tenant
   */
  async inviteMember(email: string, role: TenantRole): Promise<void> {
    const tenantId = this.tenantId();
    if (!tenantId) return;

    const cleanEmail = (email ?? '').trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Invalid email');
    }

    const { data: existingInvite } = await this.supabase.client.from('tenant_invitations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', cleanEmail)
      .eq('status', 'pending');

    if (existingInvite && existingInvite.length > 0) {
      throw new Error('A pending invitation already exists for this email.');
    }

    const { data: insertedInvite, error: insertError } = await this.supabase.client.from('tenant_invitations')
      .insert({
        tenant_id: tenantId,
        email: cleanEmail,
        role: role,
        status: 'pending',
        invited_by: this.authService.userId()
      })
      .select('token')
      .single();

    if (insertError) throw insertError;
    if (!insertedInvite?.token) throw new Error('Could not generate invitation token.');

    const token: string = insertedInvite.token;
    const inviteLink = `${window.location.origin}/accept-invite?token=${token}`;
    const storeName = this.businessName() ?? 'Venti Store';
    const inviterEmail = this.authService.userEmail() ?? 'An administrator';

    let userExists = false;
    try {
      const { data, error } = await this.supabase.client.rpc('check_user_exists', { p_email: cleanEmail });
      if (!error && data !== null) {
        userExists = !!data;
      }
    } catch (e) {
      console.warn('Could not check if user exists, defaulting to false:', e);
    }

    try {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      const supabaseUrl: string = environment.supabase.url;
      const supabaseKey: string = environment.supabase.anonKey;

      const res = await fetch(`${supabaseUrl}/functions/v1/send-invitation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          to_email: cleanEmail,
          store_name: storeName,
          invited_by_email: inviterEmail,
          role: role,
          invite_link: inviteLink,
          user_exists: userExists,
          tenant_id: tenantId,
        })
      });

      if (!res.ok) {
        const body = await res.text();
        console.warn(`Email Edge Fn returned ${res.status} (invitation created):`, body);
      }
    } catch (emailErr) {
      console.warn('Email error (invitation created anyway):', emailErr);
    }
  }

  /**
   * Get pending invitations
   */
  async getInvitations(): Promise<TenantInvitation[]> {
    const tenantId = this.tenantId();
    if (!tenantId) return [];

    const { data, error } = await this.supabase.client.from('tenant_invitations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending');

    if (error) throw error;
    return (data as unknown as TenantInvitation[]) || [];
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
      settings: {},
    });
  }
}
