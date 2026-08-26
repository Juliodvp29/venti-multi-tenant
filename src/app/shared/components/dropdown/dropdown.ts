import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
    label: string;
    value: any;
    icon?: string;
}

@Component({
    selector: 'app-dropdown',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './dropdown.html',
    styleUrl: './dropdown.css'
})
export class Dropdown {
    options = input.required<DropdownOption[]>();
    value = input.required<any>();
    placeholder = input<string>('Seleccionar...');
    label = input<string>();
    width = input<string>('w-full');
    disabled = input<boolean>(false);

    valueChange = output<any>();

    isOpen = signal(false);

    get selectedOption() {
        const currentValue = this.value();
        return this.options().find(opt => opt.value === currentValue)
            || (typeof currentValue === 'string'
                ? this.options().find(opt => typeof opt.value === 'string' && this.normalizeText(opt.value) === this.normalizeText(currentValue))
                : undefined);
    }

    private normalizeText(value: string): string {
        return value.split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase();
    }

    toggle() {
        if (this.disabled()) return;
        this.isOpen.set(!this.isOpen());
    }

    select(option: DropdownOption) {
        if (this.disabled()) return;
        this.valueChange.emit(option.value);
        this.isOpen.set(false);
    }
}
