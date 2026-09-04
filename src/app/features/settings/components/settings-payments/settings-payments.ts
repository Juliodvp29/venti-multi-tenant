import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { PaymentMethod } from '@core/enums';
import { PaymentMethodItemConfig, TenantPaymentSettings } from '@core/models';

interface PaymentMethodDisplay {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: string;
  badges?: string[];
  enabled: boolean;
}

const DEFAULT_PAYMENT_METHODS: TenantPaymentSettings = {
  [PaymentMethod.CreditCard]: { enabled: true, config: {} },
  [PaymentMethod.CashOnDelivery]: { enabled: true, config: {} },
  [PaymentMethod.PSE]: { enabled: true, config: {} },
  [PaymentMethod.BankTransfer]: { enabled: true, config: {} },
};

@Component({
  selector: 'app-settings-payments',
  imports: [CommonModule],
  templateUrl: './settings-payments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPayments {
  private readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);

  readonly isSaving = signal(false);
  readonly isDirty = signal(false);
  readonly dirtyChange = output<boolean>();
  readonly tenant = this.tenantService.tenant;

  readonly methodDefinitions: {
    id: PaymentMethod;
    label: string;
    description: string;
    icon: string;
    badges?: string[];
  }[] = [
    {
      id: PaymentMethod.CreditCard,
      label: 'Tarjeta débito y crédito',
      description: 'Paga al instante con Visa, Mastercard o American Express.',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      badges: ['Visa', 'Mastercard', 'Amex'],
    },
    {
      id: PaymentMethod.CashOnDelivery,
      label: 'Pago contra entrega',
      description: 'Paga en efectivo o datáfono al recibir tu pedido en tu puerta.',
      icon: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
    },
    {
      id: PaymentMethod.PSE,
      label: 'PSE (Transferencia en línea)',
      description: 'Débito seguro desde la cuenta de ahorros o corriente del cliente.',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    {
      id: PaymentMethod.BankTransfer,
      label: 'Transferencia Bancaria Directa',
      description: 'Realiza tu pago vía Bancolombia, Nequi o Daviplata.',
      icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    },
  ];

  readonly methods = signal<PaymentMethodDisplay[]>([]);

  constructor() {
    effect(() => {
      const tenant = this.tenant();
      if (tenant) {
        const saved = (tenant.settings?.['payment_methods'] as TenantPaymentSettings) || {};
        const merged: PaymentMethodDisplay[] = this.methodDefinitions.map((def) => ({
          ...def,
          enabled: saved[def.id]?.enabled ?? DEFAULT_PAYMENT_METHODS[def.id]?.enabled ?? true,
        }));
        this.methods.set(merged);
        this.isDirty.set(false);
        this.dirtyChange.emit(false);
      }
    });
  }

  toggleMethod(methodId: PaymentMethod): void {
    const current = this.methods();
    const enabledCount = current.filter((m) => m.enabled).length;
    const target = current.find((m) => m.id === methodId);

    if (target?.enabled && enabledCount <= 1) {
      this.toastService.error('Debes tener al menos un método de pago activo');
      return;
    }

    this.methods.update((list) =>
      list.map((m) => (m.id === methodId ? { ...m, enabled: !m.enabled } : m)),
    );
    this.isDirty.set(true);
    this.dirtyChange.emit(true);
  }

  async save(silent = false): Promise<boolean> {
    const tenant = this.tenant();
    if (!tenant) return false;

    this.isSaving.set(true);
    try {
      const paymentSettings: TenantPaymentSettings = {};
      for (const m of this.methods()) {
        paymentSettings[m.id] = {
          enabled: m.enabled,
          config:
            (tenant.settings?.['payment_methods'] as TenantPaymentSettings)?.[m.id]?.config || {},
        };
      }

      await this.tenantService.updateTenant(tenant.id, {
        settings: {
          ...tenant.settings,
          payment_methods: paymentSettings,
        },
      });

      if (!silent) this.toastService.success('Métodos de pago actualizados');
      this.isDirty.set(false);
      this.dirtyChange.emit(false);
      return true;
    } catch (error) {
      console.error('Error saving payment methods:', error);
      if (!silent) this.toastService.error('Error al guardar los métodos de pago');
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    const tenant = this.tenant();
    if (tenant) {
      const saved = (tenant.settings?.['payment_methods'] as TenantPaymentSettings) || {};
      this.methods.set(
        this.methodDefinitions.map((def) => ({
          ...def,
          enabled: saved[def.id]?.enabled ?? DEFAULT_PAYMENT_METHODS[def.id]?.enabled ?? true,
        })),
      );
    }
    this.isDirty.set(false);
    this.dirtyChange.emit(false);
    this.toastService.info('Cambios descartados');
  }

  get enabledCount(): number {
    return this.methods().filter((m) => m.enabled).length;
  }
}
