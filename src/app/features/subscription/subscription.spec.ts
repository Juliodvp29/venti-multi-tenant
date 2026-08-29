import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { Subscription } from './subscription';
import { SubscriptionService } from '@core/services/subscription';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { BILLING_PLANS } from '@core/models/billing.model';

registerLocaleData(localeEs, 'es');

describe('Subscription Component', () => {
  let component: Subscription;
  let fixture: ComponentFixture<Subscription>;

  const mockTenant = signal<any>({
    id: 'test-tenant-123',
    business_name: 'Tienda Demo',
    plan: 'professional',
    plan_status: 'active',
    subscription_ends_at: '2026-10-05T00:00:00.000Z',
  });

  const mockSubscriptionService = {
    getPlans: vi.fn().mockReturnValue(BILLING_PLANS),
    getSubscriptionHistory: vi.fn().mockResolvedValue([
      {
        id: 'hist-1',
        tenant_id: 'test-tenant-123',
        plan: 'professional',
        status: 'active',
        amount: 60900,
        currency: 'COP',
        billing_period_start: '2026-09-05T00:00:00.000Z',
        billing_period_end: '2026-10-05T00:00:00.000Z',
        created_at: '2026-09-05T00:00:00.000Z',
      },
    ]),
    getUsage: vi.fn().mockResolvedValue({ products: 10, members: 2, categories: 3 }),
    cancelSubscription: vi.fn().mockResolvedValue(undefined),
    reactivateSubscription: vi.fn().mockResolvedValue(undefined),
    changePlan: vi.fn().mockResolvedValue(undefined),
  };

  const mockTenantService = {
    tenant: mockTenant,
    tenantId: signal('test-tenant-123'),
    currency: signal('COP'),
  };

  const mockToastService = {
    success: vi.fn(),
    error: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    mockTenant.set({
      id: 'test-tenant-123',
      business_name: 'Tienda Demo',
      plan: 'professional',
      plan_status: 'active',
      subscription_ends_at: '2026-10-05T00:00:00.000Z',
    });

    await TestBed.configureTestingModule({
      imports: [Subscription],
      providers: [
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Subscription);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and load initial plans and history', () => {
    expect(component).toBeTruthy();
    expect(component.plans().length).toBeGreaterThan(0);
    expect(component.activePlanId()).toBe('professional');
    expect(component.activePlanStatus()).toBe('active');
  });

  it('should compute cancellation and grace period state correctly', () => {
    expect(component.isCancelled()).toBe(false);
    expect(component.isCancelledAndActive()).toBe(false);

    // Simulate tenant in cancelled state with future end date
    mockTenant.set({
      id: 'test-tenant-123',
      plan: 'professional',
      plan_status: 'cancelled',
      subscription_ends_at: '2099-10-05T00:00:00.000Z',
    });

    expect(component.isCancelled()).toBe(true);
    expect(component.isCancelledAndActive()).toBe(true);
    expect(component.isExpired()).toBe(false);
  });

  it('should prompt confirmation and cancel subscription', async () => {
    await component.cancelSubscription();

    expect(mockToastService.confirm).toHaveBeenCalled();
    expect(mockSubscriptionService.cancelSubscription).toHaveBeenCalled();
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it('should reactivate subscription when requested', async () => {
    await component.reactivateSubscription();

    expect(mockSubscriptionService.reactivateSubscription).toHaveBeenCalled();
    expect(mockToastService.success).toHaveBeenCalled();
  });
});

