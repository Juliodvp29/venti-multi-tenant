import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ShippingService } from '@core/services/shipping';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';
import { ShippingRate, ShippingZone, TaxRate } from '@core/models';
import { ShippingRateType } from '@core/enums';

@Component({
    selector: 'app-settings-shipping-taxes',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './settings-shipping-taxes.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsShippingTaxes implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly shippingService = inject(ShippingService);
    private readonly toastService = inject(ToastService);
    private readonly tenantService = inject(TenantService);

    readonly isLoading = signal(true);
    readonly isSaving = signal(false);
    readonly loadError = signal<string | null>(null);
    readonly shippingZones = signal<ShippingZone[]>([]);
    readonly taxRates = signal<TaxRate[]>([]);

    readonly shippingRateTypes = [
        { value: ShippingRateType.FlatRate, label: 'Tarifa Plana' },
        { value: ShippingRateType.WeightBased, label: 'Basado en Peso' },
        { value: ShippingRateType.PriceBased, label: 'Basado en Precio' },
    ];

    async ngOnInit() {
        await this.loadData();
    }

    async loadData() {
        this.isLoading.set(true);
        if (!this.tenantService.tenantId()) {
            this.shippingZones.set([]);
            this.taxRates.set([]);
            this.isLoading.set(false);
            return;
        }

        try {
            this.loadError.set(null);
            const [zones, taxes] = await Promise.all([
                this.shippingService.getShippingZones(),
                this.shippingService.getTaxRates(),
            ]);
            this.shippingZones.set(zones);
            this.taxRates.set(taxes);
        } catch (error) {
            console.error('Error loading shipping/taxes:', error);
            this.loadError.set('No pudimos cargar las zonas de envío y los impuestos.');
        } finally {
            this.isLoading.set(false);
        }
    }

    // ── Modal State ───────────────────────────────────────────
    readonly activeModal = signal<'zone' | 'tax' | 'rate' | null>(null);
    readonly editingZone = signal<ShippingZone | null>(null);
    readonly editingTax = signal<TaxRate | null>(null);
    readonly editingRate = signal<ShippingRate | null>(null);
    readonly activeRateZoneId = signal<string | null>(null);

    // ── Forms ────────────────────────────────────────────────
    readonly zoneForm = this.fb.nonNullable.group({
        name: ['', Validators.required],
        countries: [[] as string[]],
        is_active: [true],
    });

    readonly taxForm = this.fb.nonNullable.group({
        name: ['', Validators.required],
        rate: [0, [Validators.required, Validators.min(0)]],
        country: ['', Validators.required],
        state: [''],
        is_active: [true],
    });

    readonly rateForm = this.fb.nonNullable.group({
        name: ['', Validators.required],
        rate_amount: [0, [Validators.required, Validators.min(0)]],
        rate_type: [ShippingRateType.FlatRate, Validators.required],
        estimated_days_min: [1, [Validators.required, Validators.min(1)]],
        estimated_days_max: [5, [Validators.required, Validators.min(1)]],
        is_active: [true],
    });

    // ── Actions ──────────────────────────────────────────────

    openZoneModal(zone?: ShippingZone) {
        this.editingZone.set(zone || null);
        if (zone) {
            this.zoneForm.patchValue({
                name: zone.name,
                countries: zone.countries || [],
                is_active: zone.is_active,
            });
        } else {
            this.zoneForm.reset({ is_active: true });
        }
        this.activeModal.set('zone');
    }

    openTaxModal(tax?: TaxRate) {
        this.editingTax.set(tax || null);
        if (tax) {
            this.taxForm.patchValue({
                name: tax.name,
                rate: tax.rate * 100, // Show as percentage
                country: tax.country || '',
                state: tax.state || '',
                is_active: tax.is_active,
            });
        } else {
            this.taxForm.reset({ is_active: true, rate: 0 });
        }
        this.activeModal.set('tax');
    }

    closeModal() {
        this.activeModal.set(null);
    }

    async saveZone() {
        if (this.zoneForm.invalid) return;
        this.isSaving.set(true);
        try {
            const val = this.zoneForm.getRawValue();
            if (this.editingZone()) {
                await this.shippingService.updateShippingZone(this.editingZone()!.id, val);
            } else {
                await this.shippingService.createShippingZone(val);
            }
            this.toastService.success('Zona de envío guardada');
            await this.loadData();
            this.closeModal();
        } catch (error) {
            this.toastService.error('Error al guardar la zona');
        } finally {
            this.isSaving.set(false);
        }
    }

    async saveTax() {
        if (this.taxForm.invalid) return;
        this.isSaving.set(true);
        try {
            const val = this.taxForm.getRawValue();
            const payload = {
                ...val,
                rate: val.rate / 100, // Save as decimal
            };
            if (this.editingTax()) {
                await this.shippingService.updateTaxRate(this.editingTax()!.id, payload);
            } else {
                await this.shippingService.createTaxRate(payload);
            }
            this.toastService.success('Tasa de impuesto guardada');
            await this.loadData();
            this.closeModal();
        } catch (error) {
            this.toastService.error('Error al guardar la tasa de impuesto');
        } finally {
            this.isSaving.set(false);
        }
    }

    async deleteZone(id: string) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta zona?')) return;
        try {
            await this.shippingService.deleteShippingZone(id);
            this.toastService.success('Zona eliminada');
            await this.loadData();
        } catch (error) {
            this.toastService.error('Error al eliminar la zona');
        }
    }

    async deleteTax(id: string) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta tasa de impuesto?')) return;
        try {
            await this.shippingService.deleteTaxRate(id);
            this.toastService.success('Tasa de impuesto eliminada');
            await this.loadData();
        } catch (error) {
            this.toastService.error('Error al eliminar la tasa de impuesto');
        }
    }

    // ── Rates Management ─────────────────────────────────────

    openRateModal(zoneId: string, rate?: ShippingRate) {
        this.activeRateZoneId.set(zoneId);
        this.editingRate.set(rate || null);
        this.rateForm.reset(rate ? {
            name: rate.name,
            rate_amount: rate.rate_amount,
            rate_type: rate.rate_type,
            estimated_days_min: rate.estimated_days_min || 1,
            estimated_days_max: rate.estimated_days_max || 5,
            is_active: rate.is_active,
        } : {
            name: '',
            rate_amount: 0,
            rate_type: ShippingRateType.FlatRate,
            estimated_days_min: 1,
            estimated_days_max: 5,
            is_active: true,
        });
        this.activeModal.set('rate');
    }

    async saveRate() {
        if (this.rateForm.invalid || !this.activeRateZoneId()) return;
        this.isSaving.set(true);
        try {
            const value = this.rateForm.getRawValue();
            if (this.editingRate()) {
                await this.shippingService.updateShippingRate(this.editingRate()!.id, value);
            } else {
                await this.shippingService.createShippingRate({
                    ...value,
                    shipping_zone_id: this.activeRateZoneId()!,
                });
            }
            this.toastService.success(this.editingRate() ? 'Tarifa actualizada' : 'Tarifa agregada');
            await this.loadData();
            this.closeModal();
        } catch (error) {
            this.toastService.error(this.editingRate() ? 'Error al actualizar la tarifa' : 'Error al agregar la tarifa');
        } finally {
            this.isSaving.set(false);
        }
    }

    async deleteRate(rateId: string) {
        if (!confirm('¿Eliminar esta tarifa?')) return;
        try {
            await this.shippingService.deleteShippingRate(rateId);
            this.toastService.success('Tarifa eliminada');
            await this.loadData();
        } catch (error) {
            this.toastService.error('Error al eliminar la tarifa');
        }
    }
}
