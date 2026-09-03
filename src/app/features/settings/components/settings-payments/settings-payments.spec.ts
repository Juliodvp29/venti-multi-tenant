import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SettingsPayments } from './settings-payments';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { PaymentMethod } from '@core/enums';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('SettingsPayments', () => {
  let component: SettingsPayments;
  let fixture: ComponentFixture<SettingsPayments>;

  const tenantMock = signal({
    id: 'tenant-123',
    business_name: 'Tienda Test',
    settings: {
      payment_methods: {
        [PaymentMethod.CreditCard]: { enabled: true, config: {} },
        [PaymentMethod.CashOnDelivery]: { enabled: true, config: {} },
        [PaymentMethod.PSE]: { enabled: true, config: {} },
        [PaymentMethod.BankTransfer]: { enabled: false, config: {} },
      },
    },
  });

  const tenantServiceMock = {
    tenant: tenantMock,
    currentTenant: tenantMock,
    updateTenant: vi.fn().mockResolvedValue({ id: 'tenant-123' }),
  };

  const toastServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [SettingsPayments],
      providers: [
        { provide: TenantService, useValue: tenantServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPayments);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should initialize with payment methods from tenant settings', () => {
    const methods = component.methods();
    expect(methods.length).toBe(4);

    const creditCard = methods.find((m) => m.id === PaymentMethod.CreditCard);
    const bankTransfer = methods.find((m) => m.id === PaymentMethod.BankTransfer);

    expect(creditCard?.enabled).toBe(true);
    expect(bankTransfer?.enabled).toBe(false);
    expect(component.enabledCount).toBe(3);
  });

  it('should toggle payment method and mark as dirty', () => {
    let dirtyEmitted = false;
    component.dirtyChange.subscribe((isDirty) => {
      dirtyEmitted = isDirty;
    });

    component.toggleMethod(PaymentMethod.BankTransfer);

    const bankTransfer = component.methods().find((m) => m.id === PaymentMethod.BankTransfer);
    expect(bankTransfer?.enabled).toBe(true);
    expect(component.isDirty()).toBe(true);
    expect(dirtyEmitted).toBe(true);
  });

  it('should not allow disabling all payment methods (requires at least 1 active)', () => {
    // Disable down to 1 active
    component.methods.set([
      { ...component.methods()[0], enabled: true },
      { ...component.methods()[1], enabled: false },
      { ...component.methods()[2], enabled: false },
      { ...component.methods()[3], enabled: false },
    ]);

    component.toggleMethod(component.methods()[0].id);

    expect(toastServiceMock.error).toHaveBeenCalledWith(
      'Debes tener al menos un método de pago activo',
    );
    expect(component.methods()[0].enabled).toBe(true);
  });

  it('should save payment methods via TenantService and show success toast', async () => {
    component.toggleMethod(PaymentMethod.CreditCard);

    await component.save();

    expect(tenantServiceMock.updateTenant).toHaveBeenCalledWith(
      'tenant-123',
      expect.objectContaining({
        settings: expect.objectContaining({
          payment_methods: expect.any(Object),
        }),
      }),
    );
    expect(toastServiceMock.success).toHaveBeenCalledWith('Métodos de pago actualizados');
    expect(component.isDirty()).toBe(false);
  });

  it('should revert changes when cancel is called', () => {
    component.toggleMethod(PaymentMethod.BankTransfer);
    expect(component.isDirty()).toBe(true);

    component.cancel();

    expect(component.isDirty()).toBe(false);
    expect(toastServiceMock.info).toHaveBeenCalledWith('Cambios descartados');
  });
});
