import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    OnInit,
    signal,
    ViewChild,
    TemplateRef,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { DateRangePicker, DateRange } from '@shared/components/date-range-picker/date-range-picker';
import { Dropdown, DropdownOption } from '@shared/components/dropdown/dropdown';
import { ColumnDef } from '@core/types/table';
import { CommissionsService } from '@core/services/commissions';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { Commission, CommissionFilters, CommissionStatus, CommissionStats } from '@core/models/commission';

const PAGE_SIZE = 20;

@Component({
    selector: 'app-commissions-list',
    imports: [CommonModule, DynamicTable, DateRangePicker, Dropdown, CurrencyPipe],
    templateUrl: './commissions-list.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [CurrencyPipe],
})
export class CommissionsList implements OnInit {
    private readonly commissionsService = inject(CommissionsService);
    private readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);
    private readonly currencyPipe = inject(CurrencyPipe);
    readonly currency = this.tenantService.currency;
    readonly timezone = this.tenantService.timezone;

    private initialized = false;

    // State
    readonly isLoading = signal(false);
    readonly commissions = signal<Commission[]>([]);
    readonly totalCount = signal(0);
    readonly currentPage = signal(1);
    readonly stats = signal<CommissionStats | null>(null);
    readonly columns = signal<ColumnDef<Commission>[]>([]);
    readonly canEdit = this.tenantService.canEdit;

    @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
    @ViewChild('gatewayTemplate') gatewayTemplate!: TemplateRef<any>;
    @ViewChild('rateTemplate') rateTemplate!: TemplateRef<any>;

    // Filters
    readonly statusFilter = signal<CommissionStatus | ''>('');
    readonly dateRange = signal<DateRange>({ start: null, end: null });
    readonly searchQuery = signal('');
    readonly PAGE_SIZE = PAGE_SIZE;

    readonly statusDropdownOptions: DropdownOption[] = [
        { label: 'Todos los estados', value: '' },
        { label: 'Pendiente', value: 'pending' },
        { label: 'Procesada', value: 'processed' },
        { label: 'Exonerada', value: 'waived' },
    ];

    readonly gatewayDropdownOptions = signal<DropdownOption[]>([
        { label: 'Todos los gateways', value: '' },
    ]);

    // Stats computed
    readonly totalPending = computed(() => this.stats()?.totalPending ?? 0);
    readonly totalPaid = computed(() => this.stats()?.totalPaid ?? 0);
    readonly totalAmount = computed(() => this.stats()?.totalAmount ?? 0);
    readonly thisMonthAmount = computed(() => this.stats()?.thisMonthAmount ?? 0);

    async ngOnInit() {
        await this.loadData();
        this.initialized = true;
    }

    ngAfterViewInit() {
        this.updateColumns();
    }

    private updateColumns() {
        this.columns.set([
            {
                key: 'created_at',
                label: 'Fecha',
                sortable: true,
                type: 'text',
                formatter: (val) => val ? new Date(val).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: this.timezone() }) : '',
            },
            {
                key: 'gateway',
                label: 'Gateway',
                type: 'custom',
                sortable: true,
                template: this.gatewayTemplate,
            },
            {
                key: 'gateway_transaction_id',
                label: 'Transacción ID',
                sortable: true,
                type: 'text',
            },
            {
                key: 'payment_id',
                label: 'Pago ID',
                sortable: true,
                type: 'text',
            },
            {
                key: 'payment_amount',
                label: 'Monto Pago',
                type: 'text',
                sortable: true,
                formatter: (val) => this.currencyPipe.transform(val, this.currency()) ?? val,
            },
            {
                key: 'commission_rate_applied',
                label: '% Comisión',
                type: 'custom',
                sortable: true,
                template: this.rateTemplate,
            },
            {
                key: 'commission_amount',
                label: 'Monto Comisión',
                type: 'text',
                sortable: true,
                formatter: (val) => this.currencyPipe.transform(val, this.currency()) ?? val,
            },
            {
                key: 'status',
                label: 'Estado',
                type: 'custom',
                sortable: true,
                template: this.statusTemplate,
            },
        ]);
    }

    private buildFilters(): CommissionFilters {
        const filters: CommissionFilters = {};
        if (this.statusFilter()) filters.status = this.statusFilter() as CommissionStatus;
        if (this.searchQuery().trim()) filters.search = this.searchQuery().trim();

        const range = this.dateRange();
        if (range.start) {
            filters.startDate = range.start + 'T00:00:00.000Z';
            if (range.end) filters.endDate = range.end + 'T23:59:59.999Z';
        }
        return filters;
    }

    async loadData(page: number = 1) {
        this.currentPage.set(page);
        this.isLoading.set(true);
        try {
            const [commissionsRes, statsRes] = await Promise.all([
                this.commissionsService.getCommissions(page, PAGE_SIZE, this.buildFilters()),
                this.commissionsService.getCommissionStats(),
            ]);

            this.commissions.set(commissionsRes.data);
            this.totalCount.set(commissionsRes.count);
            this.stats.set(statsRes);

            // Update gateway dropdown options with unique gateways from data
            const uniqueGateways = [...new Set(commissionsRes.data.map(c => c.gateway).filter(Boolean))];
            this.gatewayDropdownOptions.set([
                { label: 'Todos los gateways', value: '' },
                ...uniqueGateways.map(gw => ({ label: gw.toUpperCase(), value: gw })),
            ]);
        } catch (error) {
            console.error('Error loading commissions:', error);
            this.toastService.error('Error al cargar las comisiones');
        } finally {
            this.isLoading.set(false);
        }
    }

    constructor() {
        effect(() => {
            const tenantId = this.tenantService.tenantId();
            if (tenantId && !this.initialized) {
                this.initialized = true;
                this.loadData();
            }
        });
    }

    onStatusFilterChange(value: CommissionStatus | '') {
        this.statusFilter.set(value);
        this.loadData(1);
    }

    onDateRangeChange(range: DateRange) {
        this.dateRange.set(range);
        this.loadData(1);
    }

    onSearchChange(query: string) {
        this.searchQuery.set(query);
        this.loadData(1);
    }

    onGatewayFilterChange(value: string) {
        // Gateway filter is handled by search since we don't have a gateway field in CommissionFilters
        // We can extend CommissionFilters to include gateway if needed
        // For now, we'll use the search field to filter by gateway
        if (value) {
            this.searchQuery.set(value);
            this.loadData(1);
        }
    }

    async exportCSV() {
        try {
            const data = await this.commissionsService.exportCommissions(this.buildFilters());
            this.downloadCSV(data);
            this.toastService.success('Exportación CSV completada');
        } catch (error) {
            console.error('Error exporting commissions:', error);
            this.toastService.error('Error al exportar comisiones');
        }
    }

    async exportExcel() {
        try {
            const data = await this.commissionsService.exportCommissions(this.buildFilters());
            this.downloadExcel(data);
            this.toastService.success('Exportación Excel completada');
        } catch (error) {
            console.error('Error exporting commissions:', error);
            this.toastService.error('Error al exportar comisiones');
        }
    }

    private downloadCSV(commissions: Commission[]) {
        const headers = ['Fecha', 'Gateway', 'Transacción ID', 'Pago ID', 'Monto Pago', '% Comisión', 'Monto Comisión', 'Estado'];
        const rows = commissions.map(c => [
            new Date(c.created_at).toLocaleDateString('es-ES'),
            c.gateway.toUpperCase(),
            c.gateway_transaction_id,
            c.payment_id,
            c.payment_amount.toString(),
            `${c.commission_rate_applied}%`,
            c.commission_amount.toString(),
            this.formatStatus(c.status),
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(blob, `comisiones_${new Date().toISOString().split('T')[0]}.csv`);
    }

    private downloadExcel(commissions: Commission[]) {
        const dataToExport = commissions.map(c => ({
            'Fecha': new Date(c.created_at).toLocaleDateString('es-ES'),
            'Gateway': c.gateway.toUpperCase(),
            'Transacción ID': c.gateway_transaction_id,
            'Pago ID': c.payment_id,
            'Monto Pago': c.payment_amount,
            '% Comisión': `${c.commission_rate_applied}%`,
            'Monto Comisión': c.commission_amount,
            'Estado': this.formatStatus(c.status),
        }));

        import('xlsx').then(XLSX => {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Comisiones');
            XLSX.writeFile(workbook, `comisiones_${new Date().toISOString().split('T')[0]}.xlsx`);
        }).catch(() => {
            this.downloadCSV(commissions);
        });
    }

    private downloadFile(blob: Blob, filename: string) {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    formatStatus(status: CommissionStatus): string {
        const labels: Record<CommissionStatus, string> = {
            [CommissionStatus.Pending]: 'Pendiente',
            [CommissionStatus.Paid]: 'Pagada',
            [CommissionStatus.Cancelled]: 'Cancelada',
        };
        return labels[status] || status;
    }

    getStatusClass(status: CommissionStatus): string {
        switch (status) {
            case CommissionStatus.Pending: return 'bg-yellow-100 text-yellow-800';
            case CommissionStatus.Paid: return 'bg-green-100 text-green-800';
            case CommissionStatus.Cancelled: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
}