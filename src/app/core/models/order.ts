import { BaseModel } from './index';
import { OrderStatus, PaymentStatus } from '@enums/index';
import { Payment } from './payment';

export interface OrderItem {
    id: string;
    order_id: string;
    tenant_id: string;
    product_id?: string;
    variant_id?: string;
    product_name: string;
    product_sku?: string;
    variant_name?: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    product_snapshot?: Record<string, unknown>;
    created_at: string;
}

export interface OrderStatusHistory {
    id: string;
    order_id: string;
    tenant_id: string;
    old_status?: OrderStatus;
    new_status: OrderStatus;
    changed_by?: string;
    note?: string;
    customer_notified: boolean;
    created_at: string;
}

export interface Order extends BaseModel {
    tenant_id: string;
    customer_id: string;
    order_number: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_amount: number;
    total_amount: number;
    currency: string;
    customer_email: string;
    customer_first_name?: string;
    customer_last_name?: string;
    customer_phone?: string;
    // Shipping snapshot
    shipping_first_name?: string;
    shipping_last_name?: string;
    shipping_company?: string;
    shipping_address_line1?: string;
    shipping_address_line2?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_postal_code?: string;
    shipping_country?: string;
    shipping_phone?: string;
    // Billing snapshot
    billing_first_name?: string;
    billing_last_name?: string;
    billing_address_line1?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    billing_country?: string;
    // Shipping details
    shipping_method?: string;
    tracking_number?: string;
    tracking_url?: string;
    shipped_at?: string;
    delivered_at?: string;
    customer_note?: string;
    internal_note?: string;
    ip_address?: string;
    cancelled_at?: string;
    cancelled_reason?: string;
    // Relations
    items?: OrderItem[];
    status_history?: OrderStatusHistory[];
    payment_info?: Partial<Payment>;
    item_count?: number;
    total_items?: number;
}
