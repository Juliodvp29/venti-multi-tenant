import { ChangeDetectionStrategy, Component, inject, output, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { CustomThemePreset, ThemeDesignVersion, ThemeDesignSnapshot, ThemeTokens, StorefrontLayout } from '@core/models';

@Component({
  selector: 'app-settings-design-presets',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-design-presets.html',
  styleUrl: './settings-design-presets.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDesignPresets {
  private readonly tenantService = inject(TenantService);
  private readonly toast = inject(ToastService);

  readonly currentDraftSnapshot = input<ThemeDesignSnapshot | null>(null);

  readonly close = output<void>();
  readonly applyPresetSnapshot = output<ThemeDesignSnapshot>();

  readonly activeTab = signal<'presets' | 'versions'>('presets');

  // New Preset Modal / Form
  readonly isSavingPreset = signal(false);
  readonly showNewPresetForm = signal(false);
  readonly newPresetName = signal('');
  readonly newPresetDescription = signal('');

  // Version Restore Modal / State
  readonly isRestoring = signal(false);

  // Computeds from TenantService
  readonly savedPresets = this.tenantService.savedCustomPresets;
  readonly designVersions = this.tenantService.designVersions;
  readonly publishedState = computed(() => this.tenantService.storeDesignState().published);
  readonly publishedAt = computed(() => this.tenantService.storeDesignState().published_at);

  openNewPresetModal(): void {
    const currentThemeName = this.tenantService.draftThemeTokens()?.theme_name || 'Mi Diseño';
    this.newPresetName.set(`${currentThemeName} Personalizado`);
    this.newPresetDescription.set('');
    this.showNewPresetForm.set(true);
  }

  closeNewPresetModal(): void {
    this.showNewPresetForm.set(false);
    this.newPresetName.set('');
    this.newPresetDescription.set('');
  }

  async saveCurrentPreset(): Promise<void> {
    const name = this.newPresetName().trim();
    if (!name) {
      this.toast.error('Por favor ingresa un nombre para el preset.');
      return;
    }

    this.isSavingPreset.set(true);
    try {
      const snapshot = this.currentDraftSnapshot() || this.tenantService.storeDesignState().draft;
      const result = await this.tenantService.saveCurrentAsPreset(name, this.newPresetDescription().trim(), snapshot);

      if (result.success) {
        this.toast.success(`Preset "${name}" guardado exitosamente.`);
        this.closeNewPresetModal();
      } else {
        this.toast.error(result.error || 'Error al guardar el preset.');
      }
    } catch {
      this.toast.error('Ocurrió un error inesperado al guardar el preset.');
    } finally {
      this.isSavingPreset.set(false);
    }
  }

  async duplicate(preset: CustomThemePreset): Promise<void> {
    try {
      const result = await this.tenantService.duplicatePreset(preset.id);
      if (result.success) {
        this.toast.success(`Preset "${preset.name}" duplicado.`);
      } else {
        this.toast.error(result.error || 'Error al duplicar el preset.');
      }
    } catch {
      this.toast.error('Error al duplicar el preset.');
    }
  }

  async deletePreset(preset: CustomThemePreset): Promise<void> {
    const confirmed = await this.toast.confirm(
      `¿Estás seguro de que deseas eliminar el preset "${preset.name}"? Esta acción no se puede deshacer.`,
      'Eliminar Preset'
    );
    if (!confirmed) return;

    try {
      const result = await this.tenantService.deleteCustomPreset(preset.id);
      if (result.success) {
        this.toast.info(`Preset "${preset.name}" eliminado.`);
      } else {
        this.toast.error(result.error || 'Error al eliminar el preset.');
      }
    } catch {
      this.toast.error('Error al eliminar el preset.');
    }
  }

  apply(preset: CustomThemePreset): void {
    this.applyPresetSnapshot.emit(structuredClone(preset.snapshot));
    this.toast.success(`Preset "${preset.name}" aplicado al borrador.`);
    this.close.emit();
  }

  async restore(version: ThemeDesignVersion, autoPublish: boolean = false): Promise<void> {
    const actionText = autoPublish ? 'restaurar y publicar en vivo' : 'cargar en el borrador';
    const confirmed = await this.toast.confirm(
      `¿Deseas ${actionText} la versión #${version.version_number} (${version.name})?`,
      'Restaurar Versión'
    );
    if (!confirmed) return;

    this.isRestoring.set(true);
    try {
      const result = await this.tenantService.restoreVersion(version.id, autoPublish);
      if (result.success) {
        if (autoPublish) {
          this.toast.success(`Versión #${version.version_number} restaurada y publicada en vivo.`);
        } else {
          this.applyPresetSnapshot.emit(structuredClone(version.snapshot));
          this.toast.success(`Versión #${version.version_number} cargada en el borrador.`);
        }
        this.close.emit();
      } else {
        this.toast.error(result.error || 'Error al restaurar la versión.');
      }
    } catch {
      this.toast.error('Error al restaurar la versión.');
    } finally {
      this.isRestoring.set(false);
    }
  }

  isCurrentLiveVersion(version: ThemeDesignVersion): boolean {
    const published = this.publishedState();
    if (!published || !version.snapshot) return false;
    return (
      JSON.stringify(published.theme_tokens) === JSON.stringify(version.snapshot.theme_tokens) &&
      JSON.stringify(published.storefront_layout) === JSON.stringify(version.snapshot.storefront_layout)
    );
  }
}
