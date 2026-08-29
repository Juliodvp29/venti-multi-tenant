import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter, Router } from '@angular/router';
import { Orders } from './orders';
import { OrdersList } from './components/orders-list/orders-list';
import { OrdersService, OrderStats } from '@core/services/orders';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { OrderStatus, PaymentStatus } from '@core/enums';
import { Order } from '@core/models/order';
import { vi, describe, beforeEach, it, expect } from 'vitest';

registerLocaleData(localeEs, 'es');

describe('Orders Feature', () => {
  describe('Orders Root Component', () => {
    let component: Orders;
    let fixture: ComponentFixture<Orders>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Orders],
        providers: [provideRouter([])],
      }).compileComponents();

      fixture = TestBed.createComponent(Orders);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    it('should create root component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('OrdersList Component', () => {
    let component: OrdersList;
    let fixture: ComponentFixture<OrdersList>;
    let router: Router;

    const mockOrders: Order[] = [
      {
        id: 'ord-1',
        order_number: 'ORD-001',
        tenant_id: 't1',
        customer_id: 'c1',
        status: OrderStatus.Delivered,
        payment_status: PaymentStatus.Completed,
        total_amount: 150000,
        subtotal: 140000,
        tax_amount: 10000,
        discount_amount: 0,
        shipping_amount: 0,
        currency: 'COP',
        customer_first_name: 'John',
        customer_last_name: 'Doe',
        customer_email: 'john@test.com',
        created_at: new Date().toISOString(),
      },
      {
        id: 'ord-2',
        order_number: 'ORD-002',
        tenant_id: 't1',
        customer_id: 'c2',
        status: OrderStatus.Pending,
        payment_status: PaymentStatus.Pending,
        total_amount: 80000,
        subtotal: 75000,
        tax_amount: 5000,
        discount_amount: 0,
        shipping_amount: 0,
        currency: 'COP',
        customer_first_name: 'Jane',
        customer_last_name: 'Smith',
        customer_email: 'jane@test.com',
        created_at: new Date().toISOString(),
      },
    ];

    const mockStats: OrderStats = {
      totalThisMonth: 10,
      pendingFulfillment: 1,
      revenueToday: 150000,
      revenuePrevDay: 80000,
    };

    const ordersServiceMock = {
      getOrders: vi.fn().mockResolvedValue({ data: mockOrders, count: 2 }),
      getOrderStats: vi.fn().mockResolvedValue(mockStats),
      exportOrders: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
    };

    const tenantServiceMock = {
      tenantId: signal('tenant-123'),
      currency: signal('COP'),
      timezone: signal('America/Bogota'),
    };

    const toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    beforeEach(async () => {
      vi.clearAllMocks();
      ordersServiceMock.getOrders.mockResolvedValue({ data: mockOrders, count: 2 });
      ordersServiceMock.getOrderStats.mockResolvedValue(mockStats);

      await TestBed.configureTestingModule({
        imports: [OrdersList],
        providers: [
          provideRouter([]),
          { provide: OrdersService, useValue: ordersServiceMock },
          { provide: TenantService, useValue: tenantServiceMock },
          { provide: ToastService, useValue: toastServiceMock },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      fixture = TestBed.createComponent(OrdersList);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    it('should create and load orders and stats', async () => {
      expect(component).toBeTruthy();
      await component.loadOrders();
      await component.loadStats();

      expect(component.orders().length).toBe(2);
      expect(component.totalCount()).toBe(2);
      expect(component.stats()?.revenueToday).toBe(150000);
      expect(component.stats()?.pendingFulfillment).toBe(1);
    });

    it('should filter by status', async () => {
      const mockEvent = { target: { value: OrderStatus.Pending } } as unknown as Event;
      component.onStatusFilterChange(mockEvent);
      expect(component.statusFilter()).toBe(OrderStatus.Pending);
      expect(component.currentPage()).toBe(1);
    });

    it('should handle pagination via loadOrders', async () => {
      await component.loadOrders(2);
      expect(component.currentPage()).toBe(2);
      expect(ordersServiceMock.getOrders).toHaveBeenCalledWith(
        2,
        expect.any(Number),
        expect.any(Object),
      );
    });

    it('should handle sort change', async () => {
      component.onSortChange({ key: 'total_amount', direction: 'desc' });
      expect(component.sortState()?.key).toBe('total_amount');
      expect(component.sortState()?.direction).toBe('desc');
    });

    it('should navigate to order details on row click', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.onRowClick(mockOrders[0]);
      expect(navigateSpy).toHaveBeenCalledWith(['/orders', 'ord-1']);
    });

    it('should open and close create order drawer', () => {
      component.openCreate();
      expect(component.showDrawer()).toBe(true);

      component.closeDrawer();
      expect(component.showDrawer()).toBe(false);
    });
  });
});
