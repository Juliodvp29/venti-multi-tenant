import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CouponModalComponent } from './coupon-modal.component';
import { DiscountsService } from '@core/services/discounts';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';

describe('CouponModalComponent', () => {
  let component: CouponModalComponent;
  let fixture: ComponentFixture<CouponModalComponent>;
  const discountsService = {
    createDiscountCode: vi.fn(),
    updateDiscountCode: vi.fn(),
  };
  const toastService = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CouponModalComponent],
      providers: [
        { provide: DiscountsService, useValue: discountsService },
        { provide: ToastService, useValue: toastService },
        { provide: TenantService, useValue: { currency: signal('COP') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CouponModalComponent);
    component = fixture.componentInstance;
  });

  it('generates a valid uppercase coupon code', () => {
    component.generateCode();

    const code = component.form.controls.code.value;
    expect(code).toMatch(/^(SUMMER|WELCOME|SAVE|OFFER|VENTI|DISCOUNT)\d{4}$/);
  });

  it('creates a coupon and emits saved and close events', async () => {
    discountsService.createDiscountCode.mockResolvedValue({ id: 'coupon-1' });
    const saved = vi.fn();
    const close = vi.fn();
    component.saved.subscribe(saved);
    component.close.subscribe(close);
    component.form.patchValue({ code: 'WELCOME10', value: 10 });

    await component.onSubmit();

    expect(discountsService.createDiscountCode).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'WELCOME10', value: 10 }),
    );
    expect(toastService.success).toHaveBeenCalledWith('Cupón creado');
    expect(saved).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});
