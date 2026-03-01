import { BaseModel } from './index';

export type InventoryMovementType = 'sale' | 'adjustment' | 'return' | 'manual' | 'other';

export interface InventoryMovement extends BaseModel {
    tenant_id: string;
    product_id: string;
    product_name: string;
    variant_id?: string;
    variant_name?: string;
    type: InventoryMovementType;
    quantity_change: number;
    new_quantity: number;
    user_id?: string;
    user_email?: string;
    reference_id?: string;
    description?: string;
}
