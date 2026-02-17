export enum SubscriptionPlan {
  Free = 'free',
  Basic = 'basic',
  Professional = 'professional',
  Enterprise = 'enterprise',
}

export enum SubscriptionStatus {
  Active = 'active',
  Cancelled = 'cancelled',
  Suspended = 'suspended',
  Expired = 'expired',
  Trial = 'trial',
}

export enum TenantStatus {
  Active = 'active',
  Suspended = 'suspended',
  Pending = 'pending',
  Cancelled = 'cancelled',
}

export enum OrderStatus {
  Pending = 'pending',
  Processing = 'processing',
  Paid = 'paid',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Refunded = 'refunded',
  PartiallyRefunded = 'partially_refunded',
}

export enum PaymentMethod {
  CreditCard = 'credit_card',
  DebitCard = 'debit_card',
  PayPal = 'paypal',
  Stripe = 'stripe',
  BankTransfer = 'bank_transfer',
  CashOnDelivery = 'cash_on_delivery',
}

export enum ProductStatus {
  Draft = 'draft',
  Active = 'active',
  Archived = 'archived',
  OutOfStock = 'out_of_stock',
}

export enum DiscountType {
  Percentage = 'percentage',
  FixedAmount = 'fixed_amount',
  FreeShipping = 'free_shipping',
}

export enum AuditAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Login = 'login',
  Logout = 'logout',
  Payment = 'payment',
  Refund = 'refund',
  StatusChange = 'status_change',
}

export enum TenantRole {
  Owner = 'owner',
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}

export enum CustomerSegment {
  Prospect = 'Prospect',
  New = 'New',
  Repeat = 'Repeat',
  Loyal = 'Loyal',
  VIP = 'VIP',
}

export enum StockStatus {
  Available = 'available',
  InStock = 'in_stock',
  LowStock = 'low_stock',
  Backorder = 'backorder',
  OutOfStock = 'out_of_stock',
}

export enum ShippingRateType {
  FlatRate = 'flat_rate',
  WeightBased = 'weight_based',
  PriceBased = 'price_based',
}

export enum EmailStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
  Bounced = 'bounced',
}

export enum WebhookStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export enum WeightUnit {
  Kg = 'kg',
  Lb = 'lb',
}

export enum DimensionUnit {
  Cm = 'cm',
  In = 'in',
}
