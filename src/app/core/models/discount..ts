import { BaseModel } from './index';
import { DiscountType } from '@enums/index';

export interface DiscountCode extends BaseModel {
    tenant_id: string;
    code: string;
    description?: string;
    type: DiscountType;
    value: number;
    usage_limit?: number;
    usage_count: number;
    per_customer_limit?: number;
    minimum_purchase_amount?: number;
    applies_to_products?: string[];
    applies_to_categories?: string[];
    starts_at?: string;
    ends_at?: string;
    is_active: boolean;
    // From vw_active_discounts
    times_used?: number;
    unique_customers?: number;
    total_discount_given?: number;
    remaining_uses?: number;
    discount_status?: 'active' | 'expired' | 'scheduled' | 'used_up' | 'inactive';
}

export interface DiscountUsage {
    id: string;
    discount_code_id: string;
    order_id: string;
    customer_id: string;
    tenant_id: string;
    discount_amount: number;
    created_at: string;
}
