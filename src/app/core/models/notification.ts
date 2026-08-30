export type NotificationType =
  | 'order_created'
  | 'low_stock'
  | 'out_of_stock'
  | 'new_review'
  | 'commission_paid'
  | 'member_joined'
  | 'cart_abandoned'
  | 'general';

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
