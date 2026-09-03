import { TemplateRef } from '@angular/core';

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'currency' | 'date' | 'status' | 'image' | 'custom';
  align?: 'left' | 'center' | 'right';
  className?: string;
  template?: TemplateRef<any>;
  formatter?: (value: any, item: T) => string;
  sortValue?: (item: T) => any;
}

export interface TableAction<T> {
  id: string;
  label: string;
  icon?: string;
  className?: string;
  show?: (item: T) => boolean;
  callback: (item: T) => void;
}

export interface TableSort {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableFilter {
  key: string;
  label: string;
  options: { label: string; value: any }[];
}

export interface TableExportOptions {
  filename?: string;
  format?: 'csv' | 'xlsx' | 'pdf';
  excludeKeys?: string[];
}

export interface PdfReportMetric {
  label: string;
  value: string;
}

export interface PdfReportOptions {
  title: string;
  description?: string;
  filename?: string;
  generatedAt?: Date;
  businessName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  currency?: string;
  timezone?: string;
  metrics?: PdfReportMetric[];
  columns: string[];
  rows: string[][];
  orientation?: 'portrait' | 'landscape';
  footerText?: string;
}
