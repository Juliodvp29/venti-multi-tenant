export type NotificationType =
  | 'order_created'
  | 'low_stock'
  | 'out_of_stock'
  | 'new_review'
  | 'commission_paid'
  | 'member_joined'
  | 'cart_abandoned'
  | 'general'
  | 'morning_briefing'
  | 'stock_velocity'
  | 'review_digest'
  | 'cart_digest'
  | 'sales_record'
  | 'coupon_expiring'
  | 'subscription_expiring';

/**
 * Notificaciones proactivas generadas por InsightsService (resúmenes y
 * digest diarios). No disparan toast en tiempo real: viven en la campana.
 * Solo el resumen matutino saluda con toast al primer ingreso del día.
 */
export const INSIGHT_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  'morning_briefing',
  'stock_velocity',
  'review_digest',
  'cart_digest',
  'sales_record',
  'coupon_expiring',
  'subscription_expiring',
]);

/** Insights que ni siquiera el resumen matutino interrumpe con toast. */
export const SILENT_INSIGHT_TYPES: ReadonlySet<NotificationType> = new Set([
  'stock_velocity',
  'review_digest',
  'cart_digest',
  'sales_record',
  'coupon_expiring',
  'subscription_expiring',
]);

export interface AppNotification {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  metadata?: Record<string, any> | null;
  created_at: string;
}
