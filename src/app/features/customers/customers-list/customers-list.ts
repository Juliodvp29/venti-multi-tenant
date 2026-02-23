import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { CustomersService } from '@core/services/customers';
import { Customer } from '@core/models/customer';
import { ColumnDef } from '@core/types/table';

@Component({
    selector: 'app-customers-list',
    imports: [CommonModule, DynamicTable],
    templateUrl: './customers-list.html',
    styleUrls: ['./customers-list.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersList implements OnInit {
    private readonly customersService = inject(CustomersService);
    private readonly router = inject(Router);

    readonly customers = signal<Customer[]>([]);
    readonly isLoading = signal(true);
    readonly activeTab = signal<'all' | 'new' | 'returning' | 'vip'>('all');

    readonly tabs = [
        { id: 'all', label: 'Todos los Clientes' },
        { id: 'new', label: 'Nuevos' },
        { id: 'returning', label: 'Recurrentes' },
        { id: 'vip', label: 'VIP' },
    ] as const;

    readonly columns: ColumnDef<Customer>[] = [
        {
            key: 'first_name',
            label: 'Nombre Cliente',
            formatter: (_, item) => `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Invitado'
        },
        { key: 'email', label: 'Email' },
        {
            key: 'customer_segment',
            label: 'Estado',
            formatter: (val, item) => this.getSegmentLabel(item)
        },
        { key: 'total_orders', label: 'Pedidos', type: 'number' },
        { key: 'total_spent', label: 'Total Gastado', type: 'currency' },
        {
            key: 'last_order_date',
            label: 'Última Visita',
            type: 'date',
            formatter: (val) => val ? new Date(val).toLocaleDateString() : 'N/A'
        }
    ];

    readonly filteredCustomers = computed(() => {
        const list = this.customers();
        const tab = this.activeTab();

        if (tab === 'all') return list;

        return list.filter(c => {
            const segment = this.getSegmentLabel(c).toLowerCase();
            if (tab === 'new') return segment === 'nuevo';
            if (tab === 'returning') return segment === 'recurrente';
            if (tab === 'vip') return segment === 'vip';
            return true;
        });
    });

    async ngOnInit() {
        await this.loadCustomers();
    }

    async loadCustomers() {
        this.isLoading.set(true);
        try {
            const { data } = await this.customersService.getCustomers(1, 100);
            this.customers.set(data);
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    onCustomerClick(customer: Customer) {
        this.router.navigate(['/customers', customer.id]);
    }

    private getSegmentLabel(c: Customer): string {
        if (c.total_spent > 1000) return 'VIP';
        if (c.total_orders > 1) return 'Recurrente';
        return 'Nuevo';
    }
}
