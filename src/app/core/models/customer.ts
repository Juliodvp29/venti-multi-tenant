import { BaseModel } from './index';

export interface CustomerAddress extends BaseModel {
    customer_id: string;
    tenant_id: string;
    label?: string;
    first_name: string;
    last_name: string;
    company?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
    phone?: string;
    is_default: boolean;
    is_billing_default: boolean;
}

export interface Customer extends BaseModel {
    tenant_id: string;
    user_id?: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    accepts_marketing: boolean;
    total_orders: number;
    total_spent: number;
    addresses?: CustomerAddress[];
    // From vw_customer_analytics
    lifetime_orders?: number;
    lifetime_value?: number;
    average_order_value?: number;
    first_order_date?: string;
    last_order_date?: string;
    days_since_last_order?: number;
    customer_segment?: string;
    reviews_count?: number;
}
