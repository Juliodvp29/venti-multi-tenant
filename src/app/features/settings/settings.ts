import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsGeneral } from './components/settings-general';
import { SettingsBranding } from './components/settings-branding';
import { SettingsAddress } from './components/settings-address';
import { SettingsDangerZone } from './components/settings-danger-zone';

type Tab = 'general' | 'branding' | 'address';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    SettingsGeneral,
    SettingsBranding,
    SettingsAddress,
    SettingsDangerZone
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  readonly activeTab = signal<Tab>('general');

  setActiveTab(tab: Tab) {
    this.activeTab.set(tab);
  }
}
