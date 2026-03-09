import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '@core/services/inventory';
import { InventoryMovement } from '@models/inventory';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { ColumnDef } from '@core/types/table';

@Component({
    selector: 'app-inventory-history',
    imports: [CommonModule, DynamicTable],
    templateUrl: './inventory-history.html',
    styleUrl: './inventory-history.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryHistory implements OnInit {
    private readonly inventoryService = inject(InventoryService);

    readonly movements = signal<InventoryMovement[]>([]);
    readonly totalItems = signal(0);
    readonly currentPage = signal(1);

    readonly columns: ColumnDef<InventoryMovement>[] = [
        {
            key: 'created_at',
            label: 'Fecha',
            type: 'date',
            formatter: (val) => new Date(val).toLocaleString()
        },
        {
            key: 'product_name',
            label: 'Producto',
            formatter: (val, item) => {
                return item.variant_name ? `${val} (${item.variant_name})` : val;
            }
        },
        {
            key: 'type',
            label: 'Tipo',
            formatter: (val) => {
                const types: Record<string, { label: string, class: string }> = {
                    sale: { label: 'Venta', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                    adjustment: { label: 'Ajuste', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                    manual: { label: 'Inicial', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
                    return: { label: 'Devolución', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
                };
                const config = types[val] || { label: val, class: 'bg-gray-100 text-gray-700' };
                return `<span class="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.class}">${config.label}</span>`;
            }
        },
        {
            key: 'quantity_change',
            label: 'Cantidad',
            formatter: (val) => {
                if (val === 0) return '<span class="text-gray-400 dark:text-gray-500">N/D</span>';
                const color = val > 0 ? 'text-emerald-600' : 'text-red-600';
                return `<span class="font-mono font-bold ${color}">${val > 0 ? '+' : ''}${val}</span>`;
            }
        },
        {
            key: 'new_quantity',
            label: 'Stock Final',
            formatter: (val, item) => {
                if (item.type === 'sale') return '<span class="text-gray-400 dark:text-gray-500">N/D</span>';
                return `<span class="font-mono font-bold">${val}</span>`;
            }
        },
        {
            key: 'user_email',
            label: 'Usuario',
            formatter: (val) => val || 'Sistema'
        }
    ];

    ngOnInit() {
        this.loadMovements();
    }

    async loadMovements() {
        try {
            const { data, count } = await this.inventoryService.getMovements(this.currentPage());
            this.movements.set(data);
            this.totalItems.set(count);
        } catch (error) {
            console.error('Error loading inventory movements:', error);
        }
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadMovements();
    }
}
