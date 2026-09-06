import { ChangeDetectionStrategy, Component, computed, effect, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { PaymentMethod } from '@core/enums';
import { BoldPaymentConfig, OnlinePaymentConfig, TenantPaymentSettings, WompiPaymentConfig } from '@core/models';
import { environment } from '@env/environment';

import { Supabase } from '@core/services/supabase';

interface PaymentMethodDisplay {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: string;
  badges?: string[];
  enabled: boolean;
}

const DEFAULT_PAYMENT_METHODS: TenantPaymentSettings = {
  [PaymentMethod.OnlinePayment]: {
    enabled: true,
    config: {
      provider: 'bold',
      bold: {},
      wompi: {},
    } as OnlinePaymentConfig,
  },
  [PaymentMethod.CashOnDelivery]: { enabled: true, config: {} },
  [PaymentMethod.BankTransfer]: { enabled: true, config: {} },
};

@Component({
  selector: 'app-settings-payments',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-payments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPayments {
  private readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);
  private readonly supabase = inject(Supabase);

  readonly isSaving = signal(false);
  readonly isDirty = signal(false);
  readonly dirtyChange = output<boolean>();
  readonly tenant = this.tenantService.tenant;

  // Modal / drawer state for Online Payment configuration
  readonly isConfigModalOpen = signal(false);
  readonly selectedProvider = signal<'bold' | 'wompi'>('bold');

  // Bold Form Fields
  readonly boldApiKey = signal('');
  readonly boldSecretKey = signal('');
  readonly boldMerchantId = signal('');
  readonly showBoldSecret = signal(false);
  readonly hasExistingBoldSecret = signal(false);

  // Wompi Form Fields
  readonly wompiPublicKey = signal('');
  readonly wompiWebhookSecret = signal('');
  readonly wompiIntegritySecret = signal('');
  readonly showWompiSecret = signal(false);
  readonly hasExistingWompiSecret = signal(false);
  readonly hasExistingWompiIntegrity = signal(false);

  // Webhook URLs
  readonly boldWebhookUrl = `${environment.supabase.url}/functions/v1/bold-webhook`;
  readonly wompiWebhookUrl = `${environment.supabase.url}/functions/v1/wompi-webhook`;

  readonly methodDefinitions: {
    id: PaymentMethod;
    label: string;
    description: string;
    icon: string;
    badges?: string[];
  }[] = [
    {
      id: PaymentMethod.OnlinePayment,
      label: 'Pago en línea',
      description: 'Recibe pagos en tiempo real con Tarjetas (Visa, Mastercard, Amex), PSE y Nequi.',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      badges: ['Tarjetas', 'PSE', 'Nequi', 'Bancolombia'],
    },
    {
      id: PaymentMethod.CashOnDelivery,
      label: 'Pago contra entrega',
      description: 'Paga en efectivo o datáfono al recibir tu pedido en tu puerta.',
      icon: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
    },
    {
      id: PaymentMethod.BankTransfer,
      label: 'Transferencia Bancaria Directa',
      description: 'Realiza tu pago vía Bancolombia, Nequi o Daviplata de forma manual.',
      icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    },
  ];

  readonly methods = signal<PaymentMethodDisplay[]>([]);

  // Status computed
  readonly isBoldConfigured = computed(() => {
    return (
      !!this.boldApiKey().trim() &&
      (!!this.boldSecretKey().trim() || this.hasExistingBoldSecret())
    );
  });

  readonly isWompiConfigured = computed(() => {
    return (
      !!this.wompiPublicKey().trim() &&
      (!!this.wompiWebhookSecret().trim() || this.hasExistingWompiSecret())
    );
  });

  readonly activeOnlineConfigStatus = computed(() => {
    const provider = this.selectedProvider();
    if (provider === 'bold') {
      return this.isBoldConfigured()
        ? { configured: true, text: 'Bold configurado' }
        : { configured: false, text: 'Requiere configurar Bold' };
    } else {
      return this.isWompiConfigured()
        ? { configured: true, text: 'Wompi configurado' }
        : { configured: false, text: 'Requiere configurar Wompi' };
    }
  });

  constructor() {
    effect(() => {
      const tenant = this.tenant();
      if (tenant) {
        const saved = (tenant.settings?.['payment_methods'] as TenantPaymentSettings) || {};

        // Backward compatibility: check online_payment first, fallback to credit_card
        const onlineSaved = saved[PaymentMethod.OnlinePayment] || saved[PaymentMethod.CreditCard];

        const merged: PaymentMethodDisplay[] = this.methodDefinitions.map((def) => {
          let isEnabled = true;
          if (def.id === PaymentMethod.OnlinePayment) {
            isEnabled = onlineSaved?.enabled ?? true;
          } else {
            isEnabled = saved[def.id]?.enabled ?? DEFAULT_PAYMENT_METHODS[def.id]?.enabled ?? true;
          }
          return {
            ...def,
            enabled: isEnabled,
          };
        });

        this.methods.set(merged);

        // Load existing gateway configs only if modal is not currently open
        if (!this.isConfigModalOpen()) {
          const onlineConfig = (onlineSaved?.config as OnlinePaymentConfig) || {};
          if (onlineConfig.provider) {
            this.selectedProvider.set(onlineConfig.provider);
          }

          if (onlineConfig.bold) {
            this.boldApiKey.set(onlineConfig.bold.api_key || '');
            this.boldMerchantId.set(onlineConfig.bold.merchant_id || '');
            if (onlineConfig.bold.has_secret_key || onlineConfig.bold.secret_key) {
              this.hasExistingBoldSecret.set(true);
            }
          }

          if (onlineConfig.wompi) {
            this.wompiPublicKey.set(onlineConfig.wompi.public_key || '');
            if (onlineConfig.wompi.has_webhook_secret || onlineConfig.wompi.webhook_secret) {
              this.hasExistingWompiSecret.set(true);
            }
            if (onlineConfig.wompi.has_integrity_secret || onlineConfig.wompi.integrity_secret) {
              this.hasExistingWompiIntegrity.set(true);
            }
          }

          if (tenant.id) {
            void this.loadSecretsInfo(tenant.id);
          }
        }

        this.isDirty.set(false);
        this.dirtyChange.emit(false);
      }
    });
  }

  private async loadSecretsInfo(tenantId: string): Promise<void> {
    try {
      const { data } = await (this.supabase.client as any)
        .from('tenant_payment_secrets')
        .select('bold_secret_key, wompi_webhook_secret, wompi_integrity_secret')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (data) {
        if (data.bold_secret_key) this.hasExistingBoldSecret.set(true);
        if (data.wompi_webhook_secret) this.hasExistingWompiSecret.set(true);
        if (data.wompi_integrity_secret) this.hasExistingWompiIntegrity.set(true);
      }
    } catch {
      // Non-critical: ignore if table not accessible
    }
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

  openConfigModal(): void {
    this.isConfigModalOpen.set(true);
  }

  closeConfigModal(): void {
    this.isConfigModalOpen.set(false);
  }

  selectProvider(provider: 'bold' | 'wompi'): void {
    this.selectedProvider.set(provider);
  }

  onFieldChange(): void {
    // Local modal editing state
  }

  async saveModalConfig(): Promise<boolean> {
    const provider = this.selectedProvider();
    if (provider === 'bold') {
      if (!this.boldApiKey().trim()) {
        this.toastService.warning('Ingresa tu Llave de integración de Bold');
        return false;
      }
      if (!this.boldSecretKey().trim()) {
        this.toastService.warning('Ingresa tu Llave secreta de Bold');
        return false;
      }
    } else if (provider === 'wompi') {
      if (!this.wompiPublicKey().trim()) {
        this.toastService.warning('Ingresa tu Llave pública de Wompi');
        return false;
      }
      if (!this.wompiWebhookSecret().trim()) {
        this.toastService.warning('Ingresa tu Event Secret de Wompi');
        return false;
      }
    }

    const ok = await this.save(false);
    if (ok) {
      this.isConfigModalOpen.set(false);
    }
    return ok;
  }

  async copyText(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.toastService.success(`${label} copiada al portapapeles`);
    } catch {
      this.toastService.error('No se pudo copiar automáticamente');
    }
  }

  async save(silent = false): Promise<boolean> {
    const tenant = this.tenant();
    if (!tenant) return false;

    this.isSaving.set(true);
    try {
      const existingSettings = (tenant.settings?.['payment_methods'] as TenantPaymentSettings) || {};

      const hasBoldSec = !!(this.boldSecretKey().trim() || this.hasExistingBoldSecret());
      const hasWompiSec = !!(this.wompiWebhookSecret().trim() || this.hasExistingWompiSecret());
      const hasWompiInteg = !!(this.wompiIntegritySecret().trim() || this.hasExistingWompiIntegrity());

      // Save public configuration into tenant.settings (NEVER expose private secrets in public settings)
      const onlineConfig: OnlinePaymentConfig = {
        provider: this.selectedProvider(),
        bold: {
          api_key: this.boldApiKey().trim(),
          merchant_id: this.boldMerchantId().trim() || undefined,
          has_secret_key: hasBoldSec,
        },
        wompi: {
          public_key: this.wompiPublicKey().trim(),
          has_webhook_secret: hasWompiSec,
          has_integrity_secret: hasWompiInteg,
        },
      };

      const paymentSettings: TenantPaymentSettings = {};

      for (const m of this.methods()) {
        if (m.id === PaymentMethod.OnlinePayment) {
          paymentSettings[PaymentMethod.OnlinePayment] = {
            enabled: m.enabled,
            config: onlineConfig,
          };
          // Also save under credit_card for backward compatibility with older readers
          paymentSettings[PaymentMethod.CreditCard] = {
            enabled: m.enabled,
            config: onlineConfig,
          };
        } else {
          paymentSettings[m.id] = {
            enabled: m.enabled,
            config: existingSettings[m.id]?.config || {},
          };
        }
      }

      // 1. Update public settings
      await this.tenantService.updateTenant(tenant.id, {
        settings: {
          ...tenant.settings,
          payment_methods: paymentSettings,
        },
      });

      // 2. Securely save secret keys to tenant_payment_secrets if entered
      const secretsToUpsert: Record<string, any> = {
        tenant_id: tenant.id,
        updated_at: new Date().toISOString(),
      };
      let hasNewSecret = false;

      if (this.boldSecretKey().trim()) {
        secretsToUpsert['bold_secret_key'] = this.boldSecretKey().trim();
        hasNewSecret = true;
      }
      if (this.wompiWebhookSecret().trim()) {
        secretsToUpsert['wompi_webhook_secret'] = this.wompiWebhookSecret().trim();
        hasNewSecret = true;
      }
      if (this.wompiIntegritySecret().trim()) {
        secretsToUpsert['wompi_integrity_secret'] = this.wompiIntegritySecret().trim();
        hasNewSecret = true;
      }

      if (hasNewSecret) {
        const { error: secErr } = await (this.supabase.client as any)
          .from('tenant_payment_secrets')
          .upsert(secretsToUpsert, { onConflict: 'tenant_id' });

        if (secErr) {
          console.error('Error saving payment secrets to secure vault:', secErr);
          throw new Error('Error al guardar credenciales en la bóveda de seguridad');
        }

        if (this.boldSecretKey().trim()) this.hasExistingBoldSecret.set(true);
        if (this.wompiWebhookSecret().trim()) this.hasExistingWompiSecret.set(true);
        if (this.wompiIntegritySecret().trim()) this.hasExistingWompiIntegrity.set(true);

        this.boldSecretKey.set('');
        this.wompiWebhookSecret.set('');
        this.wompiIntegritySecret.set('');
      }

      if (!silent) {
        this.toastService.success('Métodos de pago y pasarelas actualizados de forma segura');
        this.isConfigModalOpen.set(false);
      }
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
      const onlineSaved = saved[PaymentMethod.OnlinePayment] || saved[PaymentMethod.CreditCard];

      this.methods.set(
        this.methodDefinitions.map((def) => {
          let isEnabled = true;
          if (def.id === PaymentMethod.OnlinePayment) {
            isEnabled = onlineSaved?.enabled ?? true;
          } else {
            isEnabled = saved[def.id]?.enabled ?? DEFAULT_PAYMENT_METHODS[def.id]?.enabled ?? true;
          }
          return {
            ...def,
            enabled: isEnabled,
          };
        }),
      );

      const onlineConfig = (onlineSaved?.config as OnlinePaymentConfig) || {};
      this.selectedProvider.set(onlineConfig.provider || 'bold');
      this.boldApiKey.set(onlineConfig.bold?.api_key || '');
      this.boldSecretKey.set('');
      this.boldMerchantId.set(onlineConfig.bold?.merchant_id || '');

      this.wompiPublicKey.set(onlineConfig.wompi?.public_key || '');
      this.wompiWebhookSecret.set('');
      this.wompiIntegritySecret.set('');
    }
    this.isDirty.set(false);
    this.dirtyChange.emit(false);
    this.isConfigModalOpen.set(false);
    this.toastService.info('Cambios descartados');
  }

  get enabledCount(): number {
    return this.methods().filter((m) => m.enabled).length;
  }
}
