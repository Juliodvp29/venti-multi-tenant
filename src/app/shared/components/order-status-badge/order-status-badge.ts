import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { OrderStatus, PaymentStatus } from '@core/enums';

type BadgeVariant = 'order' | 'payment';

interface BadgeConfig {
    label: string;
    classes: string;
}

const ORDER_STATUS_MAP: Record<OrderStatus, BadgeConfig> = {
    [OrderStatus.Pending]: { label: 'Pendiente', classes: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 ring-amber-500/30' },
    [OrderStatus.Processing]: { label: 'En Proceso', classes: 'bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 ring-blue-500/30' },
    [OrderStatus.Paid]: { label: 'Pagado', classes: 'bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-300 ring-sky-500/30' },
    [OrderStatus.Shipped]: { label: 'Enviado', classes: 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 ring-indigo-500/30' },
    [OrderStatus.Delivered]: { label: 'Entregado', classes: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 ring-emerald-500/30' },
    [OrderStatus.Cancelled]: { label: 'Cancelado', classes: 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 ring-rose-500/30' },
    [OrderStatus.Refunded]: { label: 'Reembolsado', classes: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 ring-slate-400/30' },
};

const PAYMENT_STATUS_MAP: Record<PaymentStatus, BadgeConfig> = {
    [PaymentStatus.Pending]: { label: 'Pendiente', classes: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 ring-amber-500/30' },
    [PaymentStatus.Completed]: { label: 'Pagado', classes: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 ring-emerald-500/30' },
    [PaymentStatus.Failed]: { label: 'Fallido', classes: 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 ring-rose-500/30' },
    [PaymentStatus.Refunded]: { label: 'Reembolsado', classes: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 ring-slate-400/30' },
    [PaymentStatus.PartiallyRefunded]: { label: 'Reembolso Parcial', classes: 'bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-300 ring-orange-500/30' },
};

@Component({
    selector: 'app-order-status-badge',
    templateUrl: './order-status-badge.html',
    styleUrl: './order-status-badge.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusBadge {
    status = input.required<OrderStatus | PaymentStatus>();
    variant = input<BadgeVariant>('order');

    config = computed<BadgeConfig>(() => {
        const s = this.status();
        if (this.variant() === 'payment') {
            return PAYMENT_STATUS_MAP[s as PaymentStatus] ?? { label: s, classes: 'bg-gray-100 text-gray-700 ring-gray-200' };
        }
        return ORDER_STATUS_MAP[s as OrderStatus] ?? { label: s, classes: 'bg-gray-100 text-gray-700 ring-gray-200' };
    });
}
