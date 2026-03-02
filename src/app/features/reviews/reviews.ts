import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsService } from '@core/services/reviews';
import { ProductReview } from '@core/models/review';
import { ColumnDef, TableAction } from '@core/types/table';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { ReviewModerationModal } from './review-moderation-modal';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';

@Component({
  selector: 'app-reviews',
  imports: [CommonModule, DynamicTable, ReviewModerationModal, FormsModule],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
})
export class Reviews {
  private readonly reviewsService = inject(ReviewsService);
  private readonly tenantService = inject(TenantService);

  reviews = signal<ProductReview[]>([]);
  stats = signal<{ average: number; total: number; pending: number; averageTrend: number }>({ average: 0, total: 0, pending: 0, averageTrend: 0 });
  isLoading = signal(true);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  statusFilter = signal<'pending' | 'approved' | 'rejected' | undefined>(undefined);

  selectedReview = signal<ProductReview | null>(null);

  constructor() {
    effect(() => {
      const id = this.tenantService.tenantId();
      if (id) {
        this.loadData();
        this.loadStats();
      }
    });
  }

  columns: ColumnDef<ProductReview>[] = [
    {
      key: 'product',
      label: 'Product',
      formatter: (val, item) => item.product?.name || 'Product deleted'
    },
    {
      key: 'customer',
      label: 'Customer',
      formatter: (val, item) => `${item.customer?.first_name} ${item.customer?.last_name || ''}`
    },
    {
      key: 'rating',
      label: 'Rating',
      type: 'text',
      formatter: (val) => '⭐'.repeat(val as number)
    },
    {
      key: 'review',
      label: 'Content',
      formatter: (val) => (val as string)?.substring(0, 50) + '...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'text'
    },
    {
      key: 'created_at',
      label: 'Date',
      type: 'date'
    }
  ];

  actions: TableAction<ProductReview>[] = [
    {
      id: 'moderate',
      label: 'Moderar',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>',
      callback: (item) => this.selectedReview.set(item)
    }
  ];


  async loadData() {
    this.isLoading.set(true);
    this.reviews.set([]); // Clear old data
    try {
      const { data, count } = await this.reviewsService.getAdminReviews(
        this.currentPage(),
        this.pageSize(),
        this.statusFilter()
      );
      this.reviews.set(data);
      this.totalItems.set(count);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadStats() {
    try {
      const stats = await this.reviewsService.getReviewStats();
      this.stats.set(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }

  onStatusChange(status: any) {
    this.statusFilter.set(status === 'all' ? undefined : status);
    this.currentPage.set(1);
    this.loadData();
  }

  onAction(event: { actionId: string; item: ProductReview }) {
    if (event.actionId === 'moderate') {
      this.selectedReview.set(event.item);
    }
  }

  onReviewUpdated() {
    this.loadData();
    this.loadStats();
    this.selectedReview.set(null);
  }
}
