import { BaseModel } from './index';

export interface ProductReview extends BaseModel {
    tenant_id: string;
    product_id: string;
    customer_id: string;
    order_id?: string;
    rating: 1 | 2 | 3 | 4 | 5;
    title?: string;
    review?: string;
    is_verified_purchase: boolean;
    is_approved: boolean;
    approved_by?: string;
    approved_at?: string;
}
