import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CurrencyPipe } from '@angular/common';
import { signal } from '@angular/core';
import { Coupons } from './coupons';
import { DiscountsService } from '@core/services/discounts';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';

const mockDiscountsService = {
  getDiscounts: vi.fn().mockResolvedValue([]),
  getDiscountCodes: vi.fn().mockResolvedValue([]),
  deleteDiscount: vi.fn().mockResolvedValue(undefined),
  toggleDiscountStatus: vi.fn().mockResolvedValue(undefined),
};

const mockTenantService = {
  tenant: signal({ id: 'tenant-1', business_name: 'Test Store' }),
  tenantId: signal('tenant-1'),
  currency: signal('COP'),
};

const mockToastService = {
  success: vi.fn(),
  error: vi.fn(),
};

describe('Coupons', () => {
  let component: Coupons;
  let fixture: ComponentFixture<Coupons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Coupons],
      providers: [
        CurrencyPipe,
        { provide: DiscountsService, useValue: mockDiscountsService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Coupons);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
