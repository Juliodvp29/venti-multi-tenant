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
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DateRange {
    start: string | null; // ISO date string YYYY-MM-DD
    end: string | null;
}

@Component({
    selector: 'app-date-range-picker',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './date-range-picker.html',
    styleUrl: './date-range-picker.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangePicker {
    // Inputs
    value = model<DateRange>({ start: null, end: null });
    placeholder = input<string>('Filtrar por fecha');

    // Output
    rangeChange = output<DateRange>();

    // state
    open = signal(false);
    viewYear = signal(new Date().getFullYear());
    viewMonth = signal(new Date().getMonth()); // 0-indexed
    hoverDay = signal<string | null>(null);
    selecting = signal<'start' | 'end'>('start');

    readonly MONTHS = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    readonly WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

    constructor(private el: ElementRef) { }

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
        if (v.start && v.end) return `${this.formatDisplay(v.start)} – ${this.formatDisplay(v.end)}`;
        if (v.start) return `Desde ${this.formatDisplay(v.start)}`;
        return null;
    });

    private toISO(year: number, month: number, day: number): string {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    private formatDisplay(iso: string): string {
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    }

    toggleOpen() { this.open.update(v => !v); }

    prevMonth() {
        if (this.viewMonth() === 0) { this.viewMonth.set(11); this.viewYear.update(y => y - 1); }
        else this.viewMonth.update(m => m - 1);
    }

    nextMonth() {
        if (this.viewMonth() === 11) { this.viewMonth.set(0); this.viewYear.update(y => y + 1); }
        else this.viewMonth.update(m => m + 1);
    }

    selectDay(iso: string | null) {
        if (!iso) return;
        const current = this.value();
        if (this.selecting() === 'start' || !current.start) {
            this.value.set({ start: iso, end: null });
            this.selecting.set('end');
        } else {
            // Ensure start <= end
            const [s, e] = iso < current.start! ? [iso, current.start!] : [current.start!, iso];
            const range: DateRange = { start: s, end: e };
            this.value.set(range);
            this.rangeChange.emit(range);
            this.selecting.set('start');
            this.open.set(false);
        }
    }

    isStart(iso: string): boolean { return iso === this.value().start; }
    isEnd(iso: string): boolean { return iso === this.value().end; }

    isInRange(iso: string): boolean {
        const { start, end } = this.value();
        const hover = this.hoverDay();
        if (start && !end && hover) {
            const [lo, hi] = hover < start ? [hover, start] : [start, hover];
            return iso > lo && iso < hi;
        }
        if (start && end) return iso > start && iso < end;
        return false;
    }

    clearRange() {
        const range: DateRange = { start: null, end: null };
        this.value.set(range);
        this.rangeChange.emit(range);
        this.selecting.set('start');
    }
}
