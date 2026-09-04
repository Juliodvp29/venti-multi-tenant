import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommandPaletteService, PaletteItemKind } from '@core/services/command-palette';

const KIND_BADGE: Record<PaletteItemKind, string> = {
  navigation: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  product: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  order: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  customer: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

const KIND_ICON: Record<PaletteItemKind, string> = {
  navigation: '→',
  product: '◧',
  order: '▤',
  customer: '●',
};

const KIND_LABEL: Record<PaletteItemKind, string> = {
  navigation: 'Ir a',
  product: 'Producto',
  order: 'Orden',
  customer: 'Cliente',
};

@Component({
  selector: 'app-command-palette',
  imports: [CommonModule],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPalette {
  protected readonly palette = inject(CommandPaletteService);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly activeIndex = signal(0);

  private readonly itemCount = computed(() => this.palette.flatItems().length);

  constructor() {
    // Al abrir: resetear selección y enfocar el input.
    effect(() => {
      if (this.palette.isOpen()) {
        this.activeIndex.set(0);
        // El input existe tras el @if: esperar al siguiente ciclo de render.
        setTimeout(() => this.searchInput()?.nativeElement.focus(), 0);
      }
    });
    // Si cambian los resultados, mantener el índice dentro de rango.
    effect(() => {
      const count = this.itemCount();
      if (this.activeIndex() >= count) this.activeIndex.set(Math.max(0, count - 1));
    });
  }

  /** Atajo global Cmd+K / Ctrl+K y cierre con Escape. */
  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    const isPaletteShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (isPaletteShortcut) {
      event.preventDefault();
      this.palette.toggle();
      return;
    }
    if (event.key === 'Escape' && this.palette.isOpen()) {
      event.preventDefault();
      this.palette.close();
    }
  }

  onQueryInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.palette.setQuery(value);
    this.activeIndex.set(0);
  }

  onInputKeydown(event: KeyboardEvent): void {
    const items = this.palette.flatItems();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (items.length > 0) this.activeIndex.update((i) => (i + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (items.length > 0) this.activeIndex.update((i) => (i - 1 + items.length) % items.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[this.activeIndex()];
      if (item) void this.palette.go(item);
    }
  }

  setActiveFromHover(id: string): void {
    const idx = this.flatIndexOf(id);
    if (idx >= 0 && idx !== this.activeIndex()) this.activeIndex.set(idx);
  }

  flatIndexOf(id: string): number {
    return this.palette.flatItems().findIndex((item) => item.id === id);
  }

  badgeClass(kind: PaletteItemKind): string {
    return KIND_BADGE[kind];
  }

  badgeIcon(kind: PaletteItemKind): string {
    return KIND_ICON[kind];
  }

  kindLabel(kind: PaletteItemKind): string {
    return KIND_LABEL[kind];
  }
}
