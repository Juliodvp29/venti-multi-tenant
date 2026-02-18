import { BaseModel } from './index';
import { ProductStatus } from '@core/enums';

export interface ProductDimensions {
    length: number;
    width: number;
    height: number;
    unit: string;
}

export interface ProductImage {
    id: string;
    product_id: string;
    tenant_id: string;
    url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
    width?: number;
    height?: number;
    size_bytes?: number;
    created_at: string;
}

export interface ProductVariant extends BaseModel {
    product_id: string;
    tenant_id: string;
    name: string;
    sku: string | null;
    price: number | null;
    compare_at_price: number | null;
    cost_price: number | null;
    stock_quantity: number;
    options: Record<string, string>; // e.g. { "color": "Red", "size": "Large" }
    image_url: string | null;
    is_active: boolean;
}

export interface ProductTag {
    id: string;
    tenant_id: string;
    name: string;
    slug: string;
    created_at: string;
}

export interface Product extends BaseModel {
    tenant_id: string;

    // Basic Information
    name: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    sku: string | null;

    // Pricing
    price: number;
    compare_at_price: number | null;
    cost_price: number | null;

    // Inventory
    track_inventory: boolean;
    stock_quantity: number;
    low_stock_threshold: number;
    allow_backorder: boolean;

    // Physical Properties
    weight: number | null;
    weight_unit: string;
    dimensions: ProductDimensions | null;

    // Status & Visibility
    status: ProductStatus;
    is_featured: boolean;
    published_at: string | null;

    // SEO
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string[] | null;

    deleted_at: string | null;

    // Relations (Populated in views or joins)
    images?: ProductImage[];
    primary_image_url?: string;
    variants?: ProductVariant[];
    categories?: any[]; // Using any[] temporarily to avoid circular dependency
    tags?: ProductTag[];
}

export interface CreateProductDto {
    name: string;
    slug: string;
    price: number;
    status?: ProductStatus;
    description?: string;
    sku?: string;
    track_inventory?: boolean;
    stock_quantity?: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
    compare_at_price?: number;
    cost_price?: number;
    low_stock_threshold?: number;
    allow_backorder?: boolean;
    weight?: number;
    weight_unit?: string;
    dimensions?: ProductDimensions;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string[];
}
