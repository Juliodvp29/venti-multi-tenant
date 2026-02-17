import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { Tenant } from '@core/models';

type SettingsTab = 'general' | 'branding' | 'address';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private readonly fb = inject(FormBuilder);
  private readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);

  // ── State ────────────────────────────────────────────────
  readonly activeTab = signal<SettingsTab>('general');
  readonly isSaving = signal(false);

  // ── Tenant Data ──────────────────────────────────────────
  readonly tenant = this.tenantService.tenant;
  readonly loading = this.tenantService.loading;
  readonly error = this.tenantService.error;

  // ── Forms ────────────────────────────────────────────────
  readonly generalForm = this.fb.nonNullable.group({
    business_name: ['', [Validators.required, Validators.minLength(2)]],
    contact_email: ['', [Validators.required, Validators.email]],
    contact_phone: [''],
    slug: [{ value: '', disabled: true }],
    subdomain: [{ value: '', disabled: true }],
  });

  readonly brandingForm = this.fb.nonNullable.group({
    primary_color: ['#000000', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    secondary_color: ['#ffffff', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    accent_color: ['#3b82f6', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    logo_url: [''],
    favicon_url: [''],
  });

  readonly addressForm = this.fb.nonNullable.group({
    address_line1: [''],
    address_line2: [''],
    city: [''],
    state: [''],
    postal_code: [''],
    country: [''],
  });

  // ── Computed ─────────────────────────────────────────────
  readonly hasUnsavedChanges = computed(() => {
    return this.generalForm.dirty || this.brandingForm.dirty || this.addressForm.dirty;
  });

  readonly currentForm = computed(() => {
    const tab = this.activeTab();
    if (tab === 'general') return this.generalForm;
    if (tab === 'branding') return this.brandingForm;
    return this.addressForm;
  });

  readonly isFormValid = computed(() => {
    return this.currentForm().valid;
  });

  constructor() {
    // Initialize forms when tenant data loads
    effect(() => {
      const tenant = this.tenantService.tenant();
      if (tenant) {
        this.initializeForms(tenant);
      }
    });
  }

  // ── Methods ──────────────────────────────────────────────

  private initializeForms(tenant: Tenant) {
    this.generalForm.patchValue({
      business_name: tenant.business_name,
      contact_email: tenant.contact_email,
      contact_phone: tenant.contact_phone || '',
      slug: tenant.slug,
      subdomain: tenant.subdomain,
    });

    this.brandingForm.patchValue({
      primary_color: tenant.primary_color,
      secondary_color: tenant.secondary_color,
      accent_color: tenant.accent_color,
      logo_url: tenant.logo_url || '',
      favicon_url: tenant.favicon_url || '',
    });

    this.addressForm.patchValue({
      address_line1: tenant.address_line1 || '',
      address_line2: tenant.address_line2 || '',
      city: tenant.city || '',
      state: tenant.state || '',
      postal_code: tenant.postal_code || '',
      country: tenant.country || '',
    });

    // Mark forms as pristine after initialization
    this.generalForm.markAsPristine();
    this.brandingForm.markAsPristine();
    this.addressForm.markAsPristine();
  }

  setActiveTab(tab: SettingsTab) {
    this.activeTab.set(tab);
  }

  async saveChanges() {
    const tab = this.activeTab();
    const form = this.currentForm();

    if (form.invalid) {
      this.toastService.error('Por favor, corrige los errores en el formulario');
      return;
    }

    this.isSaving.set(true);

    try {
      let result;

      if (tab === 'general') {
        result = await this.tenantService.updateBusinessInfo(this.generalForm.getRawValue());
      } else if (tab === 'branding') {
        const brandingData = this.brandingForm.getRawValue();
        result = await this.tenantService.updateBranding({
          ...brandingData,
          logo_url: brandingData.logo_url || null,
          favicon_url: brandingData.favicon_url || null,
        });
      } else {
        const addressData = this.addressForm.getRawValue();
        result = await this.tenantService.updateAddress({
          ...addressData,
          address_line1: addressData.address_line1 || null,
          address_line2: addressData.address_line2 || null,
          city: addressData.city || null,
          state: addressData.state || null,
          postal_code: addressData.postal_code || null,
          country: addressData.country || null,
        });
      }

      if (result.success) {
        this.toastService.success('Configuración guardada correctamente');
        form.markAsPristine();
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

  cancelChanges() {
    const tenant = this.tenant();
    if (tenant) {
      this.initializeForms(tenant);
    }
    this.toastService.info('Cambios descartados');
  }
}
