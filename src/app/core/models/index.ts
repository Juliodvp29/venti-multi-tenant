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

export * from './tenant.model';

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

export * from './category';

// ============================================================
// PRODUCTS
// ============================================================

export * from './product';

// ============================================================
// CUSTOMERS
// ============================================================

export * from './customer';

// ============================================================
// ORDERS
// ============================================================

export * from './order';

// ============================================================
// PAYMENTS
// ============================================================

export * from './payment';

// ============================================================
// DISCOUNTS
// ============================================================

export * from './discount.';

// ============================================================
// REVIEWS
// ============================================================

export * from './review';

// ============================================================
// ANALYTICS
// ============================================================

export * from './analytics';


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
