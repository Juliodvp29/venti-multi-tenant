import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { OrderStatus, PaymentStatus } from '@core/enums';

type BadgeVariant = 'order' | 'payment';

interface BadgeConfig {
    label: string;
    classes: string;
}

const ORDER_STATUS_MAP: Record<OrderStatus, BadgeConfig> = {
    [OrderStatus.Pending]: { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 ring-yellow-200 dark:ring-yellow-800' },
    [OrderStatus.Processing]: { label: 'Procesando', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-800' },
    [OrderStatus.Paid]: { label: 'Pagado', classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 ring-indigo-200 dark:ring-indigo-800' },
    [OrderStatus.Shipped]: { label: 'Enviado', classes: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 ring-cyan-200 dark:ring-cyan-800' },
    [OrderStatus.Delivered]: { label: 'Entregado', classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800' },
    [OrderStatus.Cancelled]: { label: 'Cancelado', classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800' },
    [OrderStatus.Refunded]: { label: 'Reembolsado', classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 ring-gray-200 dark:ring-gray-700' },
};

const PAYMENT_STATUS_MAP: Record<PaymentStatus, BadgeConfig> = {
    [PaymentStatus.Pending]: { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 ring-yellow-200 dark:ring-yellow-800' },
    [PaymentStatus.Completed]: { label: 'Pagado', classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800' },
    [PaymentStatus.Failed]: { label: 'Fallido', classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800' },
    [PaymentStatus.Refunded]: { label: 'Reembolsado', classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 ring-gray-200 dark:ring-gray-700' },
    [PaymentStatus.PartiallyRefunded]: { label: 'Parcial', classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 ring-orange-200 dark:ring-orange-800' },
};

@Component({
    selector: 'app-order-status-badge',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset {{ config().classes }}">
            {{ config().label }}
        </span>
    `,
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
