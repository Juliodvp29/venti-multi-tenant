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
  imports: [CommonModule, SettingsGeneral, SettingsBranding, SettingsAddress, SettingsDangerZone, StorePreview],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  readonly activeTab = signal<Tab>('branding');
  readonly viewMode = signal<'desktop' | 'mobile'>('desktop');

  readonly tabs: { id: Tab; label: string; icon: string }[] = [
    {
      id: 'branding',
      label: 'Branding',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>`,
    },
    {
      id: 'general',
      label: 'General',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 3.129 3h17.742a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>`,
    },
    {
      id: 'address',
      label: 'Address',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>`,
    },
  ];

  readonly previewData = signal<PreviewData>({
    business_name: 'Venti Store',
    logo_url: null,
    primary_color: '#000000',
    secondary_color: '#ffffff',
    accent_color: '#3b82f6',
    font_family: '"Inter", sans-serif',
    layout: 'modern',
    viewMode: 'desktop',
  });

  constructor() {
    const tenantService = inject(TenantService);
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
        viewMode: 'desktop',
      });
    }
  }

  readonly fullPreviewData = computed(() => ({
    ...this.previewData(),
    viewMode: this.viewMode(),
  }));

  setActiveTab(tab: Tab) { this.activeTab.set(tab); }
  setViewMode(mode: 'desktop' | 'mobile') { this.viewMode.set(mode); }
  updatePreview(branding: any) {
    this.previewData.update(prev => ({ ...prev, ...branding }));
  }
}