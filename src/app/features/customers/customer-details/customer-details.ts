import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '@core/services/customers';
import { OrdersService } from '@core/services/orders';
import { ToastService } from '@core/services/toast';
import { Customer } from '@core/models/customer';
import { Order } from '@core/models/order';

@Component({
    selector: 'app-customer-details',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './customer-details.html',
    styleUrls: ['./customer-details.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetails implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly customersService = inject(CustomersService);
    private readonly ordersService = inject(OrdersService);
    private readonly toast = inject(ToastService);

    readonly customer = signal<Customer | null>(null);
    readonly recentOrders = signal<Order[]>([]);
    readonly isLoading = signal(true);

    noteText = '';

    readonly fullName = computed(() => {
        const c = this.customer();
        if (!c) return 'Cargando...';
        return `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Invitado';
    });

    readonly initials = computed(() => {
        const c = this.customer();
        if (!c) return '?';
        return (c.first_name?.[0] || 'I').toUpperCase() + (c.last_name?.[0] || '').toUpperCase();
    });

    readonly avgOrderValue = computed(() => {
        const c = this.customer();
        if (!c || c.total_orders === 0) return 0;
        return c.total_spent / c.total_orders;
    });

    readonly defaultAddress = computed(() => {
        const addresses = this.customer()?.addresses || [];
        const def = addresses.find(a => a.is_default) || addresses[0];
        if (!def) return null;
        return `${def.address_line1}, ${def.city}, ${def.country}`;
    });

    readonly segment = computed(() => {
        const c = this.customer();
        if (!c) return 'Cargando';
        if (c.total_spent > 1000) return 'VIP';
        if (c.total_orders > 1) return 'Recurrente';
        return 'Nuevo';
    });

    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            await this.loadCustomer(id);
        }
    }

    async loadCustomer(id: string) {
        this.isLoading.set(true);
        try {
            const data = await this.customersService.getCustomer(id);
            this.customer.set(data);

            // Load recent orders for this customer using the new filter
            const ordersRes = await this.ordersService.getOrders(1, 5, { customer_id: id });
            this.recentOrders.set(ordersRes.data);

        } catch (error) {
            console.error('Error loading customer:', error);
            this.toast.error('No se pudo cargar la información del cliente');
        } finally {
            this.isLoading.set(false);
        }
    }

    saveNote() {
        if (!this.noteText.trim()) return;

        // In a real app, this would call a notes service
        this.toast.success('Nota guardada correctamente');
        this.noteText = '';
    }
}
