import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { Reviews } from './reviews';
import { ReviewsService } from '@core/services/reviews';
import { TenantService } from '@core/services/tenant';
import { ProductReview } from '@core/models/review';
import { vi, describe, beforeEach, it, expect } from 'vitest';

registerLocaleData(localeEs, 'es');

describe('Reviews', () => {
  let component: Reviews;
  let fixture: ComponentFixture<Reviews>;

  const mockReviews: ProductReview[] = [
    {
      id: 'rev-1',
      tenant_id: 't1',
      product_id: 'p1',
      customer_id: 'c1',
      rating: 5,
      title: 'Excelente',
      review: 'Muy buen producto, super recomendado.',
      status: 'approved',
      is_verified_purchase: true,
      is_approved: true,
      created_at: new Date().toISOString(),
      product: { name: 'Camiseta Premium' },
      customer: { first_name: 'Carlos', last_name: 'Gómez' },
    },
    {
      id: 'rev-2',
      tenant_id: 't1',
      product_id: 'p2',
      customer_id: 'c2',
      rating: 3,
      title: 'Regular',
      review: 'La talla es un poco pequeña.',
      status: 'pending',
      is_verified_purchase: true,
      is_approved: false,
      created_at: new Date().toISOString(),
      product: { name: 'Pantalón Slim' },
      customer: { first_name: 'María', last_name: 'Pérez' },
    },
  ];

  const mockStats = {
    average: 4.5,
    total: 2,
    pending: 1,
    averageTrend: 5,
  };

  const reviewsServiceMock = {
    getAdminReviews: vi.fn().mockResolvedValue({ data: mockReviews, count: 2 }),
    getReviewStats: vi.fn().mockResolvedValue(mockStats),
  };

  const tenantServiceMock = {
    tenantId: signal('tenant-123'),
    timezone: signal('America/Bogota'),
    currency: signal('COP'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    reviewsServiceMock.getAdminReviews.mockResolvedValue({ data: mockReviews, count: 2 });
    reviewsServiceMock.getReviewStats.mockResolvedValue(mockStats);

    await TestBed.configureTestingModule({
      imports: [Reviews],
      providers: [
        { provide: ReviewsService, useValue: reviewsServiceMock },
        { provide: TenantService, useValue: tenantServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Reviews);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and load reviews and stats', async () => {
    expect(component).toBeTruthy();
    await component.loadData();
    await component.loadStats();

    expect(component.reviews().length).toBe(2);
    expect(component.totalItems()).toBe(2);
    expect(component.stats().average).toBe(4.5);
    expect(component.stats().pending).toBe(1);
  });

  it('should filter reviews by status', async () => {
    component.onStatusChange('pending');
    expect(component.statusFilter()).toBe('pending');
    expect(component.currentPage()).toBe(1);
    expect(reviewsServiceMock.getAdminReviews).toHaveBeenCalledWith(1, 10, 'pending');
  });

  it('should reset filter when selecting all', async () => {
    component.onStatusChange('all');
    expect(component.statusFilter()).toBeUndefined();
    expect(reviewsServiceMock.getAdminReviews).toHaveBeenCalledWith(1, 10, undefined);
  });

  it('should handle pagination', async () => {
    component.onPageChange(3);
    expect(component.currentPage()).toBe(3);
    expect(reviewsServiceMock.getAdminReviews).toHaveBeenCalledWith(3, 10, undefined);
  });

  it('should open moderation modal on action click', () => {
    component.onAction({ actionId: 'moderate', item: mockReviews[1] });
    expect(component.selectedReview()).toEqual(mockReviews[1]);
  });

  it('should reload data on review updated', async () => {
    component.selectedReview.set(mockReviews[0]);
    component.onReviewUpdated();

    expect(component.selectedReview()).toBeNull();
    expect(reviewsServiceMock.getAdminReviews).toHaveBeenCalled();
    expect(reviewsServiceMock.getReviewStats).toHaveBeenCalled();
  });
});
