import { ChangeDetectionStrategy, Component, signal, computed, inject, effect, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsGeneral } from './components/settings-general';
import { SettingsBranding } from './components/settings-branding';
import { SettingsAddress } from './components/settings-address';
import { SettingsDangerZone } from './components/settings-danger-zone';
import { StorePreview } from './components/store-preview';
import { TenantService } from '@core/services/tenant';
import { SettingsShippingTaxes } from './components/settings-shipping-taxes';
import { SettingsStorefront } from './components/settings-storefront/settings-storefront';
import { SettingsCommissions } from './components/settings-commissions/settings-commissions';
import { SettingsTheme } from './components/settings-theme/settings-theme';
import { SettingsDesignPresets } from './components/settings-design-presets/settings-design-presets';
import { ToastService } from '@core/services/toast';
import { PreviewSyncService } from '@core/services/preview-sync.service';

import { StorefrontLayout, ThemeTokens, ThemeDesignSnapshot } from '@core/models';

export interface PreviewData {
  business_name: string;
  logo_url: string | null;
  logo_dark_url?: string | null;
  social_share_image_url?: string | null;
  main_banner_url?: string | null;
  background_image_url?: string | null;
  background_pattern?: string;
  promo_video_url?: string | null;
  brand_gallery?: any[];
  social_links?: any;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  header_color: string;
  footer_color: string;
  currency: string;
  timezone: string;
  font_family: string;
  layout: 'modern' | 'classic' | 'minimal';
  viewMode: 'desktop' | 'mobile';
  storefront_layout: StorefrontLayout;
  themeTokens?: ThemeTokens;
}

