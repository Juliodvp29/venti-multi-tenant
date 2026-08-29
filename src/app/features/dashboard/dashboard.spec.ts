import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Dashboard } from './dashboard';
import { AnalyticsService } from '@core/services/analytics';
import { OrdersService } from '@core/services/orders';
import { TenantService } from '@core/services/tenant';

// Mock matchMedia for ApexCharts/SalesChart
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for ApexCharts
(globalThis as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mockAnalyticsService = {
  getOverviewMetrics: vi.fn().mockResolvedValue({
    totalRevenue: 1000000,
    totalOrders: 25,
    averageOrderValue: 40000,
    conversionRate: 3.5,
    revenueTrend: 12,
    ordersTrend: 8,
    aovTrend: 4,
    conversionTrend: 1.2,
    salesByPeriod: [],
    salesByCategory: [],
  }),
  getTopProducts: vi.fn().mockResolvedValue([]),
  getProductPerformance: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({
    totalRevenue: 1000000,
    totalOrders: 25,
    totalCustomers: 10,
    totalProducts: 5,
    revenueChange: 10,
    ordersChange: 5,
    customersChange: 2,
    productsChange: 1,
  }),
  getMonthlySales: vi.fn().mockResolvedValue([]),
  getCategorySales: vi.fn().mockResolvedValue([]),
  getSalesByCategoryBI: vi.fn().mockResolvedValue([]),
  getRecentTransactions: vi.fn().mockResolvedValue([]),
};

const mockOrdersService = {
  getOrders: vi.fn().mockResolvedValue({ data: [], count: 0 }),
};

const mockTenantService = {
  tenant: signal({ id: 'tenant-123', business_name: 'Test Tenant', settings: { currency: 'COP' } }),
  currentTenant: signal({ id: 'tenant-123', business_name: 'Test Tenant', settings: { currency: 'COP' } }),
  tenantId: signal('tenant-123'),
  currency: signal('COP'),
  timezone: signal('America/Bogota'),
};

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
