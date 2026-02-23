import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostListener,
    input,
    model,
    output,
    signal,
    computed,
    forwardRef,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
    selector: 'app-date-picker',
    imports: [CommonModule, FormsModule],
    templateUrl: './date-picker.html',
    styleUrl: './date-picker.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DatePicker),
            multi: true,
        },
    ],
})
export class DatePicker implements ControlValueAccessor, OnInit {
    // Inputs
    placeholder = input<string>('Seleccionar fecha');
    align = input<'left' | 'right'>('left');
    minDate = input<string | null>(null);
    maxDate = input<string | null>(null);

    // State
    value = signal<string | null>(null); // ISO date string YYYY-MM-DD
    open = signal(false);
    viewDate = signal(new Date());

    viewYear = computed(() => this.viewDate().getFullYear());
    viewMonth = computed(() => this.viewDate().getMonth());

    readonly MONTHS = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    readonly WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

    // ControlValueAccessor members
    onChange: any = () => { };
    onTouched: any = () => { };
    disabled = signal(false);

    constructor(private el: ElementRef) { }

    ngOnInit() {
        if (this.value()) {
            this.viewDate.set(new Date(this.value()!));
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.el.nativeElement.contains(event.target)) {
            this.open.set(false);
        }
    }

    readonly calendarDays = computed(() => {
        const year = this.viewYear();
        const month = this.viewMonth();
        const firstDay = new Date(year, month, 1);
        // Monday-based: 0=Mon … 6=Sun
        let startOffset = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days: (string | null)[] = [];
        for (let i = 0; i < startOffset; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) {
            days.push(this.toISO(year, month, d));
        }
        return days;
    });

    readonly displayLabel = computed(() => {
        const v = this.value();
        if (!v) return null;
        return this.formatDisplay(v);
    });

    private toISO(year: number, month: number, day: number): string {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    private formatDisplay(iso: string): string {
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    }

    toggleOpen() {
        if (this.disabled()) return;
        this.open.update(v => !v);
    }

    prevMonth() {
        const d = new Date(this.viewDate());
        d.setMonth(d.getMonth() - 1);
        this.viewDate.set(d);
    }

    nextMonth() {
        const d = new Date(this.viewDate());
        d.setMonth(d.getMonth() + 1);
        this.viewDate.set(d);
    }

    selectDay(iso: string | null) {
        if (!iso || this.isDisabled(iso)) return;
        this.value.set(iso);
        this.onChange(iso);
        this.onTouched();
        this.open.set(false);
    }

    selectToday() {
        const today = new Date();
        const iso = this.toISO(today.getFullYear(), today.getMonth(), today.getDate());
        this.selectDay(iso);
    }

    clearValue() {
        this.value.set(null);
        this.onChange(null);
        this.onTouched();
    }

    isSelected(iso: string): boolean {
        return iso === this.value();
    }

    isToday(iso: string): boolean {
        const today = new Date();
        return iso === this.toISO(today.getFullYear(), today.getMonth(), today.getDate());
    }

    isDisabled(iso: string): boolean {
        if (this.minDate() && iso < this.minDate()!) return true;
        if (this.maxDate() && iso > this.maxDate()!) return true;
        return false;
    }

    // ControlValueAccessor implementation
    writeValue(value: string | null): void {
        this.value.set(value);
        if (value) {
            this.viewDate.set(new Date(value));
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }
}
