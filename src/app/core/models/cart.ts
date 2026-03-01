import { Product } from './product';

export interface CartItem {
    id: string;
    variantId?: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string | null;
    product: Product;
}
