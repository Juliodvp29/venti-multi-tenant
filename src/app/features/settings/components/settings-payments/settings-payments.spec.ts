import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SettingsPayments } from './settings-payments';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { PaymentMethod } from '@core/enums';
import { Supabase } from '@core/services/supabase';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('SettingsPayments', () => {
  let component: SettingsPayments;
  let fixture: ComponentFixture<SettingsPayments>;

  const tenantMock = signal({
    id: 'tenant-123',
    business_name: 'Tienda Test',
    settings: {
      payment_methods: {
        [PaymentMethod.OnlinePayment]: {
          enabled: true,
          config: {
            provider: 'bold' as const,
            bold: {
              api_key: 'BOLD_API_123',
              has_secret_key: true,
              merchant_id: 'P4F0JC5QAI',
            },
            wompi: {},
          },
        },
        [PaymentMethod.CashOnDelivery]: { enabled: true, config: {} },
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

  const supabaseMock = {
    client: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [SettingsPayments],
      providers: [
        { provide: TenantService, useValue: tenantServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Supabase, useValue: supabaseMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPayments);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should initialize with 3 unified payment methods from tenant settings', () => {
    const methods = component.methods();
    expect(methods.length).toBe(3);

    const onlinePayment = methods.find((m) => m.id === PaymentMethod.OnlinePayment);
    const bankTransfer = methods.find((m) => m.id === PaymentMethod.BankTransfer);

    expect(onlinePayment?.enabled).toBe(true);
    expect(bankTransfer?.enabled).toBe(false);
    expect(component.enabledCount).toBe(2);
    expect(component.selectedProvider()).toBe('bold');
    expect(component.boldApiKey()).toBe('BOLD_API_123');
    expect(component.isBoldConfigured()).toBe(true);
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
    ]);

    component.toggleMethod(component.methods()[0].id);

    expect(toastServiceMock.error).toHaveBeenCalledWith(
      'Debes tener al menos un método de pago activo',
    );
    expect(component.methods()[0].enabled).toBe(true);
  });

  it('should toggle configuration modal for online payment gateways', () => {
    expect(component.isConfigModalOpen()).toBe(false);

    component.openConfigModal();
    expect(component.isConfigModalOpen()).toBe(true);

    component.selectProvider('wompi');
    expect(component.selectedProvider()).toBe('wompi');

    component.closeConfigModal();
    expect(component.isConfigModalOpen()).toBe(false);
  });

  it('should save payment methods and gateway settings via TenantService', async () => {
    component.boldApiKey.set('NEW_BOLD_KEY');
    component.boldSecretKey.set('NEW_BOLD_SECRET');
    component.onFieldChange();

    await component.save();

    expect(tenantServiceMock.updateTenant).toHaveBeenCalledWith(
      'tenant-123',
      expect.objectContaining({
        settings: expect.objectContaining({
          payment_methods: expect.objectContaining({
            [PaymentMethod.OnlinePayment]: expect.objectContaining({
              enabled: true,
              config: expect.objectContaining({
                provider: 'bold',
                bold: expect.objectContaining({
                  api_key: 'NEW_BOLD_KEY',
                  has_secret_key: true,
                }),
              }),
            }),
          }),
        }),
      }),
    );
    expect(supabaseMock.client.from).toHaveBeenCalledWith('tenant_payment_secrets');
    expect(toastServiceMock.success).toHaveBeenCalledWith(
      'Métodos de pago y pasarelas actualizados de forma segura',
    );
    expect(component.isDirty()).toBe(false);
  });

  it('should revert changes when cancel is called', () => {
    component.toggleMethod(PaymentMethod.BankTransfer);
    component.boldApiKey.set('TEMPORARY_MODIFIED_KEY');
    expect(component.isDirty()).toBe(true);

    component.cancel();

    expect(component.isDirty()).toBe(false);
    expect(component.boldApiKey()).toBe('BOLD_API_123');
    expect(toastServiceMock.info).toHaveBeenCalledWith('Cambios descartados');
  });
});
