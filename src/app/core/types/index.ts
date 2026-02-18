import { Signal } from '@angular/core';
import { ApiError } from '@models/index';

// ============================================================
// UTILITY TYPES
// ============================================================

/** Make selected keys optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make selected keys required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Deep partial */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Nullable type */
export type Nullable<T> = T | null;

/** Optional type */
export type Optional<T> = T | undefined;

// ============================================================
// SIGNAL STATE TYPES
// ============================================================

export interface LoadingState {
  loading: boolean;
  error: Nullable<ApiError>;
}

export interface AsyncState<T> extends LoadingState {
  data: Nullable<T>;
}

export interface PaginatedState<T> extends LoadingState {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================
// FORM TYPES
// ============================================================

export type FormState = 'idle' | 'submitting' | 'success' | 'error';

export interface FormResult<T = unknown> {
  state: FormState;
  data?: T;
  error?: string;
}

// ============================================================
// UPLOAD TYPES
// ============================================================

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadProgress {
  status: UploadStatus;
  progress: number;
  url?: string;
  error?: string;
}

export interface UploadResult {
  url: string;
  path: string;
  fullPath: string;
}

// ============================================================
// NAVIGATION TYPES
// ============================================================

export interface NavItem {
  label: string;
  route: string;
  icon?: string;
  badge?: number | Signal<number>;
  children?: NavItem[];
  roles?: string[];
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// ============================================================
// PLAN LIMITS
// ============================================================

export interface PlanLimits {
  maxProducts: number | null;
  maxOrdersPerMonth: number | null;
  maxUsers: number;
  storageGb: number;
  customDomain: boolean;
  removeBranding: boolean;
  analytics: boolean;
  dataExport: boolean;
  webhooks: boolean;
  apiAccess: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxProducts: 50,
    maxOrdersPerMonth: 100,
    maxUsers: 1,
    storageGb: 1,
    customDomain: false,
    removeBranding: false,
    analytics: false,
    dataExport: false,
    webhooks: false,
    apiAccess: false,
  },
  basic: {
    maxProducts: 500,
    maxOrdersPerMonth: null,
    maxUsers: 3,
    storageGb: 10,
    customDomain: true,
    removeBranding: true,
    analytics: false,
    dataExport: false,
    webhooks: false,
    apiAccess: false,
  },
  professional: {
    maxProducts: null,
    maxOrdersPerMonth: null,
    maxUsers: 10,
    storageGb: 50,
    customDomain: true,
    removeBranding: true,
    analytics: true,
    dataExport: true,
    webhooks: true,
    apiAccess: false,
  },
  enterprise: {
    maxProducts: null,
    maxOrdersPerMonth: null,
    maxUsers: Infinity,
    storageGb: 500,
    customDomain: true,
    removeBranding: true,
    analytics: true,
    dataExport: true,
    webhooks: true,
    apiAccess: true,
  },
};
