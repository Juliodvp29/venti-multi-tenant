import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  inject,
  viewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColumnDef, TableAction, TableSort } from '@core/types/table';
import { ToastService } from '@core/services/toast';
import { FileProcessorService } from '@core/services/file-processor';

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dynamic-table.html',
  styleUrl: './dynamic-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CurrencyPipe, DatePipe]
})
export class DynamicTable<T extends Record<string, any>> {
  private readonly toast = inject(ToastService);
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly datePipe = inject(DatePipe);
  private readonly fileProcessor = inject(FileProcessorService);

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // Inputs
  data = input.required<T[]>();
  columns = input.required<ColumnDef<T>[]>();
  actions = input<TableAction<T>[]>([]);
  title = input<string>('');
  description = input<string>('');
  pageSize = input<number>(10);
  searchPlaceholder = input<string>('Search...');
  allowImport = input<boolean>(false);

  // Outputs
  actionClick = output<{ actionId: string; item: T }>();
  rowClick = output<T>();
  importData = output<Record<string, any>[]>();

  // Reactive State
  searchQuery = signal('');
  sortState = signal<TableSort | null>(null);
  currentPage = signal(1);
  openMenuId = signal<string | null>(null);
  openMenuItem = signal<T | null>(null);
  menuPosition = signal<{ top: number; left: number } | null>(null);

  @HostListener('document:click')
  onDocumentClick() {
    this.openMenuId.set(null);
    this.menuPosition.set(null);
  }

  // Computed: Filtered and Sorted Data
  filteredData = computed(() => {
    let result = [...this.data()];
    const query = this.searchQuery().toLowerCase().trim();

    // 1. Filter
    if (query) {
      result = result.filter((item) => {
        return this.columns().some((col) => {
          const value = item[col.key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    // 2. Sort
    const sort = this.sortState();
    if (sort) {
      result.sort((a, b) => {
        const valA = a[sort.key];
        const valB = b[sort.key];

        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  });

  // Computed: Paginated Data
  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredData().slice(start, end);
  });

  // Computed: Summary
  totalItems = computed(() => this.filteredData().length);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  endIndex = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  // Handlers
  onSort(key: string) {
    const current = this.sortState();
    if (current?.key === key) {
      if (current.direction === 'asc') {
        this.sortState.set({ key, direction: 'desc' });
      } else {
        this.sortState.set(null);
      }
    } else {
      this.sortState.set({ key, direction: 'asc' });
    }
    this.currentPage.set(1);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  toggleMenu(event: Event, item: T) {
    event.stopPropagation();
    const itemId = item['id'];
    if (this.openMenuId() === itemId) {
      this.openMenuId.set(null);
      this.openMenuItem.set(null);
      this.menuPosition.set(null);
      return;
    }
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    this.menuPosition.set({
      top: rect.bottom + 6,
      left: rect.right - 192
    });
    this.openMenuId.set(itemId);
    this.openMenuItem.set(item);
  }

  closeMenu() {
    this.openMenuId.set(null);
    this.openMenuItem.set(null);
    this.menuPosition.set(null);
  }

  getItemById(id: string): T | undefined {
    return this.paginatedData().find(item => item['id'] === id);
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  exportToCsv() {
    if (this.filteredData().length === 0) {
      this.toast.error('No hay datos para exportar');
      return;
    }

    const headers = this.columns().map(c => c.label).join(',');
    const rows = this.filteredData().map(item => {
      return this.columns().map(col => {
        let val = item[col.key];
        if (col.formatter) val = col.formatter(val, item);
        // Basic escaping
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${this.title() || 'export'}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toast.success('Exportación completada');
  }

  triggerImport() {
    this.fileInput()?.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    try {
      const data = await this.fileProcessor.parseFile(file);
      if (data.length > 0) {
        this.importData.emit(data);
        this.toast.info(`${data.length} registros leídos. Iniciando importación...`);
      } else {
        this.toast.error('El archivo está vacío o tiene un formato inválido.');
      }
    } catch (error: any) {
      console.error('Error al leer archivo:', error);
      this.toast.error(error?.message ?? 'Error al procesar el archivo.');
    } finally {
      input.value = '';
    }
  }

  formatValue(col: ColumnDef<T>, item: T): any {
    const value = item[col.key];
    if (col.formatter) return col.formatter(value, item);

    switch (col.type) {
      case 'currency':
        return this.currencyPipe.transform(value, 'USD', 'symbol', '1.2-2');
      case 'date':
        return this.datePipe.transform(value, 'mediumDate');
      default:
        return value;
    }
  }
}
