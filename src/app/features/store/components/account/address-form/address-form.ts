import { Component, EventEmitter, Input, Output, OnInit, signal, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerAddress } from '@core/models/customer';
import { Dropdown } from "@shared/components/dropdown/dropdown";
import { DropdownOption } from '@shared/components/dropdown/dropdown';
import { GeographyService, ApiDepartment } from '@core/services/geography.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-address-form',
    imports: [CommonModule, FormsModule, Dropdown],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './address-form.html',
})
export class AddressForm implements OnInit {
    private readonly geographyService = inject(GeographyService);

    @Input() initialAddress?: Partial<CustomerAddress>;
    @Input() isSubmitting = false;

    @Output() save = new EventEmitter<Partial<CustomerAddress>>();
    @Output() cancel = new EventEmitter<void>();

    readonly departamentoOptions = signal<DropdownOption[]>([]);
    readonly ciudadOptions = signal<DropdownOption[]>([]);

    readonly selectedDepartamento = signal<string>('');
    private departments: ApiDepartment[] = [];

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

    async ngOnInit() {
        await this.loadDepartments();
        
        if (this.initialAddress) {
            this.address = { ...this.initialAddress };
            if (this.initialAddress.state) {
                this.selectedDepartamento.set(this.initialAddress.state);
                const dept = this.departments.find(d => d.name === this.initialAddress!.state);
                if (dept) {
                    await this.loadCities(dept.id);
                }
            }
        }
    }

    private async loadDepartments() {
        try {
            const data = await firstValueFrom(this.geographyService.getDepartments());
            this.departments = data;
            this.departamentoOptions.set(data.map(d => ({
                label: d.name,
                value: d.name
            })));
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    }

    private async loadCities(departmentId: number) {
        try {
            const data = await firstValueFrom(this.geographyService.getCitiesByDepartment(departmentId));
            this.ciudadOptions.set(data.map(c => ({
                label: c.name,
                value: c.name
            })));
        } catch (error) {
            console.error('Error loading cities:', error);
            this.ciudadOptions.set([]);
        }
    }

    async onDepartamentoChange(departamentoName: string) {
        this.selectedDepartamento.set(departamentoName);
        this.address.state = departamentoName;
        this.address.city = '';
        this.ciudadOptions.set([]);

        const dept = this.departments.find(d => d.name === departamentoName);
        if (dept) {
            await this.loadCities(dept.id);
        }
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

