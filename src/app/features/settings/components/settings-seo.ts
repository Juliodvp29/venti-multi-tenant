import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';

const INPUT_CLASS =
  'block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700';

@Component({
  selector: 'app-settings-seo',
  imports: [ReactiveFormsModule],
  templateUrl: './settings-seo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSeo {
  private readonly fb = inject(FormBuilder);
  private readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);

  readonly isSaving = signal(false);
  readonly isUploadingImage = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly tenant = this.tenantService.tenant;
  readonly dirtyChange = output<boolean>();
  readonly inputClass = INPUT_CLASS;

  readonly form = this.fb.nonNullable.group({
    seo_title: ['', [Validators.maxLength(60)]],
    seo_description: ['', [Validators.maxLength(160)]],
    seo_keywords: [''],
    seo_og_image: ['', [Validators.pattern(/^https?:\/\/.+/)]],
  });

  readonly titleLength = signal(0);
  readonly descriptionLength = signal(0);

  constructor() {
    effect(() => {
      const tenant = this.tenant();
      if (tenant) {
        const settings = tenant.settings ?? {};
        this.form.patchValue(
          {
            seo_title: String(settings['seo_title'] || ''),
            seo_description: String(settings['seo_description'] || ''),
            seo_keywords: String(settings['seo_keywords'] || ''),
            seo_og_image: String(settings['seo_og_image'] || ''),
          },
          { emitEvent: false },
        );
        this.titleLength.set(this.form.controls.seo_title.value.length);
        this.descriptionLength.set(this.form.controls.seo_description.value.length);
        this.form.markAsPristine();
      }
    });

    this.form.valueChanges.subscribe(() => {
      this.saveError.set(null);
      this.titleLength.set(this.form.controls.seo_title.value.length);
      this.descriptionLength.set(this.form.controls.seo_description.value.length);
      this.dirtyChange.emit(this.form.dirty);
    });
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastService.error('El archivo debe ser una imagen');
      return;
    }

    this.isUploadingImage.set(true);
    try {
      const result = await this.tenantService.uploadBrandingAsset(file, 'media');
      if (result.success && result.url) {
        this.form.controls.seo_og_image.setValue(result.url);
        this.form.markAsDirty();
        this.dirtyChange.emit(true);
        this.toastService.success('Imagen subida correctamente');
      } else {
        this.toastService.error(result.error || 'No se pudo subir la imagen');
      }
    } catch (error) {
      console.error('Error uploading OG image:', error);
      this.toastService.error('No se pudo subir la imagen');
    } finally {
      this.isUploadingImage.set(false);
    }
  }

  removeImage(): void {
    this.form.controls.seo_og_image.setValue('');
    this.form.markAsDirty();
    this.dirtyChange.emit(true);
  }

  async save(silent = false): Promise<boolean> {
    if (this.form.invalid) {
      if (!silent) this.toastService.error('Por favor, corrige los errores en el formulario');
      this.form.markAllAsTouched();
      return false;
    }

    const tenant = this.tenant();
    if (!tenant) return false;

    this.isSaving.set(true);
    this.saveError.set(null);

    try {
      const { seo_title, seo_description, seo_keywords, seo_og_image } = this.form.getRawValue();
      await this.tenantService.updateTenant(tenant.id, {
        settings: {
          ...tenant.settings,
          seo_title: seo_title.trim(),
          seo_description: seo_description.trim(),
          seo_keywords: seo_keywords.trim(),
          seo_og_image: seo_og_image.trim(),
        },
      });
      if (!silent) this.toastService.success('Configuración SEO guardada exitosamente');
      this.form.markAsPristine();
      this.dirtyChange.emit(false);
      return true;
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      this.saveError.set(
        'No pudimos guardar los cambios. Revisa tu conexión e inténtalo de nuevo.',
      );
      if (!silent) this.toastService.error('Error al guardar la configuración SEO');
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    const tenant = this.tenant();
    if (tenant) {
      const settings = tenant.settings ?? {};
      this.form.patchValue({
        seo_title: String(settings['seo_title'] || ''),
        seo_description: String(settings['seo_description'] || ''),
        seo_keywords: String(settings['seo_keywords'] || ''),
        seo_og_image: String(settings['seo_og_image'] || ''),
      });
      this.form.markAsPristine();
      this.dirtyChange.emit(false);
    }
    this.toastService.info('Cambios descartados');
  }
}
