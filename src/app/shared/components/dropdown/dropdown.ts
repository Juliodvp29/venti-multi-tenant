import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownMenuPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  openUp: boolean;
}

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
  styleUrl: './dropdown.css',
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
  menuPosition = signal<DropdownMenuPosition | null>(null);

  private readonly toggleBtn = viewChild<ElementRef<HTMLButtonElement>>('toggleBtn');

  get selectedOption() {
    const currentValue = this.value();
    return (
      this.options().find((opt) => opt.value === currentValue) ||
      (typeof currentValue === 'string'
        ? this.options().find(
            (opt) =>
              typeof opt.value === 'string' &&
              this.normalizeText(opt.value) === this.normalizeText(currentValue),
          )
        : undefined)
    );
  }

  private normalizeText(value: string): string {
    return value
      .split(',')[0]
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .toLowerCase();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange() {
    // La posición es fija: ante scroll/resize se cierra para no quedar flotando.
    if (this.isOpen()) this.close();
  }

  toggle() {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
      return;
    }
    this.menuPosition.set(this.computeMenuPosition());
    this.isOpen.set(true);
  }

  select(option: DropdownOption) {
    if (this.disabled()) return;
    this.valueChange.emit(option.value);
    this.close();
  }

  close() {
    this.isOpen.set(false);
    this.menuPosition.set(null);
  }

  /**
   * Calcula la posición fija del menú a partir del botón (mismo patrón que
   * DynamicTable): así ningún ancestro con overflow-hidden/auto lo recorta.
   * Si no cabe debajo, se abre hacia arriba.
   */
  private computeMenuPosition(): DropdownMenuPosition | null {
    const btn = this.toggleBtn()?.nativeElement;
    if (!btn || typeof window === 'undefined') return null;
    const rect = btn.getBoundingClientRect();
    const GAP = 8;
    const estimatedHeight = Math.min(this.options().length * 44 + 12, 248);
    const fitsBelow = rect.bottom + GAP + estimatedHeight <= window.innerHeight;
    const fitsAbove = rect.top - GAP - estimatedHeight >= 0;
    const openUp = !fitsBelow && fitsAbove;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8));
    if (openUp) {
      return { bottom: window.innerHeight - rect.top + GAP, left, width: rect.width, openUp };
    }
    return { top: rect.bottom + GAP, left, width: rect.width, openUp };
  }
}
