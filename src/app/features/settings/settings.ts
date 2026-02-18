import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsGeneral } from './components/settings-general';
import { SettingsBranding } from './components/settings-branding';
import { SettingsAddress } from './components/settings-address';
import { SettingsDangerZone } from './components/settings-danger-zone';
import { StorePreview } from './components/store-preview';
import { TenantService } from '@core/services/tenant';

export interface PreviewData {
  business_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  layout: 'modern' | 'classic' | 'minimal';
  viewMode: 'desktop' | 'mobile';
}

type Tab = 'general' | 'branding' | 'address';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    SettingsGeneral,
    SettingsBranding,
    SettingsAddress,
    SettingsDangerZone,
    StorePreview
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  readonly activeTab = signal<Tab>('branding'); // Default to branding for this task
  readonly viewMode = signal<'desktop' | 'mobile'>('desktop');

  readonly previewData = signal<PreviewData>({
    business_name: 'Venti Store',
    logo_url: null,
    primary_color: '#000000',
    secondary_color: '#ffffff',
    accent_color: '#3b82f6',
    font_family: '"Inter", sans-serif',
    layout: 'modern',
    viewMode: 'desktop'
  });

  constructor() {
    const tenantService = inject(TenantService);
    // Initialize with real tenant data
    const t = tenantService.tenant();
    if (t) {
      this.previewData.set({
        business_name: t.business_name,
        logo_url: t.logo_url,
        primary_color: t.primary_color,
        secondary_color: t.secondary_color,
        accent_color: t.accent_color,
        font_family: t.font_family,
        layout: t.layout || 'modern',
        viewMode: 'desktop'
      });
    }
  }

  readonly fullPreviewData = computed(() => ({
    ...this.previewData(),
    viewMode: this.viewMode()
  }));

  setActiveTab(tab: Tab) {
    this.activeTab.set(tab);
  }

  setViewMode(mode: 'desktop' | 'mobile') {
    this.viewMode.set(mode);
  }

  updatePreview(branding: any) {
    this.previewData.set({
      ...this.previewData(),
      ...branding
    });
  }
}
