export type TicketCategory =
  | 'store_setup'
  | 'domain_dns'
  | 'shipping_taxes'
  | 'theme_storefront'
  | 'payments_commissions'
  | 'catalog_products'
  | 'billing'
  | 'other';

export type TicketSeverity = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  tenant_id: string;
  user_id: string;
  subject: string;
  category: TicketCategory;
  severity: TicketSeverity;
  message: string;
  attachments?: string[];
  status: TicketStatus;
  created_at: string;
  updated_at?: string;
}

export interface StoreHealthStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionLabel: string;
  actionRoute: string;
  queryParams?: Record<string, string>;
  category: 'essential' | 'design' | 'operations';
}

export interface StoreHealthSummary {
  completionPercentage: number;
  completedCount: number;
  totalCount: number;
  steps: StoreHealthStep[];
}

export interface TroubleshootingGuide {
  id: string;
  title: string;
  category: TicketCategory;
  summary: string;
  commonCauses: string[];
  solutionSteps: string[];
  actionLabel?: string;
  actionRoute?: string;
  queryParams?: Record<string, string>;
}
