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
  stats = signal<{ average: number; total: number; pending: number }>({ average: 0, total: 0, pending: 0 });
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
      label: 'Producto',
      formatter: (val, item) => item.product?.name || 'Producto eliminado'
    },
    {
      key: 'customer',
      label: 'Cliente',
      formatter: (val, item) => `${item.customer?.first_name} ${item.customer?.last_name || ''}`
    },
    {
      key: 'rating',
      label: 'Calificación',
      type: 'text',
      formatter: (val) => '⭐'.repeat(val as number)
    },
    {
      key: 'review',
      label: 'Contenido',
      formatter: (val) => (val as string)?.substring(0, 50) + '...'
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'text'
    },
    {
      key: 'created_at',
      label: 'Fecha',
      type: 'date'
    }
  ];

  actions: TableAction<ProductReview>[] = [
    {
      id: 'moderate',
      label: 'Moderar',
      icon: 'eye',
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
