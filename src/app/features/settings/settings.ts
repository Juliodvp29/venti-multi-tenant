import { ChangeDetectionStrategy, Component, signal, computed, inject, effect, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsGeneral } from './components/settings-general';
import { SettingsBranding } from './components/settings-branding';
import { SettingsAddress } from './components/settings-address';
import { SettingsDangerZone } from './components/settings-danger-zone';
import { StorePreview } from './components/store-preview';
import { TenantService } from '@core/services/tenant';
import { SettingsShippingTaxes } from './components/settings-shipping-taxes';
import { SettingsStorefront } from './components/settings-storefront/settings-storefront';
import { SettingsCommissions } from './components/settings-commissions/settings-commissions';
import { ToastService } from '@core/services/toast';

import { StorefrontLayout } from '@core/models';

export interface PreviewData {
  business_name: string;
  logo_url: string | null;
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
}

type Tab = 'general' | 'branding' | 'address' | 'shipping-taxes' | 'storefront' | 'commissions';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, SettingsGeneral, SettingsBranding, SettingsAddress, SettingsShippingTaxes, SettingsStorefront, SettingsDangerZone, StorePreview, SettingsCommissions],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);

  readonly activeTab = signal<Tab>('branding');
  readonly viewMode = signal<'desktop' | 'mobile'>('desktop');
  readonly showMobilePreview = signal(false);
  readonly tenant = this.tenantService.currentTenant;
  readonly storeUrl = this.tenantService.storeUrl;
  readonly hasUnsavedChanges = signal(false);
  readonly brandingSection = viewChild(SettingsBranding);
  readonly generalSection = viewChild(SettingsGeneral);
  readonly addressSection = viewChild(SettingsAddress);
  readonly storefrontSection = viewChild(SettingsStorefront);

  readonly tabs: { id: Tab; label: string; icon: string }[] = [
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
      label: 'Diseño de la Tienda',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>`,
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
    storefront_layout: { sections: [] }
  });

  constructor() {
    // Sync preview data when tenant or layout changes
    effect(() => {
      const t = this.tenantService.tenant();
      if (t) {
        this.previewData.update(prev => ({
          ...prev,
          business_name: t.business_name,
          logo_url: t.logo_url,
          primary_color: t.primary_color,
          secondary_color: t.secondary_color,
          accent_color: t.accent_color,
          background_color: t.background_color,
          header_color: t.header_color,
          footer_color: t.footer_color,
          currency: String(t.settings?.['currency'] || 'USD'),
          timezone: String(t.settings?.['timezone'] || 'America/New_York'),
          font_family: t.font_family,
          layout: t.layout || 'modern',
          storefront_layout: this.tenantService.storefrontLayout()
        }));
      }
    });
  }

  readonly activeTabLabel = computed(() => {
    return this.tabs.find(t => t.id === this.activeTab())?.label || '';
  });

  readonly fullPreviewData = computed(() => ({
    ...this.previewData(),
    viewMode: this.viewMode(),
  }));

  async setActiveTab(tab: Tab) {
    if (tab === this.activeTab()) return;
    if (this.hasUnsavedChanges()) {
      const confirmed = await this.toastService.confirm(
        'Tienes cambios sin guardar. ¿Quieres descartarlos y cambiar de sección?',
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

  async saveChanges() {
    switch (this.activeTab()) {
      case 'branding': await this.brandingSection()?.save(); break;
      case 'general': await this.generalSection()?.save(); break;
      case 'address': await this.addressSection()?.save(); break;
      case 'storefront': await this.storefrontSection()?.saveLayout(); break;
    }
  }

  discardChanges() {
    switch (this.activeTab()) {
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

  updatePreview(branding: any) {
    this.previewData.update(prev => ({ ...prev, ...branding }));
  }

  updateStorefrontPreview(layout: StorefrontLayout) {
    this.previewData.update(prev => ({ ...prev, storefront_layout: layout }));
  }
}