import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Order, OrderStatusHistory } from '@core/models/order';
import { OrderStatus } from '@core/enums';
import { OrdersService } from '@core/services/orders';
import { ToastService } from '@core/services/toast';
import { OrderStatusBadge } from '@shared/components/order-status-badge/order-status-badge';

@Component({
    selector: 'app-order-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, OrderStatusBadge],
    templateUrl: './order-detail.html',
    styleUrl: './order-detail.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [CurrencyPipe, DatePipe],
})
export class OrderDetail implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly ordersService = inject(OrdersService);
    private readonly toast = inject(ToastService);
    readonly currencyPipe = inject(CurrencyPipe);
    readonly datePipe = inject(DatePipe);

    // State
    readonly isLoading = signal(true);
    readonly isSavingNote = signal(false);
    readonly isUpdatingStatus = signal(false);
    readonly order = signal<Order | null>(null);
    readonly internalNote = signal('');
    readonly selectedStatus = signal<OrderStatus | ''>('');

    // Status options for change
    readonly statusOptions: { value: OrderStatus; label: string }[] = [
        { value: OrderStatus.Pending, label: 'Pendiente' },
        { value: OrderStatus.Processing, label: 'Procesando' },
        { value: OrderStatus.Paid, label: 'Pagado' },
        { value: OrderStatus.Shipped, label: 'Enviado' },
        { value: OrderStatus.Delivered, label: 'Entregado' },
        { value: OrderStatus.Cancelled, label: 'Cancelado' },
        { value: OrderStatus.Refunded, label: 'Reembolsado' },
    ];

    // Computed
    readonly customerFullName = computed(() => {
        const o = this.order();
        if (!o) return '';
        return [o.customer_first_name, o.customer_last_name].filter(Boolean).join(' ') || o.customer_email;
    });

    readonly customerInitials = computed(() => {
        const name = this.customerFullName();
        const parts = name.trim().split(' ');
        return parts.length >= 2
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : name.substring(0, 2).toUpperCase();
    });

    readonly shippingAddress = computed(() => {
        const o = this.order();
        if (!o || !o.shipping_address_line1) return null;
        return [
            [o.shipping_first_name, o.shipping_last_name].filter(Boolean).join(' '),
            o.shipping_address_line1,
            o.shipping_address_line2,
            [o.shipping_city, o.shipping_state, o.shipping_postal_code].filter(Boolean).join(', '),
            o.shipping_country,
        ].filter(Boolean);
    });

    readonly isBillingSameAsShipping = computed(() => {
        const o = this.order();
        if (!o) return false;
        return o.billing_address_line1 === o.shipping_address_line1
            && o.billing_city === o.shipping_city;
    });

    readonly statusHistory = computed<OrderStatusHistory[]>(() => {
        return this.order()?.status_history ?? [];
    });

    readonly googleMapsUrl = computed(() => {
        const addr = this.shippingAddress();
        if (!addr) return null;
        return `https://maps.google.com/?q=${encodeURIComponent(addr.join(', '))}`;
    });

    readonly billingFullName = computed(() => {
        const o = this.order();
        if (!o) return '';
        return [o.billing_first_name, o.billing_last_name].filter(v => !!v).join(' ');
    });

    readonly billingCityLine = computed(() => {
        const o = this.order();
        if (!o) return '';
        return [o.billing_city, o.billing_state, o.billing_postal_code].filter(v => !!v).join(', ');
    });

    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.router.navigate(['/orders']);
            return;
        }
        await this.loadOrder(id);
    }

    async loadOrder(id: string) {
        this.isLoading.set(true);
        try {
            const order = await this.ordersService.getOrder(id);
            if (!order) {
                this.toast.error('Pedido no encontrado.');
                this.router.navigate(['/orders']);
                return;
            }
            this.order.set(order);
            this.internalNote.set(order.internal_note ?? '');
            this.selectedStatus.set(order.status);
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error al cargar el pedido.');
            this.router.navigate(['/orders']);
        } finally {
            this.isLoading.set(false);
        }
    }

    async saveNote() {
        const order = this.order();
        if (!order) return;
        this.isSavingNote.set(true);
        try {
            await this.ordersService.updateInternalNote(order.id, this.internalNote());
            this.order.update(o => o ? { ...o, internal_note: this.internalNote() } : o);
            this.toast.success('Nota guardada correctamente.');
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error al guardar la nota.');
        } finally {
            this.isSavingNote.set(false);
        }
    }

    async updateStatus() {
        const order = this.order();
        const newStatus = this.selectedStatus() as OrderStatus;
        if (!order || !newStatus || newStatus === order.status) return;

        this.isUpdatingStatus.set(true);
        try {
            await this.ordersService.updateOrderStatus(order.id, newStatus);
            this.order.update(o => o ? { ...o, status: newStatus } : o);
            // Reload to get fresh history
            await this.loadOrder(order.id);
            this.toast.success(`Estado actualizado a "${this.statusOptions.find(s => s.value === newStatus)?.label}".`);
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error al actualizar el estado.');
        } finally {
            this.isUpdatingStatus.set(false);
        }
    }

    onStatusChange(event: Event) {
        this.selectedStatus.set((event.target as HTMLSelectElement).value as OrderStatus);
    }

    getStatusIcon(status: OrderStatus): string {
        const icons: Partial<Record<OrderStatus, string>> = {
            [OrderStatus.Pending]: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
            [OrderStatus.Processing]: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
            [OrderStatus.Paid]: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33',
            [OrderStatus.Shipped]: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
            [OrderStatus.Delivered]: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
            [OrderStatus.Cancelled]: 'M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
            [OrderStatus.Refunded]: 'M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3',
        };
        return icons[status] ?? 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
    }

    getStatusColor(status: OrderStatus): string {
        const colors: Partial<Record<OrderStatus, string>> = {
            [OrderStatus.Delivered]: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
            [OrderStatus.Shipped]: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
            [OrderStatus.Paid]: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
            [OrderStatus.Processing]: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
            [OrderStatus.Pending]: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
            [OrderStatus.Cancelled]: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
            [OrderStatus.Refunded]: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',
        };
        return colors[status] ?? 'text-gray-600 bg-gray-100';
    }

    goBack() {
        this.router.navigate(['/orders']);
    }
}
