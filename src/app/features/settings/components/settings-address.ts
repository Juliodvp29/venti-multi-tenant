import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
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
  readonly dirtyChange = output<boolean>();

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

    this.form.valueChanges.subscribe(() => this.dirtyChange.emit(this.form.dirty));
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
      const result = await this.tenantService.updateAddress(this.form.getRawValue());
      if (result.success) {
        if (!silent) this.toastService.success('Dirección guardada exitosamente');
        this.form.markAsPristine();
        this.dirtyChange.emit(false);
        return true;
      } else {
        if (!silent) this.toastService.error(result.error || 'Error al guardar la dirección');
        return false;
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      if (!silent) this.toastService.error('Error al guardar la dirección');
      return false;
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
      this.dirtyChange.emit(false);
    }
    this.toastService.info('Cambios descartados');
  }
}
