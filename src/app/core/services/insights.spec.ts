import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { InsightsService } from './insights';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { NotificationsService } from './notifications';
import { OrdersService } from './orders';
import { AnalyticsService } from './analytics';
import { ReviewsService } from './reviews';
import { AbandonedCartService } from './abandoned-cart';
import { DiscountsService } from './discounts';
import { OrderStatus, PaymentMethod } from '@core/enums';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('InsightsService', () => {
  const velocityRows = [
    {
      id: 'p1',
      name: 'Camiseta',
      sku: 'CAM-01',
      stock_quantity: 6,
      days_of_stock_remaining: 2,
      average_daily_sales: 3,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lowStockChain: any = {};
  lowStockChain.select = vi.fn(() => lowStockChain);
  lowStockChain.eq = vi.fn(() => lowStockChain);
  lowStockChain.limit = vi.fn(async () => ({ data: velocityRows, error: null }));
  lowStockChain.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ count: velocityRows.length, error: null }).then(resolve);

  const supabaseMock = { client: { from: vi.fn(() => lowStockChain) } };
  const tenantMock = {
    tenantId: signal('tenant-123'),
    tenant: signal({
      plan: 'professional',
      plan_status: 'active',
      trial_ends_at: null,
      subscription_ends_at: null,
    }),
    currency: signal('USD'),
  };
  const notificationsMock = { createNotification: vi.fn().mockResolvedValue(undefined) };
  const ordersMock = {
    getOrderStats: vi.fn().mockResolvedValue({
      totalThisMonth: 20,
      pendingFulfillment: 10,
      revenueToday: 1000,
      revenuePrevDay: 800,
    }),
    getOrders: vi.fn().mockResolvedValue({
      data: [
        { id: 'o1', status: OrderStatus.Pending, payment_method: PaymentMethod.CashOnDelivery },
        { id: 'o2', status: OrderStatus.Pending, payment_method: PaymentMethod.CashOnDelivery },
        { id: 'o3', status: OrderStatus.Paid, payment_method: PaymentMethod.CreditCard },
      ],
      count: 3,
    }),
  };
  const analyticsMock = {
    getDashboardStats: vi.fn().mockResolvedValue({ today_revenue: 500000, today_orders: 5 }),
    getFullDailySalesSummary: vi.fn().mockResolvedValue([]),
  };
  const reviewsMock = {
    getReviewStats: vi.fn().mockResolvedValue({ average: 4.5, total: 10, pending: 0 }),
  };
  const cartsMock = { getAbandonedCarts: vi.fn().mockResolvedValue([]) };
  const discountsMock = { getDiscountCodes: vi.fn().mockResolvedValue({ data: [] }) };

  let service: InsightsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    try {
      localStorage.clear();
    } catch {
      // Sin localStorage en este entorno: el servicio usa memoria de sesión.
    }

    await TestBed.configureTestingModule({
      providers: [
        InsightsService,
        { provide: Supabase, useValue: supabaseMock },
        { provide: TenantService, useValue: tenantMock },
        { provide: NotificationsService, useValue: notificationsMock },
        { provide: OrdersService, useValue: ordersMock },
        { provide: AnalyticsService, useValue: analyticsMock },
        { provide: ReviewsService, useValue: reviewsMock },
        { provide: AbandonedCartService, useValue: cartsMock },
        { provide: DiscountsService, useValue: discountsMock },
      ],
    }).compileComponents();

    service = TestBed.inject(InsightsService);
  });

  it('should create the morning briefing with pending shipments only once per day', async () => {
    await service.refreshMorningBriefing();

    expect(notificationsMock.createNotification).toHaveBeenCalledTimes(1);
    const payload = notificationsMock.createNotification.mock.calls[0][0];
    expect(payload.type).toBe('morning_briefing');
    expect(payload.link).toBe('/dashboard');
    expect(payload.message).toContain('10 órdenes pendientes de envío');
    expect(payload.message).not.toContain('contra entrega');

    await service.refreshMorningBriefing();
    expect(notificationsMock.createNotification).toHaveBeenCalledTimes(1);
  });

  it('should skip the briefing when the store has no activity', async () => {
    ordersMock.getOrderStats.mockResolvedValueOnce({
      totalThisMonth: 0,
      pendingFulfillment: 0,
      revenueToday: 0,
      revenuePrevDay: 0,
    });
    analyticsMock.getDashboardStats.mockResolvedValueOnce({ today_revenue: 0, today_orders: 0 });
    lowStockChain.limit.mockResolvedValueOnce({ data: [], error: null });
    lowStockChain.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ count: 0, error: null }).then(resolve);

    await service.refreshInsights();

    const types = notificationsMock.createNotification.mock.calls.map((call) => call[0].type);
    expect(types).not.toContain('morning_briefing');
  });

  it('should alert products running out based on sales velocity', async () => {
    await service.refreshVelocityAlerts();

    const payload = notificationsMock.createNotification.mock.calls[0][0];
    expect(payload.type).toBe('stock_velocity');
    expect(payload.message).toContain('Camiseta');
    expect(payload.link).toBe('/products');
  });

  it('should skip velocity alerts when coverage is healthy', async () => {
    lowStockChain.limit.mockResolvedValueOnce({
      data: [{ ...velocityRows[0], days_of_stock_remaining: 30 }],
      error: null,
    });

    await service.refreshVelocityAlerts();

    expect(notificationsMock.createNotification).not.toHaveBeenCalled();
  });

  it('should notify record sales days above the 7-day average', async () => {
    const previous = Array.from({ length: 7 }, (_, i) => ({
      date: `2026-07-${String(i + 1).padStart(2, '0')}`,
      total_revenue: 100,
    }));
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    analyticsMock.getFullDailySalesSummary.mockResolvedValueOnce([
      { date: todayKey, total_revenue: 200 },
      ...previous,
    ]);

    await service.refreshSalesRecord();

    const payload = notificationsMock.createNotification.mock.calls[0][0];
    expect(payload.type).toBe('sales_record');
    expect(payload.message).toContain('100%');
  });

  it('should warn about coupons expiring within 3 days', async () => {
    const endsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    discountsMock.getDiscountCodes.mockResolvedValueOnce({
      data: [{ id: 'c1', code: 'VERANO10', is_active: true, ends_at: endsAt }],
    });

    await service.refreshCouponAlerts();

    const payload = notificationsMock.createNotification.mock.calls[0][0];
    expect(payload.type).toBe('coupon_expiring');
    expect(payload.message).toContain('VERANO10');
  });

  it('should remind when the trial is about to end and skip free plans', async () => {
    tenantMock.tenant.set({
      plan: 'professional',
      plan_status: 'trial',
      trial_ends_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_ends_at: null,
    } as never);
    await service.refreshSubscriptionReminder();

    const payload = notificationsMock.createNotification.mock.calls[0][0];
    expect(payload.type).toBe('subscription_expiring');
    expect(payload.title).toContain('prueba');

    vi.clearAllMocks();
    tenantMock.tenant.set({ plan: 'free', plan_status: 'active' } as never);
    await service.refreshSubscriptionReminder();

    expect(notificationsMock.createNotification).not.toHaveBeenCalled();
  });

  it('should digest pending reviews and recoverable carts', async () => {
    reviewsMock.getReviewStats.mockResolvedValueOnce({
      average: 4,
      total: 5,
      pending: 3,
    });
    cartsMock.getAbandonedCarts.mockResolvedValueOnce([
      { id: 'cart1', total_amount: 150000 },
      { id: 'cart2', total_amount: 50000 },
    ]);

    await service.refreshReviewDigest();
    await service.refreshCartDigest();

    const types = notificationsMock.createNotification.mock.calls.map((call) => call[0].type);
    expect(types).toContain('review_digest');
    expect(types).toContain('cart_digest');
  });
});
