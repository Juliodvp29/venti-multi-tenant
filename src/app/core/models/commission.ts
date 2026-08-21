import { BaseModel } from './index';
import { SubscriptionPlan } from '@core/enums';
import { Payment } from './payment';

export interface Commission extends BaseModel {
    tenant_id: string;
    gateway: string;
    gateway_transaction_id: string;
    payment_id: string;
    payment_amount: number;
    commission_rate_applied: number;
    commission_amount: number;
    status: CommissionStatus;
    metadata: Record<string, unknown>;
    payment?: Payment;
}

export interface CommissionRule extends BaseModel {
    tenant_id?: string | null;
    plan: SubscriptionPlan;
    commission_rate: number;
    is_active: boolean;
    effective_from: string;
    effective_until?: string | null;
}

export enum CommissionStatus {
    Pending = 'pending',
    Paid = 'paid',
    Cancelled = 'cancelled',
}

export interface CommissionFilters {
    status?: CommissionStatus;
    gateway?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface CommissionStats {
    totalPending: number;
    totalPaid: number;
    totalAmount: number;
    thisMonthAmount: number;
}