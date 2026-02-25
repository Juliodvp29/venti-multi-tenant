import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerAddress } from '@core/models/customer';
import { CustomersService } from '@core/services/customers';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';
import { AddressForm } from '../address-form/address-form';

@Component({
    selector: 'app-account-addresses',
    imports: [CommonModule, AddressForm],
    templateUrl: './addresses.html',
})
export class Addresses implements OnInit {
    private readonly customersService = inject(CustomersService);
    private readonly authService = inject(AuthService);
    private readonly toast = inject(ToastService);

    readonly addresses = signal<CustomerAddress[]>([]);
    readonly loading = signal(true);

    readonly showForm = signal(false);
    readonly editingAddress = signal<CustomerAddress | null>(null);
    readonly isSubmitting = signal(false);

    private customerId = signal<string | null>(null);

    ngOnInit() {
        this.loadAddresses();
    }

    async loadAddresses() {
        this.loading.set(true);
        try {
            const user = this.authService.user();
            if (!user) return; // Optional: handle not logged in state

            // Wait for auth to resolve customer
            const customer = await this.customersService.getCustomers(1, 1, { search: user.email }).then(res => res.data[0]);
            if (!customer) return;

            this.customerId.set(customer.id);

            const addrList = await this.customersService.getCustomerAddresses(customer.id);
            this.addresses.set(addrList);
        } catch (e: any) {
            this.toast.error('No se pudieron cargar las direcciones');
            console.error(e);
        } finally {
            this.loading.set(false);
        }
    }

    openNew() {
        this.editingAddress.set(null);
        this.showForm.set(true);
    }

    openEdit(address: CustomerAddress) {
        this.editingAddress.set(address);
        this.showForm.set(true);
    }

    closeForm() {
        this.showForm.set(false);
        this.editingAddress.set(null);
    }

    async onSave(addressPayload: Partial<CustomerAddress>) {
        if (!this.customerId()) return;

        this.isSubmitting.set(true);
        try {
            if (this.editingAddress()) {
                await this.customersService.updateAddress(this.editingAddress()!.id, addressPayload);
                this.toast.success('Dirección actualizada exitosamente');
            } else {
                await this.customersService.addAddress(this.customerId()!, addressPayload);
                this.toast.success('Dirección agregada exitosamente');
            }
            this.closeForm();
            await this.loadAddresses();
        } catch (e: any) {
            this.toast.error('Ocurrió un error guardando la dirección');
            console.error(e);
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async deleteAddress(address: CustomerAddress) {
        const confirmed = await this.toast.confirm(
            '¿Estás seguro de que deseas eliminar esta dirección?',
            'Eliminar dirección'
        );
        if (!confirmed) return;

        try {
            await this.customersService.deleteAddress(address.id);
            this.toast.success('Dirección eliminada exitosamente');
            await this.loadAddresses();
        } catch (e: any) {
            this.toast.error('Ocurrió un error al eliminar');
            console.error(e);
        }
    }

    async setAsDefault(address: CustomerAddress) {
        if (!this.customerId() || address.is_default) return;

        try {
            await this.customersService.setDefaultAddress(this.customerId()!, address.id, 'shipping');
            this.toast.success('Dirección predeterminada actualizada');
            await this.loadAddresses();
        } catch (e: any) {
            this.toast.error('Ocurrió un error al actualizar');
            console.error(e);
        }
    }
}
