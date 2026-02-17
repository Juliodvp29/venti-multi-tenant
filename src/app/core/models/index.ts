import {
  SubscriptionPlan,
  SubscriptionStatus,
  TenantStatus,
  TenantRole,
  ProductStatus,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  DiscountType,
  AuditAction,
  StockStatus,
  ShippingRateType,
  EmailStatus,
  WebhookStatus,
  WeightUnit,
} from '@enums/index';

// ============================================================
// BASE
// ============================================================

export interface BaseModel {
  id: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// AUTH / USER
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at?: string;
  user_metadata: {
    business_name?: string;
    role?: 'superadmin' | 'user';
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata: Record<string, unknown>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

// ============================================================
// TENANT
// ============================================================

export interface Tenant extends BaseModel {
  business_name: string;
  slug: string;
  subdomain: string;
  custom_domain?: string;
  owner_id: string;
  contact_email: string;
  contact_phone?: string;
  plan: SubscriptionPlan;
  plan_status: SubscriptionStatus;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  status: TenantStatus;
  is_verified: boolean;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  settings: Record<string, unknown>;
  deleted_at?: string;
}

export interface TenantMember extends BaseModel {
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  permissions: string[];
  is_active: boolean;
  invited_by?: string;
  invited_at: string;
  joined_at?: string;
}

export interface SubscriptionHistory extends BaseModel {
  tenant_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount?: number;
  currency: string;
  billing_period_start?: string;
  billing_period_end?: string;
  payment_method?: string;
  payment_id?: string;
  metadata: Record<string, unknown>;
}

export interface TenantSettings {
  id: string;
  tenant_id: string;
  setting_key: string;
  setting_value: unknown;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  created_at: string;
  updated_at: string;
}

// ============================================================
// CATEGORIES
// ============================================================

export interface Category extends BaseModel {
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
  children?: Category[];
}

// ============================================================
// PRODUCTS
// ============================================================

export interface ProductImage {
  id: string;
  product_id: string;
  tenant_id: string;
  url: string;
  alt_text?: string;
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
  sku?: string;
  price?: number;
  compare_at_price?: number;
  cost_price?: number;
  stock_quantity: number;
  options: Record<string, string>; // e.g. { color: 'Red', size: 'L' }
  image_url?: string;
  is_active: boolean;
}

export interface ProductTag {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface Product extends BaseModel {
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
  weight?: number;
  weight_unit: WeightUnit;
  dimensions?: ProductDimensions;
  status: ProductStatus;
  is_featured: boolean;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  deleted_at?: string;
  // Relations (from vw_products_complete)
  images?: ProductImage[];
  primary_image_url?: string;
  categories?: Pick<Category, 'id' | 'name' | 'slug'>[];
  tags?: Pick<ProductTag, 'id' | 'name' | 'slug'>[];
  variants?: ProductVariant[];
  review_count?: number;
  average_rating?: number;
  stock_status?: StockStatus;
}

// ============================================================
// CUSTOMERS
// ============================================================

export interface CustomerAddress extends BaseModel {
  customer_id: string;
  tenant_id: string;
  label?: string;
  first_name: string;
  last_name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  is_billing_default: boolean;
}

export interface Customer extends BaseModel {
  tenant_id: string;
  user_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  accepts_marketing: boolean;
  total_orders: number;
  total_spent: number;
  addresses?: CustomerAddress[];
  // From vw_customer_analytics
  lifetime_orders?: number;
  lifetime_value?: number;
  average_order_value?: number;
  first_order_date?: string;
  last_order_date?: string;
  days_since_last_order?: number;
  customer_segment?: string;
  reviews_count?: number;
}

// ============================================================
// ORDERS
// ============================================================

export interface OrderItem {
  id: string;
  order_id: string;
  tenant_id: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  product_sku?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  product_snapshot?: Record<string, unknown>;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  tenant_id: string;
  old_status?: OrderStatus;
  new_status: OrderStatus;
  changed_by?: string;
  note?: string;
  customer_notified: boolean;
  created_at: string;
}

export interface Order extends BaseModel {
  tenant_id: string;
  customer_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency: string;
  customer_email: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_phone?: string;
  // Shipping snapshot
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_company?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  shipping_phone?: string;
  // Billing snapshot
  billing_first_name?: string;
  billing_last_name?: string;
  billing_address_line1?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  // Shipping details
  shipping_method?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
  customer_note?: string;
  internal_note?: string;
  ip_address?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  // Relations
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
  payment_info?: Partial<Payment>;
  item_count?: number;
  total_items?: number;
}

// ============================================================
// PAYMENTS
// ============================================================

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

// ============================================================
// DISCOUNTS
// ============================================================

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

// ============================================================
// REVIEWS
// ============================================================

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

// ============================================================
// ANALYTICS
// ============================================================

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

// ============================================================
// MEDIA
// ============================================================

export interface MediaLibraryItem extends BaseModel {
  tenant_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  folder: string;
  tags?: string[];
  alt_text?: string;
  used_in?: Record<string, unknown>;
  uploaded_by?: string;
}

// ============================================================
// EMAIL
// ============================================================

export interface EmailTemplate extends BaseModel {
  tenant_id: string;
  template_key: string;
  name: string;
  description?: string;
  subject: string;
  body_html: string;
  body_text?: string;
  available_variables?: Record<string, string>;
  is_active: boolean;
}

export interface EmailLog extends BaseModel {
  tenant_id: string;
  template_key?: string;
  recipient_email: string;
  subject: string;
  status: EmailStatus;
  error_message?: string;
  related_order_id?: string;
  related_customer_id?: string;
  provider?: string;
  provider_message_id?: string;
  sent_at?: string;
}

// ============================================================
// WEBHOOKS
// ============================================================

export interface WebhookEndpoint extends BaseModel {
  tenant_id: string;
  url: string;
  secret_key: string;
  subscribed_events: string[];
  is_active: boolean;
}

export interface WebhookDelivery extends BaseModel {
  webhook_endpoint_id: string;
  tenant_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: WebhookStatus;
  http_status_code?: number;
  response_body?: string;
  error_message?: string;
  attempt_count: number;
  next_retry_at?: string;
  delivered_at?: string;
}

// ============================================================
// SHIPPING
// ============================================================

export interface ShippingZone extends BaseModel {
  tenant_id: string;
  name: string;
  countries?: string[];
  states?: string[];
  postal_codes?: string[];
  is_active: boolean;
  rates?: ShippingRate[];
}

export interface ShippingRate extends BaseModel {
  shipping_zone_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  rate_type: ShippingRateType;
  rate_amount: number;
  min_order_amount?: number;
  max_order_amount?: number;
  min_weight?: number;
  max_weight?: number;
  estimated_days_min?: number;
  estimated_days_max?: number;
  is_active: boolean;
}

export interface TaxRate extends BaseModel {
  tenant_id: string;
  name: string;
  rate: number;
  country?: string;
  state?: string;
  postal_codes?: string[];
  is_active: boolean;
}

// ============================================================
// AUDIT LOGS
// ============================================================

export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  description?: string;
  created_at: string;
}

// ============================================================
// API RESPONSE WRAPPERS
// ============================================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}
