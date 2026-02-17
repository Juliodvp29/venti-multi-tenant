import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';

@Component({
    selector: 'app-settings-general',
    imports: [ReactiveFormsModule],
    templateUrl: './settings-general.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneral {
    private readonly fb = inject(FormBuilder);
    private readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);

    readonly isSaving = signal(false);
    readonly tenant = this.tenantService.tenant;

    readonly form = this.fb.nonNullable.group({
        business_name: ['', [Validators.required, Validators.minLength(2)]],
        contact_email: ['', [Validators.required, Validators.email]],
        contact_phone: [''],
        slug: [{ value: '', disabled: true }],
        subdomain: [{ value: '', disabled: true }],
    });

    constructor() {
        effect(() => {
            const tenant = this.tenant();
            if (tenant) {
                this.form.patchValue({
                    business_name: tenant.business_name,
                    contact_email: tenant.contact_email,
                    contact_phone: tenant.contact_phone || '',
                    slug: tenant.slug,
                    subdomain: tenant.subdomain,
                });
                this.form.markAsPristine();
            }
        });
    }

    async save() {
        if (this.form.invalid) {
            this.toastService.error('Por favor, corrige los errores en el formulario');
            return;
        }

        this.isSaving.set(true);

        try {
            const result = await this.tenantService.updateBusinessInfo(this.form.getRawValue());
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
                business_name: tenant.business_name,
                contact_email: tenant.contact_email,
                contact_phone: tenant.contact_phone || '',
                slug: tenant.slug,
                subdomain: tenant.subdomain,
            });
            this.form.markAsPristine();
        }
        this.toastService.info('Cambios descartados');
    }
}
