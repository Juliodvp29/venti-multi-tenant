import { BaseModel } from './index';
import { PaymentMethod, PaymentStatus } from '@enums/index';

export interface Payment extends BaseModel {
    tenant_id: string;
    order_id: string;
    payment_method: PaymentMethod;
    amount: number;
    currency: string;
    status: PaymentStatus;
    gateway?: string;
    gateway_transaction_id?: string;
    gateway_response?: Record<string, unknown>;
    payment_details?: Record<string, unknown>;
    processed_at?: string;
}

export interface Refund extends BaseModel {
    tenant_id: string;
    order_id: string;
    payment_id?: string;
    amount: number;
    reason?: string;
    status: PaymentStatus;
    gateway_refund_id?: string;
    processed_by?: string;
    processed_at?: string;
}
