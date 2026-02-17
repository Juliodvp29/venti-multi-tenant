import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';

@Component({
    selector: 'app-settings-address',
    imports: [ReactiveFormsModule],
    templateUrl: './settings-address.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAddress {
    private readonly fb = inject(FormBuilder);
    readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);

    readonly isSaving = signal(false);
    readonly tenant = this.tenantService.tenant;

    readonly form = this.fb.nonNullable.group({
        address_line1: ['', [Validators.required]],
        address_line2: [''],
        city: ['', [Validators.required]],
        state: ['', [Validators.required]],
        postal_code: ['', [Validators.required]],
        country: ['US', [Validators.required]],
    });

    constructor() {
        effect(() => {
            const tenant = this.tenant();
            if (tenant) {
                this.form.patchValue({
                    address_line1: tenant.address_line1 || '',
                    address_line2: tenant.address_line2 || '',
                    city: tenant.city || '',
                    state: tenant.state || '',
                    postal_code: tenant.postal_code || '',
                    country: tenant.country || 'US',
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
            const result = await this.tenantService.updateAddress(this.form.getRawValue());
            if (result.success) {
                this.toastService.success('Dirección guardada correctamente');
                this.form.markAsPristine();
            } else {
                this.toastService.error(result.error || 'Error al guardar la dirección');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.toastService.error('Error al guardar la dirección');
        } finally {
            this.isSaving.set(false);
        }
    }

    cancel() {
        const tenant = this.tenant();
        if (tenant) {
            this.form.patchValue({
                address_line1: tenant.address_line1 || '',
                address_line2: tenant.address_line2 || '',
                city: tenant.city || '',
                state: tenant.state || '',
                postal_code: tenant.postal_code || '',
                country: tenant.country || 'US',
            });
            this.form.markAsPristine();
        }
        this.toastService.info('Cambios descartados');
    }
}
