import { BaseModel } from './index';

export interface AnalyticsEvent {
    id: string;
    tenant_id: string;
    event_type: string;
    event_data?: Record<string, unknown>;
    customer_id?: string;
    session_id?: string;
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    page_url?: string;
    product_id?: string;
    category_id?: string;
    created_at: string;
}

export interface DailySalesSummary extends BaseModel {
    tenant_id: string;
    date: string;
    total_orders: number;
    total_revenue: number;
    total_items_sold: number;
    average_order_value: number;
    new_customers: number;
    returning_customers: number;
}

export interface DailyDashboard {
    tenant_id: string;
    today_revenue: number;
    today_orders: number;
    yesterday_revenue: number;
    yesterday_orders: number;
    week_revenue: number;
    week_orders: number;
    month_revenue: number;
    month_orders: number;
    last_month_revenue: number;
    last_month_orders: number;
    avg_order_value_30d: number;
}

export interface ProductPerformance extends BaseModel {
    tenant_id: string;
    product_id: string;
    period_start: string;
    period_end: string;
    views: number;
    add_to_cart: number;
    purchases: number;
    revenue: number;
    units_sold: number;
    conversion_rate?: number;
}

export interface LowStockAlert {
    id: string;
    tenant_id: string;
    name: string;
    sku?: string;
    stock_quantity: number;
    low_stock_threshold: number;
    days_of_stock_remaining: number;
    sales_last_30_days: number;
    average_daily_sales: number;
    image_url?: string;
}
