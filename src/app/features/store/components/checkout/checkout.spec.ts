import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Checkout } from './checkout';
import { TenantService } from '@core/services/tenant';
import { CartService } from '@core/services/cart';
import { OrdersService } from '@core/services/orders';
import { CustomerAuthService } from '@core/services/customer-auth';
import { CustomersService } from '@core/services/customers';
import { ToastService } from '@core/services/toast';
import { PaymentMethod } from '@core/enums';
import { provideRouter } from '@angular/router';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('Checkout Component - Payment Methods', () => {
  let component: Checkout;
  let fixture: ComponentFixture<Checkout>;

  const currentTenantMock = signal<any>({
    id: 'tenant-123',
    business_name: 'Test Store',
    settings: {
      currency: 'COP',
      payment_methods: {
        [PaymentMethod.CreditCard]: { enabled: false, config: {} },
        [PaymentMethod.CashOnDelivery]: { enabled: true, config: {} },
        [PaymentMethod.PSE]: { enabled: false, config: {} },
        [PaymentMethod.BankTransfer]: { enabled: true, config: {} },
      },
    },
  });

  const tenantServiceMock = {
    tenantId: signal('tenant-123'),
    currentTenant: currentTenantMock,
    tenant: currentTenantMock,
    currency: signal('COP'),
  };

  const cartServiceMock = {
    items: signal([]),
    total: signal(50000),
    subtotal: signal(45000),
    shippingCost: signal(5000),
    tax: signal(0),
    discount: signal(0),
    appliedCoupon: signal(null),
    setShippingLocation: vi.fn(),
  };

  const ordersServiceMock = {
    createOrder: vi.fn(),
  };

  const customerAuthServiceMock = {
    currentCustomer: signal(null),
    ensureCustomer: vi.fn().mockResolvedValue({ id: 'cust-1' }),
  };

  const customersServiceMock = {
    getAddresses: vi.fn().mockResolvedValue([]),
    getCustomerAddresses: vi.fn().mockResolvedValue([]),
    getSavedCards: vi.fn().mockResolvedValue([]),
  };

  const toastServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideRouter([]),
        { provide: TenantService, useValue: tenantServiceMock },
        { provide: CartService, useValue: cartServiceMock },
        { provide: OrdersService, useValue: ordersServiceMock },
        { provide: CustomerAuthService, useValue: customerAuthServiceMock },
        { provide: CustomersService, useValue: customersServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should only show enabled payment methods based on tenant settings', () => {
    const available = component.paymentMethods();
    expect(available.length).toBe(2);

    const ids = available.map((m) => m.id);
    expect(ids).toContain(PaymentMethod.CashOnDelivery);
    expect(ids).toContain(PaymentMethod.BankTransfer);
    expect(ids).not.toContain(PaymentMethod.CreditCard);
    expect(ids).not.toContain(PaymentMethod.PSE);
  });

  it('should automatically select the first enabled payment method if default is disabled', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    // Since CreditCard is disabled in currentTenantMock, it should automatically fallback to CashOnDelivery
    expect(component.selectedPaymentMethod()).toBe(PaymentMethod.CashOnDelivery);
  });

  it('should show all payment methods when payment_methods setting is not defined (backward compatibility)', () => {
    currentTenantMock.set({
      id: 'tenant-123',
      business_name: 'Test Store',
      settings: {
        currency: 'COP',
      },
    });

    fixture.detectChanges();

    expect(component.paymentMethods().length).toBe(4);
  });
});
