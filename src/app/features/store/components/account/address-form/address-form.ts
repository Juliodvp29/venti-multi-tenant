import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerAddress } from '@core/models/customer';

@Component({
    selector: 'app-address-form',
    imports: [CommonModule, FormsModule],
    templateUrl: './address-form.html',
})
export class AddressForm implements OnInit {
    @Input() initialAddress?: Partial<CustomerAddress>;
    @Input() isSubmitting = false;

    @Output() save = new EventEmitter<Partial<CustomerAddress>>();
    @Output() cancel = new EventEmitter<void>();

    address: Partial<CustomerAddress> = {
        first_name: '',
        last_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'CO',
        is_default: false,
        label: 'Casa'
    };

    ngOnInit() {
        if (this.initialAddress) {
            this.address = { ...this.initialAddress };
        }
    }

    onSubmit() {
        if (!this.address.first_name || !this.address.last_name || !this.address.address_line1 || !this.address.city) {
            return;
        }
        this.save.emit(this.address);
    }
}
