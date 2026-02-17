import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-settings-branding',
    imports: [ReactiveFormsModule],
    templateUrl: './settings-branding.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBranding {
    private readonly fb = inject(FormBuilder);
    readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);

    readonly isSaving = signal(false);
    readonly tenant = this.tenantService.tenant;

    readonly form = this.fb.nonNullable.group({
        primary_color: ['#000000', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
        secondary_color: ['#ffffff', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
        accent_color: ['#3b82f6', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
        logo_url: [''],
        favicon_url: [''],
    });

    constructor() {
        effect(() => {
            const tenant = this.tenant();
            if (tenant) {
                this.form.patchValue({
                    primary_color: tenant.primary_color,
                    secondary_color: tenant.secondary_color,
                    accent_color: tenant.accent_color,
                    logo_url: tenant.logo_url || '',
                    favicon_url: tenant.favicon_url || '',
                });
                this.form.markAsPristine();
            }
        });
    }

    async onFileSelected(event: Event, type: 'logo' | 'favicon') {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.toastService.error('El archivo debe ser una imagen');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.toastService.error('La imagen no debe superar los 2MB');
            return;
        }

        this.isSaving.set(true);

        try {
            const result = await this.tenantService.uploadBrandingAsset(file, type);

            if (result.success && result.url) {
                this.form.patchValue({
                    [type === 'logo' ? 'logo_url' : 'favicon_url']: result.url
                });
                this.toastService.success('Imagen actualizada correctamente');
            } else {
                this.toastService.error(result.error || 'Error al subir la imagen');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            this.toastService.error('Error al subir la imagen');
        } finally {
            this.isSaving.set(false);
            // Reset input
            input.value = '';
        }
    }

    async save() {
        if (this.form.invalid) {
            this.toastService.error('Por favor, corrige los errores en el formulario');
            return;
        }

        this.isSaving.set(true);

        try {
            const brandingData = this.form.getRawValue();
            const result = await this.tenantService.updateBranding({
                ...brandingData,
                logo_url: brandingData.logo_url || null,
                favicon_url: brandingData.favicon_url || null,
            });

            if (result.success) {
                this.toastService.success('Configuración guardada correctamente');
                this.form.markAsPristine();
            } else {
                this.toastService.error(result.error || 'Error al guardar la configuración');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.toastService.error('Error al guardar la configuración');
        } finally {
            this.isSaving.set(false);
        }
    }

    cancel() {
        const tenant = this.tenant();
        if (tenant) {
            this.form.patchValue({
                primary_color: tenant.primary_color,
                secondary_color: tenant.secondary_color,
                accent_color: tenant.accent_color,
                logo_url: tenant.logo_url || '',
                favicon_url: tenant.favicon_url || '',
            });
            this.form.markAsPristine();
        }
        this.toastService.info('Cambios descartados');
    }
}
