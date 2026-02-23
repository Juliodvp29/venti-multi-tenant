import { Product } from './product';

export interface CartItem {
    id: string; // This could be product_id or variant_id
    productId: string;
    variantId?: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string | null;
    product: Product; // Keep reference to full product for convenience
}
