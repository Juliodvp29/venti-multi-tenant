import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
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
    readonly dirtyChange = output<boolean>();

    readonly form = this.fb.nonNullable.group({
        business_name: ['', [Validators.required, Validators.minLength(2)]],
        contact_email: ['', [Validators.required, Validators.email]],
        contact_phone: [''],
        currency: ['USD', Validators.required],
        timezone: ['America/New_York', Validators.required],
        custom_domain: ['', Validators.pattern(/^(?=.{4,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/)],
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
                    currency: String(tenant.settings?.['currency'] || 'USD'),
                    timezone: String(tenant.settings?.['timezone'] || 'America/New_York'),
                    custom_domain: tenant.custom_domain || '',
                    slug: tenant.slug,
                    subdomain: tenant.subdomain,
                });
                this.form.markAsPristine();
            }
        });

        this.form.valueChanges.subscribe(() => this.dirtyChange.emit(this.form.dirty));
    }

    async save() {
        if (this.form.invalid) {
            this.toastService.error('Por favor, corrige los errores en el formulario');
            return;
        }

        this.isSaving.set(true);

        try {
            const { currency, timezone, custom_domain, ...businessInfo } = this.form.getRawValue();
            const tenant = this.tenant();
            if (!tenant) return;

            await this.tenantService.updateTenant(tenant.id, {
                ...businessInfo,
                custom_domain: custom_domain || null,
                settings: {
                    ...tenant.settings,
                    currency,
                    timezone,
                },
            });
            this.toastService.success('Configuración guardada exitosamente');
            this.form.markAsPristine();
            this.dirtyChange.emit(false);
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
                currency: String(tenant.settings?.['currency'] || 'USD'),
                timezone: String(tenant.settings?.['timezone'] || 'America/New_York'),
                custom_domain: tenant.custom_domain || '',
                slug: tenant.slug,
                subdomain: tenant.subdomain,
            });
            this.form.markAsPristine();
            this.dirtyChange.emit(false);
        }
        this.toastService.info('Cambios descartados');
    }
}
