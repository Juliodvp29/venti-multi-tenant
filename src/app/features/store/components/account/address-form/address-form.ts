import { Component, EventEmitter, Input, Output, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerAddress } from '@core/models/customer';
import { Dropdown } from "@shared/components/dropdown/dropdown";
import { DropdownOption } from '@shared/components/dropdown/dropdown';
import { COLOMBIA_DEPARTAMENTOS, DEPARTAMENTO_OPTIONS } from '@core/data/colombia-geo';

@Component({
    selector: 'app-address-form',
    imports: [CommonModule, FormsModule, Dropdown],
    templateUrl: './address-form.html',
})
export class AddressForm implements OnInit {
    @Input() initialAddress?: Partial<CustomerAddress>;
    @Input() isSubmitting = false;

    @Output() save = new EventEmitter<Partial<CustomerAddress>>();
    @Output() cancel = new EventEmitter<void>();

    readonly departamentoOptions: DropdownOption[] = DEPARTAMENTO_OPTIONS;

    readonly selectedDepartamento = signal<string>('');

    readonly ciudadesFiltradas = computed<DropdownOption[]>(() => {
        const depto = this.selectedDepartamento();
        if (!depto) return [];

        const deptData = COLOMBIA_DEPARTAMENTOS.find(d => d.nombre === depto);
        if (!deptData) return [];

        return deptData.ciudades.map(c => ({
            label: c.nombre,
            value: c.nombre
        }));
    });

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
            if (this.initialAddress.state) {
                this.selectedDepartamento.set(this.initialAddress.state);
            }
        }
    }

    onDepartamentoChange(departamento: string) {
        this.selectedDepartamento.set(departamento);
        this.address.state = departamento;
        this.address.city = '';
    }

    onCiudadChange(ciudad: string) {
        this.address.city = ciudad;
    }

    onSubmit() {
        if (!this.address.first_name || !this.address.last_name || !this.address.address_line1 || !this.address.city) {
            return;
        }
        this.save.emit(this.address);
    }
}
