import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-settings-branding',
    imports: [CommonModule, ReactiveFormsModule],
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

    readonly fonts = [
        { name: 'Inter', value: '"Inter", sans-serif' },
        { name: 'Roboto', value: '"Roboto", sans-serif' },
        { name: 'Outfit', value: '"Outfit", sans-serif' },
        { name: 'Playfair Display', value: '"Playfair Display", serif' },
        { name: 'Poppins', value: '"Poppins", sans-serif' },
    ];

    readonly layouts = [
        { id: 'modern', name: 'Modern', icon: 'M4 6h16M4 12h16M4 18h7' },
        { id: 'classic', name: 'Classic', icon: 'M4 6h16M7 12h10M9 18h6' },
        { id: 'minimal', name: 'Minimal', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    ];

    // Quick-pick color swatches
    readonly primarySwatches = ['#000000', '#18181b', '#1e3a5f', '#7c3aed', '#dc2626', '#059669'];
    readonly accentSwatches = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

    readonly form = this.fb.nonNullable.group({
        primary_color: ['#000000', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
        secondary_color: ['#ffffff', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
        accent_color: ['#3b82f6', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
        font_family: ['"Inter", sans-serif', [Validators.required]],
        layout: ['modern', [Validators.required]],
        logo_url: [''],
        favicon_url: [''],
    });

    constructor() {
        // Populate from tenant
        effect(() => {
            const tenant = this.tenant();
            if (tenant) {
                this.form.patchValue({
                    primary_color: tenant.primary_color,
                    secondary_color: tenant.secondary_color,
                    accent_color: tenant.accent_color,
                    font_family: tenant.font_family || '"Inter", sans-serif',
                    layout: tenant.layout || 'modern',
                    logo_url: tenant.logo_url || '',
                    favicon_url: tenant.favicon_url || '',
                }, { emitEvent: false });
                this.form.markAsPristine();
                this.emitBranding();
            }
        });

        // Live-preview on change
        this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
            this.emitBranding();
        });
    }

    private emitBranding() {
        this.brandingChange.emit(this.form.getRawValue());
    }

    async onFileSelected(event: Event, type: 'logo' | 'favicon') {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        if (!file.type.startsWith('image/')) {
            this.toastService.error('File must be an image');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            this.toastService.error('Image must not exceed 2MB');
            return;
        }

        this.isSaving.set(true);
        try {
            const result = await this.tenantService.uploadBrandingAsset(file, type);
            if (result.success && result.url) {
                this.form.patchValue({ [type === 'logo' ? 'logo_url' : 'favicon_url']: result.url });
                this.toastService.success('Image updated successfully');
            } else {
                this.toastService.error(result.error || 'Error uploading image');
            }
        } catch {
            this.toastService.error('Error uploading image');
        } finally {
            this.isSaving.set(false);
            input.value = '';
        }
    }

    async save() {
        if (this.form.invalid) {
            this.toastService.error('Please correct errors in the form');
            return;
        }
        this.isSaving.set(true);
        try {
            const data = this.form.getRawValue();
            const result = await this.tenantService.updateBranding({
                ...data,
                logo_url: data.logo_url || null,
                favicon_url: data.favicon_url || null,
                layout: data.layout as 'modern' | 'classic' | 'minimal',
            });
            if (result.success) {
                this.toastService.success('Settings saved successfully');
                this.form.markAsPristine();
            } else {
                this.toastService.error(result.error || 'Error saving settings');
            }
        } catch {
            this.toastService.error('Error saving settings');
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
        this.toastService.info('Changes discarded');
    }
}