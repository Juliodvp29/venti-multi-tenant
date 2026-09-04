import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaManagerModal } from '@shared/components/media-manager-modal/media-manager-modal';
import { BrandGalleryItem, BackgroundPatternOption } from '@core/models';

@Component({
  selector: 'app-settings-branding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MediaManagerModal],
  templateUrl: './settings-branding.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBranding {
  private readonly fb = inject(FormBuilder);
  readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);

  readonly isSaving = signal(false);
  readonly tenant = this.tenantService.tenant;
  readonly brandingChange = output<any>();
  readonly dirtyChange = output<boolean>();

  // Media Manager Modal state
  readonly isMediaManagerOpen = signal(false);
  readonly activeTargetField = signal<string | null>(null);
  readonly mediaFilter = signal<'all' | 'image' | 'video'>('all');

  // Brand Gallery items signal
  readonly brandGallery = signal<BrandGalleryItem[]>([]);

  readonly fonts = [
    { name: 'Inter', value: '"Inter", sans-serif' },
    { name: 'Roboto', value: '"Roboto", sans-serif' },
    { name: 'Outfit', value: '"Outfit", sans-serif' },
    { name: 'Playfair Display', value: '"Playfair Display", serif' },
    { name: 'Poppins', value: '"Poppins", sans-serif' },
  ];

  readonly patterns: { label: string; value: BackgroundPatternOption }[] = [
    { label: 'Ninguno (Liso)', value: 'none' },
    { label: 'Puntos sutiles', value: 'dots' },
    { label: 'Cuadrícula', value: 'grid' },
    { label: 'Gradiente Mesh', value: 'mesh' },
    { label: 'Granulado (Noise)', value: 'noise' },
  ];

  // Quick-pick color swatches
  readonly primarySwatches = ['#000000', '#18181b', '#1e3a5f', '#7c3aed', '#dc2626', '#059669'];
  readonly backgroundSwatches = ['#ffffff', '#f8fafc', '#f1f5f9', '#f3f4f6', '#fffbeb', '#f0fdf4'];
  readonly accentSwatches = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  readonly form = this.fb.nonNullable.group({
    primary_color: ['#000000', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    secondary_color: ['#ffffff', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    background_color: ['#ffffff', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    header_color: ['#ffffff', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    footer_color: ['#ffffff', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    accent_color: ['#3b82f6', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    font_family: ['"Inter", sans-serif', [Validators.required]],
    layout: ['modern', [Validators.required]],

    // Recursos Visuales de Marca
    logo_url: [''],
    logo_dark_url: [''],
    favicon_url: [''],
    social_share_image_url: [''],
    main_banner_url: [''],
    background_image_url: [''],
    background_pattern: ['none' as BackgroundPatternOption],
    promo_video_url: [''],

    social_links: this.fb.group({
      whatsapp: [''],
      facebook: [''],
      instagram: [''],
      tiktok: [''],
      youtube: [''],
      twitter: [''],
    }),
  });

  constructor() {
    // Populate from tenant
    effect(() => {
      const tenant = this.tenant();
      const branding = this.tenantService.branding();
      if (tenant) {
        this.form.patchValue(
          {
            primary_color: tenant.primary_color,
            secondary_color: tenant.secondary_color,
            background_color: tenant.background_color || '#ffffff',
            header_color: tenant.header_color || '#ffffff',
            footer_color: tenant.footer_color || '#ffffff',
            accent_color: tenant.accent_color,
            font_family: tenant.font_family || '"Inter", sans-serif',
            layout: tenant.layout || 'modern',
            logo_url: branding?.logo_url || tenant.logo_url || '',
            logo_dark_url:
              branding?.logo_dark_url || (tenant.settings?.['logo_dark_url'] as string) || '',
            favicon_url: branding?.favicon_url || tenant.favicon_url || '',
            social_share_image_url:
              branding?.social_share_image_url ||
              (tenant.settings?.['social_share_image_url'] as string) ||
              '',
            main_banner_url:
              branding?.main_banner_url || (tenant.settings?.['main_banner_url'] as string) || '',
            background_image_url:
              branding?.background_image_url ||
              (tenant.settings?.['background_image_url'] as string) ||
              '',
            background_pattern:
              branding?.background_pattern ||
              (tenant.settings?.['background_pattern'] as any) ||
              'none',
            promo_video_url:
              branding?.promo_video_url || (tenant.settings?.['promo_video_url'] as string) || '',
            social_links: {
              whatsapp: tenant.social_links?.whatsapp || '',
              facebook: tenant.social_links?.facebook || '',
              instagram: tenant.social_links?.instagram || '',
              tiktok: tenant.social_links?.tiktok || '',
              youtube: tenant.social_links?.youtube || '',
              twitter: tenant.social_links?.twitter || '',
            },
          },
          { emitEvent: false },
        );

        const gallery =
          branding?.brand_gallery || (tenant.settings?.['brand_gallery'] as any) || [];
        this.brandGallery.set(gallery);

        this.form.markAsPristine();
        this.emitBranding();
      }
    });

    // Live-preview on change
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.emitBranding();
      this.dirtyChange.emit(this.form.dirty);
    });
  }

  private emitBranding() {
    this.brandingChange.emit({
      ...this.form.getRawValue(),
      brand_gallery: this.brandGallery(),
    });
  }

  // Media Manager Modal Helpers
  openMediaManager(fieldKey: string, filter: 'all' | 'image' | 'video' = 'all') {
    this.activeTargetField.set(fieldKey);
    this.mediaFilter.set(filter);
    this.isMediaManagerOpen.set(true);
  }

  closeMediaManager() {
    this.isMediaManagerOpen.set(false);
    this.activeTargetField.set(null);
  }

  handleMediaSelected(url: string) {
    const field = this.activeTargetField();
    if (!field) return;

    if (field === 'brand_gallery') {
      this.addGalleryItem(url);
    } else {
      this.form.patchValue({ [field]: url });
      this.form.markAsDirty();
      this.emitBranding();
    }
  }

  // Direct file upload fallback
  async onFileSelected(
    event: Event,
    type: 'logo' | 'logo_dark' | 'favicon' | 'social_share' | 'main_banner' | 'background',
  ) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.toastService.error('El archivo debe ser una imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toastService.error('La imagen no debe exceder los 5MB');
      return;
    }

    this.isSaving.set(true);
    try {
      const result = await this.tenantService.uploadBrandingAsset(file, type);
      if (result.success && result.url) {
        const formFieldKey = `${type}_url`;
        this.form.patchValue({ [formFieldKey]: result.url });
        this.form.markAsDirty();
        this.emitBranding();
        this.toastService.success('Recurso subido exitosamente');
      } else {
        this.toastService.error(result.error || 'Error al subir la imagen');
      }
    } catch {
      this.toastService.error('Error al subir la imagen');
    } finally {
      this.isSaving.set(false);
      input.value = '';
    }
  }

  // Brand Gallery Handlers
  addGalleryItem(url: string, caption = '') {
    const current = this.brandGallery();
    const newItem: BrandGalleryItem = {
      id: Date.now().toString(),
      url,
      caption,
    };
    const updated = [...current, newItem];
    this.brandGallery.set(updated);
    this.form.markAsDirty();
    this.emitBranding();
    this.toastService.success('Imagen agregada a la galería de marca');
  }

  removeGalleryItem(id: string) {
    const current = this.brandGallery();
    const updated = current.filter((item) => item.id !== id);
    this.brandGallery.set(updated);
    this.form.markAsDirty();
    this.emitBranding();
  }

  updateGalleryCaption(id: string, caption: string) {
    const current = this.brandGallery();
    const updated = current.map((item) => (item.id === id ? { ...item, caption } : item));
    this.brandGallery.set(updated);
    this.form.markAsDirty();
    this.emitBranding();
  }

  async save(silent = false): Promise<boolean> {
    if (this.form.pristine) {
      if (!silent)
        this.toastService.info('Por favor, completa los campos obligatorios antes de guardar.');
      return true;
    } else if (this.form.invalid) {
      if (!silent) this.toastService.error('Por favor, corrige los errores en el formulario');
      else this.form.markAllAsTouched();
      return false;
    }
    this.isSaving.set(true);
    try {
      const data = this.form.getRawValue();
      const result = await this.tenantService.updateBranding({
        ...data,
        logo_url: data.logo_url || null,
        logo_dark_url: data.logo_dark_url || null,
        favicon_url: data.favicon_url || null,
        social_share_image_url: data.social_share_image_url || null,
        main_banner_url: data.main_banner_url || null,
        background_image_url: data.background_image_url || null,
        background_pattern: data.background_pattern || 'none',
        promo_video_url: data.promo_video_url || null,
        brand_gallery: this.brandGallery(),
        layout: data.layout as 'modern' | 'classic' | 'minimal',
        social_links: {
          whatsapp: data.social_links.whatsapp || undefined,
          facebook: data.social_links.facebook || undefined,
          instagram: data.social_links.instagram || undefined,
          tiktok: data.social_links.tiktok || undefined,
          youtube: data.social_links.youtube || undefined,
          twitter: data.social_links.twitter || undefined,
        },
      });
      if (result.success) {
        if (!silent) this.toastService.success('Recursos de marca guardados exitosamente');
        this.form.markAsPristine();
        this.dirtyChange.emit(false);
        return true;
      } else {
        if (!silent) this.toastService.error(result.error || 'Error al guardar la configuración');
        return false;
      }
    } catch {
      if (!silent) this.toastService.error('Error al guardar la configuración');
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    const tenant = this.tenant();
    const branding = this.tenantService.branding();
    if (tenant) {
      this.form.patchValue({
        primary_color: tenant.primary_color,
        secondary_color: tenant.secondary_color,
        background_color: tenant.background_color || '#ffffff',
        header_color: tenant.header_color || '#ffffff',
        footer_color: tenant.footer_color || '#ffffff',
        accent_color: tenant.accent_color,
        logo_url: branding?.logo_url || tenant.logo_url || '',
        logo_dark_url:
          branding?.logo_dark_url || (tenant.settings?.['logo_dark_url'] as string) || '',
        favicon_url: branding?.favicon_url || tenant.favicon_url || '',
        social_share_image_url:
          branding?.social_share_image_url ||
          (tenant.settings?.['social_share_image_url'] as string) ||
          '',
        main_banner_url:
          branding?.main_banner_url || (tenant.settings?.['main_banner_url'] as string) || '',
        background_image_url:
          branding?.background_image_url ||
          (tenant.settings?.['background_image_url'] as string) ||
          '',
        background_pattern:
          branding?.background_pattern ||
          (tenant.settings?.['background_pattern'] as any) ||
          'none',
        promo_video_url:
          branding?.promo_video_url || (tenant.settings?.['promo_video_url'] as string) || '',
        social_links: {
          whatsapp: tenant.social_links?.whatsapp || '',
          facebook: tenant.social_links?.facebook || '',
          instagram: tenant.social_links?.instagram || '',
          tiktok: tenant.social_links?.tiktok || '',
          youtube: tenant.social_links?.youtube || '',
          twitter: tenant.social_links?.twitter || '',
        },
      });

      const gallery = branding?.brand_gallery || (tenant.settings?.['brand_gallery'] as any) || [];
      this.brandGallery.set(gallery);

      this.form.markAsPristine();
      this.dirtyChange.emit(false);
    }
    this.toastService.info('Cambios descartados');
  }
}
