import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ShippingService } from '@core/services/shipping';
import { ToastService } from '@core/services/toast';
import { ShippingZone, TaxRate } from '@core/models';
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

    readonly isLoading = signal(true);
    readonly isSaving = signal(false);
    readonly shippingZones = signal<ShippingZone[]>([]);
    readonly taxRates = signal<TaxRate[]>([]);

    readonly shippingRateTypes = [
        { value: ShippingRateType.FlatRate, label: 'Flat Rate' },
        { value: ShippingRateType.WeightBased, label: 'Weight Based' },
        { value: ShippingRateType.PriceBased, label: 'Price Based' },
    ];

    async ngOnInit() {
        await this.loadData();
    }

    async loadData() {
        this.isLoading.set(true);
        try {
            const [zones, taxes] = await Promise.all([
                this.shippingService.getShippingZones(),
                this.shippingService.getTaxRates(),
            ]);
            this.shippingZones.set(zones);
            this.taxRates.set(taxes);
        } catch (error) {
            console.error('Error loading shipping/taxes:', error);
            this.toastService.error('Error loading settings');
        } finally {
            this.isLoading.set(false);
        }
    }

    // ── Modal State ───────────────────────────────────────────
    readonly activeModal = signal<'zone' | 'tax' | null>(null);
    readonly editingZone = signal<ShippingZone | null>(null);
    readonly editingTax = signal<TaxRate | null>(null);

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
            this.toastService.success('Shipping zone saved');
            await this.loadData();
            this.closeModal();
        } catch (error) {
            this.toastService.error('Error saving zone');
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
            this.toastService.success('Tax rate saved');
            await this.loadData();
            this.closeModal();
        } catch (error) {
            this.toastService.error('Error saving tax rate');
        } finally {
            this.isSaving.set(false);
        }
    }

    async deleteZone(id: string) {
        if (!confirm('Are you sure you want to delete this zone?')) return;
        try {
            await this.shippingService.deleteShippingZone(id);
            this.toastService.success('Zone deleted');
            await this.loadData();
        } catch (error) {
            this.toastService.error('Error deleting zone');
        }
    }

    async deleteTax(id: string) {
        if (!confirm('Are you sure you want to delete this tax rate?')) return;
        try {
            await this.shippingService.deleteTaxRate(id);
            this.toastService.success('Tax rate deleted');
            await this.loadData();
        } catch (error) {
            this.toastService.error('Error deleting tax rate');
        }
    }

    // ── Rates Management ─────────────────────────────────────

    async addRate(zoneId: string) {
        const name = prompt('Rate name (ex: Standard Shipping)');
        if (!name) return;
        const amountStr = prompt('Price (ex: 5.00)');
        if (amountStr === null) return;
        const amount = parseFloat(amountStr);

        try {
            await this.shippingService.createShippingRate({
                shipping_zone_id: zoneId,
                name,
                rate_amount: amount,
                rate_type: ShippingRateType.FlatRate,
                is_active: true
            });
            this.toastService.success('Rate added');
            await this.loadData();
        } catch (error) {
            this.toastService.error('Error adding rate');
        }
    }

    async updateRate(rate: any) {
        const amountStr = prompt(`Update price for ${rate.name}`, rate.rate_amount.toString());
        if (amountStr === null) return;
        const amount = parseFloat(amountStr);

        try {
            await this.shippingService.updateShippingRate(rate.id, {
                rate_amount: amount
            });
            this.toastService.success('Rate updated');
            await this.loadData();
        } catch (error) {
            this.toastService.error('Error updating rate');
        }
    }

    async deleteRate(rateId: string) {
        if (!confirm('Delete this rate?')) return;
        try {
            await this.shippingService.deleteShippingRate(rateId);
            this.toastService.success('Rate deleted');
            await this.loadData();
        } catch (error) {
            this.toastService.error('Error deleting rate');
        }
    }
}