type Tab = 'general' | 'theme' | 'branding' | 'address' | 'shipping-taxes' | 'storefront' | 'commissions' | 'advanced';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    FormsModule,
    SettingsGeneral,
    SettingsTheme,
    SettingsBranding,
    SettingsAddress,
    SettingsShippingTaxes,
    SettingsStorefront,
    SettingsDangerZone,
    StorePreview,
    SettingsCommissions,
    SettingsDesignPresets,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);
  private readonly previewSyncService = inject(PreviewSyncService);

  readonly isPopoutOpen = this.previewSyncService.isPopoutOpen;

  readonly activeTab = signal<Tab>('theme');
  readonly viewMode = signal<'desktop' | 'mobile'>('desktop');
  readonly showMobilePreview = signal(false);
  readonly tenant = this.tenantService.currentTenant;
  readonly isTenantLoading = this.tenantService.loading;
  readonly storeUrl = this.tenantService.storeUrl;
  readonly hasUnsavedChanges = signal(false);

  // Design Presets, Drafts & Publishing State
  readonly isPresetsModalOpen = signal(false);
  readonly isPublishModalOpen = signal(false);
  readonly isPublishing = signal(false);
  readonly isSavingDraft = signal(false);
  readonly publishVersionName = signal('');
  readonly publishNotes = signal('');
  readonly previewDataSource = signal<'draft' | 'published'>('draft');

  readonly hasUnpublishedChanges = this.tenantService.hasUnpublishedChanges;
  readonly publishedAt = computed(() => this.tenantService.storeDesignState().published_at);
  readonly versionsCount = computed(() => this.tenantService.designVersions().length);
  readonly customPresetsCount = computed(() => this.tenantService.savedCustomPresets().length);

  readonly themeSection = viewChild(SettingsTheme);
  readonly brandingSection = viewChild(SettingsBranding);
  readonly generalSection = viewChild(SettingsGeneral);
  readonly addressSection = viewChild(SettingsAddress);
  readonly storefrontSection = viewChild(SettingsStorefront);

  readonly tabs: { id: Tab; label: string; icon: string }[] = [
    {
      id: 'theme',
      label: 'Temas & Estilo Visual',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M16.5 12l3.432-3.432a2.25 2.25 0 0 0 0-3.182l-1.318-1.318a2.25 2.25 0 0 0-3.182 0L12 7.5m4.5 4.5d-4.5 4.5" /></svg>`,
    },
    {
      id: 'branding',
      label: 'Marca',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>`,
    },
    {
      id: 'general',
      label: 'General',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 3.129 3h17.742a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>`,
    },
    {
      id: 'address',
      label: 'Dirección',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>`,
    },
    {
      id: 'shipping-taxes',
      label: 'Envío e Impuestos',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V3.375c0-.621-.508-1.125-1.129-1.125H11.25m9.75 16.5h-3.75a1.125 1.125 0 0 1-1.125-1.125V12M3.375 18.75h1.5m1.5-1.5v-1.125c0-.621.504-1.125 1.125-1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V12m0 0h2.625m-2.625 4.5h2.625m-15.75-9.75h3.75m.75 0h1.125m.75 0h3.75m-10.5 2.25h3.75m.75 0h1.125m.75 0h3.75M3.375 7.5h1.5m6-5.25v1.125c0 .621.504 1.125 1.125 1.125h3.75c.621 0 1.125-.504 1.125-1.125V2.25" /></svg>`,
    },
    {
      id: 'commissions',
      label: 'Comisiones',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182C9.464 5.781 10.232 6 11 6c.776 0 1.579-.22 2.243-.659.855-.558 1.873-.659 2.756-.275a48.215 48.215 0 015.111 5.5" /></svg>`,
    },
    {
      id: 'storefront',
      label: 'Secciones de la Tienda',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>`,
    },
  ];

  readonly tabGroups: { label: string; tabs: { id: Tab; label: string; icon: string }[] }[] = [
    { label: 'Apariencia', tabs: this.tabs.filter(tab => ['theme', 'branding', 'storefront'].includes(tab.id)) },
    { label: 'Cuenta', tabs: this.tabs.filter(tab => ['general', 'address'].includes(tab.id)) },
    { label: 'Operaciones', tabs: this.tabs.filter(tab => ['shipping-taxes', 'commissions'].includes(tab.id)) },
    {
      label: 'Avanzado',
      tabs: [{
        id: 'advanced',
        label: 'Zona de Peligro',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m0 3h.008M10.29 3.86 2.82 17.25A1.5 1.5 0 0 0 4.13 19.5h15.74a1.5 1.5 0 0 0 1.31-2.25L13.71 3.86a1.95 1.95 0 0 0-3.42 0Z" /></svg>',
      }],
    },
  ];

  readonly previewData = signal<PreviewData>({
    business_name: 'Venti Shop',
    logo_url: null,
    primary_color: '#000000',
    secondary_color: '#ffffff',
    accent_color: '#3b82f6',
    background_color: '#ffffff',
    header_color: '#ffffff',
    footer_color: '#ffffff',
    currency: 'USD',
    timezone: 'America/New_York',
    font_family: '"Inter", sans-serif',
    layout: 'modern',
    viewMode: 'desktop',
    storefront_layout: { sections: [] },
    themeTokens: this.tenantService.draftThemeTokens()
  });

  readonly currentDraftSnapshot = computed<ThemeDesignSnapshot>(() => {
    const data = this.previewData();
    return {
      theme_tokens: data.themeTokens || this.tenantService.draftThemeTokens(),
      storefront_layout: data.storefront_layout || this.tenantService.draftStorefrontLayout(),
      branding: {
        logo_url: data.logo_url,
        logo_dark_url: data.logo_dark_url,
        main_banner_url: data.main_banner_url,
        background_image_url: data.background_image_url,
        background_pattern: data.background_pattern,
        promo_video_url: data.promo_video_url,
      }
    };
  });

  constructor() {
    // Sync preview data when tenant or layout changes
    effect(() => {
      const t = this.tenantService.tenant();
      const branding = this.tenantService.branding();
      const tokens = this.tenantService.draftThemeTokens();
      if (t) {
        this.previewData.update(prev => ({
          ...prev,
          business_name: t.business_name,
          logo_url: branding?.logo_url || t.logo_url,
          logo_dark_url: branding?.logo_dark_url || (t.settings?.['logo_dark_url'] as string) || null,
          social_share_image_url: branding?.social_share_image_url || (t.settings?.['social_share_image_url'] as string) || null,
          main_banner_url: branding?.main_banner_url || (t.settings?.['main_banner_url'] as string) || null,
          background_image_url: branding?.background_image_url || (t.settings?.['background_image_url'] as string) || null,
          background_pattern: branding?.background_pattern || (t.settings?.['background_pattern'] as any) || 'none',
          promo_video_url: branding?.promo_video_url || (t.settings?.['promo_video_url'] as string) || null,
          brand_gallery: branding?.brand_gallery || (t.settings?.['brand_gallery'] as any) || [],
          social_links: t.social_links,
          primary_color: tokens.colors.primary || t.primary_color,
          secondary_color: tokens.colors.secondary || t.secondary_color,
          accent_color: tokens.colors.accent || t.accent_color,
          background_color: tokens.colors.background || t.background_color,
          header_color: tokens.colors.header || t.header_color,
          footer_color: tokens.colors.footer || t.footer_color,
          currency: String(t.settings?.['currency'] || 'USD'),
          timezone: String(t.settings?.['timezone'] || 'America/New_York'),
          font_family: tokens.font_heading || t.font_family,
          layout: t.layout || 'modern',
          storefront_layout: this.tenantService.draftStorefrontLayout(),
          themeTokens: tokens
        }));
      }
    });
  }

  readonly activeTabLabel = computed(() => {
    if (this.activeTab() === 'advanced') return 'Zona de Peligro';
    return this.tabs.find(t => t.id === this.activeTab())?.label || '';
  });

  readonly publishedPreviewData = computed<PreviewData>(() => {
    const t = this.tenantService.tenant();
    const branding = this.tenantService.branding();
    const tokens = this.tenantService.publishedThemeTokens();
    const layout = this.tenantService.publishedStorefrontLayout();
    return {
      business_name: t?.business_name || 'Venti Shop',
      logo_url: branding?.logo_url || t?.logo_url || null,
      logo_dark_url: branding?.logo_dark_url || (t?.settings?.['logo_dark_url'] as string) || null,
      social_share_image_url: branding?.social_share_image_url || null,
      main_banner_url: branding?.main_banner_url || null,
      background_image_url: branding?.background_image_url || null,
      background_pattern: branding?.background_pattern || 'none',
      promo_video_url: branding?.promo_video_url || null,
      brand_gallery: branding?.brand_gallery || [],
      social_links: t?.social_links,
      primary_color: tokens.colors.primary || '#000000',
      secondary_color: tokens.colors.secondary || '#ffffff',
      accent_color: tokens.colors.accent || '#3b82f6',
      background_color: tokens.colors.background || '#ffffff',
      header_color: tokens.colors.header || '#ffffff',
      footer_color: tokens.colors.footer || '#ffffff',
      currency: String(t?.settings?.['currency'] || 'USD'),
      timezone: String(t?.settings?.['timezone'] || 'America/New_York'),
      font_family: tokens.font_heading || '"Inter", sans-serif',
      layout: t?.layout || 'modern',
      viewMode: this.viewMode(),
      storefront_layout: layout,
      themeTokens: tokens
    };
  });

  readonly fullPreviewData = computed(() => {
    if (this.previewDataSource() === 'published') {
      return this.publishedPreviewData();
    }
    return {
      ...this.previewData(),
      viewMode: this.viewMode(),
    };
  });

  async setActiveTab(tab: Tab) {
    if (tab === this.activeTab()) return;
    if (this.hasUnsavedChanges()) {
      const confirmed = await this.toastService.confirm(
        'Tienes cambios sin guardar en esta sección. ¿Quieres descartarlos y cambiar de pestaña?',
        'Cambios sin guardar'
      );
      if (!confirmed) return;
    }
    this.hasUnsavedChanges.set(false);
    this.activeTab.set(tab);
  }

  onDirtyChange(isDirty: boolean) {
    this.hasUnsavedChanges.set(isDirty);
  }

  // ── Presets Modal Management ──
  openPresetsModal() {
    this.isPresetsModalOpen.set(true);
  }

  closePresetsModal() {
    this.isPresetsModalOpen.set(false);
  }

  applySnapshotToDraft(snapshot: ThemeDesignSnapshot) {
    if (snapshot.theme_tokens) {
      this.updateThemePreview(snapshot.theme_tokens);
      this.themeSection()?.patchTokens(snapshot.theme_tokens);
    }
    if (snapshot.storefront_layout) {
      this.updateStorefrontPreview(snapshot.storefront_layout as StorefrontLayout);
    }
    if (snapshot.branding) {
      this.updatePreview(snapshot.branding);
    }
    this.hasUnsavedChanges.set(true);
    this.toastService.success('Diseño cargado en el borrador de trabajo.');
  }

  // ── Draft & Publish Operations ──
  async saveDraftOnly() {
    this.isSavingDraft.set(true);
    try {
      const snapshot = this.currentDraftSnapshot();

      // First save local tab form
      await this.saveChanges();

      const result = await this.tenantService.saveDraft(snapshot);

      if (result.success) {
        this.toastService.success('Borrador guardado exitosamente. Los cambios no afectan la tienda pública.');
        this.hasUnsavedChanges.set(false);
      } else {
        this.toastService.error(result.error || 'Error al guardar el borrador.');
      }
    } catch {
      this.toastService.error('Error al guardar el borrador de diseño.');
    } finally {
      this.isSavingDraft.set(false);
    }
  }

  openPublishModal() {
    const nextNum = (this.tenantService.designVersions().length || 0) + 1;
    this.publishVersionName.set(`Versión ${nextNum}`);
    this.publishNotes.set('');
    this.isPublishModalOpen.set(true);
  }

  closePublishModal() {
    this.isPublishModalOpen.set(false);
  }

  async confirmPublish() {
    this.isPublishing.set(true);
    try {
      const snapshot = this.currentDraftSnapshot();

      // Save changes in current tab first
      await this.saveChanges();

      // Save draft
      await this.tenantService.saveDraft(snapshot);

      // Publish draft
      const result = await this.tenantService.publishDesign(
        this.publishVersionName().trim(),
        this.publishNotes().trim()
      );

      if (result.success) {
        this.toastService.success(`¡Diseño publicado exitosamente! Tu tienda pública ya está actualizada.`);
        this.hasUnsavedChanges.set(false);
        this.closePublishModal();
      } else {
        this.toastService.error(result.error || 'Error al publicar los cambios.');
      }
    } catch {
      this.toastService.error('Error al publicar el diseño.');
    } finally {
      this.isPublishing.set(false);
    }
  }

  async revertToPublished() {
    const confirmed = await this.toastService.confirm(
      '¿Deseas descartar todos los cambios del borrador y volver al último diseño publicado en vivo?',
      'Volver al diseño publicado'
    );
    if (!confirmed) return;

    try {
      const result = await this.tenantService.revertDraftToPublished();
      if (result.success) {
        const pubTokens = this.tenantService.publishedThemeTokens();
        const pubLayout = this.tenantService.publishedStorefrontLayout();
        this.updateThemePreview(pubTokens);
        this.themeSection()?.patchTokens(pubTokens);
        this.updateStorefrontPreview(pubLayout);
        this.hasUnsavedChanges.set(false);
        this.toastService.info('Borrador restablecido al último diseño publicado.');
      } else {
        this.toastService.error(result.error || 'Error al restablecer.');
      }
    } catch {
      this.toastService.error('Error al restablecer el diseño.');
    }
  }

  async saveChanges() {
    switch (this.activeTab()) {
      case 'theme': await this.themeSection()?.save(); break;
      case 'branding': await this.brandingSection()?.save(); break;
      case 'general': await this.generalSection()?.save(); break;
      case 'address': await this.addressSection()?.save(); break;
      case 'storefront': await this.storefrontSection()?.saveLayout(); break;
    }
  }

  discardChanges() {
    switch (this.activeTab()) {
      case 'theme': this.themeSection()?.cancel(); break;
      case 'branding': this.brandingSection()?.cancel(); break;
      case 'general': this.generalSection()?.cancel(); break;
      case 'address': this.addressSection()?.cancel(); break;
      case 'storefront': this.storefrontSection()?.discardLayout(); break;
    }
    this.hasUnsavedChanges.set(false);
  }

  setViewMode(mode: 'desktop' | 'mobile') { this.viewMode.set(mode); }
  toggleMobilePreview() {
    this.showMobilePreview.update(isVisible => !isVisible);
    this.viewMode.set('mobile');
  }

  openPreviewPopout(): void {
    // Seed the service with current data before opening
    this.previewSyncService.broadcastPreview(this.fullPreviewData());
    this.previewSyncService.openPopout();
  }

  closePreviewPopout(): void {
    this.previewSyncService.closePopout();
  }

  async copyStoreUrl() {
    try {
      const storeUrl = this.storeUrl();
      const fullUrl = storeUrl.startsWith('http://') || storeUrl.startsWith('https://')
        ? storeUrl
        : `${window.location.origin}${storeUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      this.toastService.success('URL copiada al portapapeles');
    } catch {
      // Clipboard access can be unavailable outside a secure browser context.
    }
  }

  updateThemePreview(tokens: ThemeTokens) {
    this.previewData.update(prev => ({
      ...prev,
      primary_color: tokens.colors.primary,
      secondary_color: tokens.colors.secondary,
      accent_color: tokens.colors.accent,
      background_color: tokens.colors.background,
      header_color: tokens.colors.header,
      footer_color: tokens.colors.footer,
      font_family: tokens.font_heading,
      themeTokens: tokens
    }));
    this.broadcastCurrentPreview();
  }

  updatePreview(branding: any) {
    this.previewData.update(prev => ({ ...prev, ...branding }));
    this.broadcastCurrentPreview();
  }

  updateStorefrontPreview(layout: StorefrontLayout) {
    this.previewData.update(prev => ({ ...prev, storefront_layout: layout }));
    this.broadcastCurrentPreview();
  }

  private broadcastCurrentPreview(): void {
    this.previewSyncService.broadcastPreview(this.fullPreviewData());
  }
}