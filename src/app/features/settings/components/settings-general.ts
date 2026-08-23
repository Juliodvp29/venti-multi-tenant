import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { Dropdown } from '@shared/components/dropdown/dropdown';

@Component({
    selector: 'app-settings-general',
    imports: [ReactiveFormsModule, Dropdown],
    templateUrl: './settings-general.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneral {
    private readonly fb = inject(FormBuilder);
    private readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);

    readonly isSaving = signal(false);
    readonly saveError = signal<string | null>(null);
    readonly isVerifyingDomain = signal(false);
    readonly tenant = this.tenantService.tenant;
    readonly dirtyChange = output<boolean>();

    readonly currencyOptions = [
        { label: 'USD - Dólar estadounidense', value: 'USD' },
        { label: 'MXN - Peso mexicano', value: 'MXN' },
        { label: 'COP - Peso colombiano', value: 'COP' },
        { label: 'EUR - Euro', value: 'EUR' },
        { label: 'CAD - Dólar canadiense', value: 'CAD' },
    ];

    readonly timezoneOptions = [
        { label: 'Nueva York (ET)', value: 'America/New_York' },
        { label: 'Ciudad de México (CT)', value: 'America/Mexico_City' },
        { label: 'Bogotá (COT)', value: 'America/Bogota' },
        { label: 'Los Ángeles (PT)', value: 'America/Los_Angeles' },
        { label: 'Madrid (CET)', value: 'Europe/Madrid' },
    ];

    readonly domainStatus = () => {
        const status = this.tenant()?.settings?.['custom_domain_status'];
        return status === 'verified' || status === 'error' ? status : 'pending';
    };
    readonly domainError = () => String(this.tenant()?.settings?.['custom_domain_error'] || '');

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

        this.form.valueChanges.subscribe(() => {
            this.saveError.set(null);
            this.dirtyChange.emit(this.form.dirty);
        });
    }

    async save() {
        if (this.form.invalid) {
            this.toastService.error('Por favor, corrige los errores en el formulario');
            return;
        }

        this.isSaving.set(true);
        this.saveError.set(null);

        try {
            const { currency, timezone, custom_domain, ...businessInfo } = this.form.getRawValue();
            const tenant = this.tenant();
            if (!tenant) return;
            const normalizedDomain = custom_domain.trim() || null;
            const domainChanged = normalizedDomain !== (tenant.custom_domain || null);

            await this.tenantService.updateTenant(tenant.id, {
                ...businessInfo,
                custom_domain: normalizedDomain,
                settings: {
                    ...tenant.settings,
                    currency,
                    timezone,
                    ...(domainChanged ? {
                        custom_domain_status: normalizedDomain ? 'pending' : null,
                        custom_domain_last_checked_at: null,
                        custom_domain_error: null,
                    } : {}),
                },
            });
            this.toastService.success('Configuración guardada exitosamente');
            this.form.markAsPristine();
            this.dirtyChange.emit(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            this.saveError.set('No pudimos guardar los cambios. Revisa tu conexión e inténtalo de nuevo.');
            this.toastService.error('Error al guardar la configuración');
        } finally {
            this.isSaving.set(false);
        }
    }

    async verifyDomain() {
        const domain = this.form.controls.custom_domain.value.trim();
        if (!domain || this.form.controls.custom_domain.invalid) {
            this.form.controls.custom_domain.markAsTouched();
            return;
        }

        this.isVerifyingDomain.set(true);
        try {
            const result = await this.tenantService.verifyCustomDomain(domain);
            if (result.status === 'verified') {
                this.toastService.success('Dominio verificado correctamente');
            } else {
                this.toastService.warning(result.reason || 'El dominio todavía no está configurado');
            }
        } catch (error) {
            console.error('Error verifying custom domain:', error);
            this.toastService.error('No se pudo verificar el dominio');
        } finally {
            this.isVerifyingDomain.set(false);
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
