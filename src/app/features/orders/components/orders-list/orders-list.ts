import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Order } from '@core/models/order';
import { OrderStatus } from '@core/enums';
import { OrdersService, OrderFilters, OrderStats } from '@core/services/orders';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { DateRangePicker, DateRange } from '@shared/components/date-range-picker/date-range-picker';
import { OrderStatusBadge } from '@shared/components/order-status-badge/order-status-badge';
import { ColumnDef } from '@core/types/table';
import { TemplateRef, ViewChild, AfterViewInit } from '@angular/core';

const PAGE_SIZE = 20;

@Component({
    selector: 'app-orders-list',
    standalone: true,
    imports: [CommonModule, DynamicTable, DateRangePicker, OrderStatusBadge],
    templateUrl: './orders-list.html',
    styleUrl: './orders-list.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [CurrencyPipe, DatePipe],
})
export class OrdersList implements OnInit, AfterViewInit {
    private readonly ordersService = inject(OrdersService);
    private readonly tenantService = inject(TenantService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);
    private readonly currencyPipe = inject(CurrencyPipe);
    private readonly datePipe = inject(DatePipe);

    private initialized = false;

    constructor() {
        effect(() => {
            const tenantId = this.tenantService.tenantId();
            if (tenantId && !this.initialized) {
                this.initialized = true;
                this.loadStats();
                this.loadOrders();
            }
        });
    }

    // State
    readonly isLoading = signal(false);
    readonly isStatsLoading = signal(false);
    readonly orders = signal<Order[]>([]);
    readonly totalCount = signal(0);
    readonly currentPage = signal(1);
    readonly stats = signal<OrderStats | null>(null);
    readonly columns = signal<ColumnDef<Order>[]>([]);

    @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
    @ViewChild('paymentTemplate') paymentTemplate!: TemplateRef<any>;

    // Filters
    readonly statusFilter = signal<OrderStatus | ''>('');
    readonly dateFilter = signal<'7d' | '30d' | '90d' | 'all'>('30d');
    readonly searchQuery = signal('');
    readonly dateRange = signal<DateRange>({ start: null, end: null });
    readonly PAGE_SIZE = PAGE_SIZE;

    // Status options for filter
    readonly statusOptions: { value: OrderStatus | ''; label: string }[] = [
        { value: '', label: 'Todos los estados' },
        { value: OrderStatus.Pending, label: 'Pendiente' },
        { value: OrderStatus.Processing, label: 'Procesando' },
        { value: OrderStatus.Paid, label: 'Pagado' },
        { value: OrderStatus.Shipped, label: 'Enviado' },
        { value: OrderStatus.Delivered, label: 'Entregado' },
        { value: OrderStatus.Cancelled, label: 'Cancelado' },
        { value: OrderStatus.Refunded, label: 'Reembolsado' },
    ];

    readonly dateOptions: { value: '7d' | '30d' | '90d' | 'all'; label: string }[] = [
        { value: '7d', label: 'Últimos 7 días' },
        { value: '30d', label: 'Últimos 30 días' },
        { value: '90d', label: 'Últimos 90 días' },
        { value: 'all', label: 'Todo el tiempo' },
    ];

    // Stats computed
    readonly revenueChange = computed(() => {
        const s = this.stats();
        if (!s || s.revenuePrevDay === 0) return null;
        return ((s.revenueToday - s.revenuePrevDay) / s.revenuePrevDay) * 100;
    });

    ngOnInit() {
        // Initial columns without templates to avoid empty headers
        this.updateColumns();
    }

    ngAfterViewInit() {
        // Update columns again once templates are available
        this.updateColumns();
    }

    private updateColumns() {
        this.columns.set([
            {
                key: 'order_number',
                label: 'Pedido',
                sortable: true,
                type: 'text',
                formatter: (val) => `#${val}`,
            },
            {
                key: 'customer_email',
                label: 'Cliente',
                type: 'text',
                sortable: true,
            },
            {
                key: 'status',
                label: 'Estado',
                type: 'custom',
                sortable: true,
                template: this.statusTemplate,
            },
            {
                key: 'payment_status',
                label: 'Pago',
                type: 'custom',
                sortable: true,
                template: this.paymentTemplate,
            },
            {
                key: 'created_at',
                label: 'Fecha',
                type: 'text',
                sortable: true,
                formatter: (val) => this.datePipe.transform(val, 'dd MMM yyyy') ?? val,
            },
            {
                key: 'total_amount',
                label: 'Total',
                type: 'text',
                sortable: true,
                formatter: (val) => this.currencyPipe.transform(val, 'USD') ?? val,
            },
        ]);
    }

    private buildFilters(): OrderFilters {
        const filters: OrderFilters = {};
        if (this.statusFilter()) filters.status = this.statusFilter() as OrderStatus;
        if (this.searchQuery().trim()) filters.search = this.searchQuery().trim();
        const range = this.dateRange();
        if (range.start) {
            filters.startDate = range.start + 'T00:00:00.000Z';
            if (range.end) filters.endDate = range.end + 'T23:59:59.999Z';
        } else {
            const d = this.dateFilter();
            if (d !== 'all') {
                const days = d === '7d' ? 7 : d === '30d' ? 30 : 90;
                const from = new Date();
                from.setDate(from.getDate() - days);
                filters.startDate = from.toISOString();
            }
        }
        return filters;
    }

    async loadOrders(page: number = 1) {
        this.isLoading.set(true);
        try {
            const { data, count } = await this.ordersService.getOrders(page, PAGE_SIZE, this.buildFilters());
            this.orders.set(data);
            this.totalCount.set(count);
            this.currentPage.set(page);
        } catch (error: any) {
            this.toast.error(error?.message ?? 'Error al cargar los pedidos.');
        } finally {
            this.isLoading.set(false);
        }
    }

    async loadStats() {
        this.isStatsLoading.set(true);
        try {
            this.stats.set(await this.ordersService.getOrderStats());
        } catch {
            // Stats are non-critical, fail silently
        } finally {
            this.isStatsLoading.set(false);
        }
    }

    onStatusFilterChange(event: Event) {
        const val = (event.target as HTMLSelectElement).value;
        this.statusFilter.set(val as OrderStatus | '');
        this.loadOrders(1);
    }

    onDateFilterChange(event: Event) {
        const val = (event.target as HTMLSelectElement).value as '7d' | '30d' | '90d' | 'all';
        this.dateFilter.set(val);
        this.loadOrders(1);
    }

    onDateRangeChange(range: DateRange) {
        this.dateRange.set(range);
        this.loadOrders(1);
    }

    private searchTimer: any;
    onSearchChange(query: string) {
        this.searchQuery.set(query);
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.loadOrders(1), 400);
    }

    onRowClick(order: Order) {
        this.router.navigate(['/orders', order.id]);
    }
}
