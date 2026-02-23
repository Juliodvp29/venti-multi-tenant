import { BaseModel } from './index';

export interface ProductReview extends BaseModel {
    tenant_id: string;
    product_id: string;
    customer_id: string;
    order_id?: string;
    rating: 1 | 2 | 3 | 4 | 5;
    title?: string;
    review?: string;
    status: 'pending' | 'approved' | 'rejected';
    is_verified_purchase: boolean;
    is_approved: boolean; // Deprecated
    approved_by?: string;
    approved_at?: string;

    // Join data for admin
    product?: {
        name: string;
        sku?: string;
        product_images?: {
            url: string;
            is_primary: boolean;
        }[];
    };
    customer?: {
        first_name: string;
        last_name: string | null;
    };
}
