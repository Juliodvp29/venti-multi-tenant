import { computed, inject, Injectable, signal } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { AuthService } from './auth';
import { ToastService } from './toast';
import { TROUBLESHOOTING_GUIDES } from '@core/constants/troubleshooting-guides';
import {
  StoreHealthStep,
  StoreHealthSummary,
  SupportTicket,
  TroubleshootingGuide,
} from '@core/models/support';

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private readonly supabase = inject(Supabase);
  private readonly tenantService = inject(TenantService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly isCheckingHealth = signal<boolean>(false);
  readonly healthSummary = signal<StoreHealthSummary | null>(null);

  readonly troubleshootingGuides = signal<TroubleshootingGuide[]>(TROUBLESHOOTING_GUIDES);

  async evaluateStoreHealth(): Promise<StoreHealthSummary> {
    const tenant = this.tenantService.currentTenant();
    const tenantId = this.tenantService.tenantId();

    if (!tenant || !tenantId) {
      return {
        completionPercentage: 0,
        completedCount: 0,
        totalCount: 6,
        steps: [],
      };
    }

    this.isCheckingHealth.set(true);

    try {
      // Consultas paralelas para verificar configuración real
      const [productsRes, shippingRes] = await Promise.all([
        (this.supabase.client.from as any)('products')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'active'),
        (this.supabase.client.from as any)('shipping_zones')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
      ]);

      const settings = (tenant.settings || {}) as Record<string, any>;
      const hasGeneralInfo = Boolean(
        tenant.business_name && tenant.contact_email && settings['currency'],
      );
      const hasBranding = Boolean(tenant.logo_url && tenant.favicon_url);
      const hasActiveProducts = (productsRes.count ?? 0) > 0;
      const hasShippingZones = (shippingRes.count ?? 0) > 0;
      const paymentMethods = settings['payment_methods'] as Record<string, { enabled?: boolean }> | undefined;
      const hasPaymentMethod = Object.values(paymentMethods ?? {}).some((method) => method?.enabled === true);
      const hasCustomizedTheme = Boolean(
        settings['theme_id'] || settings['theme_config'] || settings['theme'],
      );

      const steps: StoreHealthStep[] = [
        {
          id: 'step-catalog',
          title: 'Agrega tu primer producto',
          description: 'Publica al menos un producto activo con precio, fotos e inventario.',
          completed: hasActiveProducts,
          actionLabel: hasActiveProducts ? 'Ver Catálogo' : 'Crear Producto',
          actionRoute: '/products',
          category: 'essential',
        },
        {
          id: 'step-branding',
          title: 'Personaliza el logo y branding de tu tienda',
          description: 'Sube tu logo y favicon para transmitir confianza a tus clientes.',
          completed: hasBranding,
          actionLabel: hasBranding ? 'Cambiar Logo' : 'Subir Logo',
          actionRoute: '/settings',
          queryParams: { tab: 'branding' },
          category: 'design',
        },
        {
          id: 'step-shipping',
          title: 'Configura tus zonas y tarifas de envío',
          description: 'Configura a qué países o ciudades realizas entregas y sus costos.',
          completed: hasShippingZones,
          actionLabel: hasShippingZones ? 'Revisar Zonas' : 'Configurar Envíos',
          actionRoute: '/settings',
          queryParams: { tab: 'shipping-taxes' },
          category: 'operations',
        },
        {
          id: 'step-payments',
          title: 'Activa tus métodos de pago',
          description: 'Activa tarjetas, PSE, contra entrega o transferencia.',
          completed: hasPaymentMethod,
          actionLabel: hasPaymentMethod ? 'Revisar Pagos' : 'Activar Pagos',
          actionRoute: '/settings',
          queryParams: { tab: 'payments' },
          category: 'finance',
        },
        {
          id: 'step-theme',
          title: 'Personaliza el estilo y tema visual',
          description: 'Ajusta los colores y el diseño de tu storefront.',
          completed: hasCustomizedTheme,
          actionLabel: hasCustomizedTheme ? 'Editar Tema' : 'Personalizar Tema',
          actionRoute: '/settings',
          queryParams: { tab: 'theme' },
          category: 'design',
        },
        {
          id: 'step-general',
          title: 'Revisa los datos de contacto y negocio',
          description: 'Confirma el nombre legal, la moneda oficial y el correo.',
          completed: hasGeneralInfo,
          actionLabel: hasGeneralInfo ? 'Editar Datos' : 'Completar Datos',
          actionRoute: '/settings',
          queryParams: { tab: 'general' },
          category: 'general',
        },
      ];

      const completedCount = steps.filter((s) => s.completed).length;
      const totalCount = steps.length;
      const completionPercentage = Math.round((completedCount / totalCount) * 100);

      const summary: StoreHealthSummary = {
        completionPercentage,
        completedCount,
        totalCount,
        steps,
      };

      this.healthSummary.set(summary);
      return summary;
    } catch (error) {
      console.error('Error evaluating store setup health:', error);
      return {
        completionPercentage: 0,
        completedCount: 0,
        totalCount: 6,
        steps: [],
      };
    } finally {
      this.isCheckingHealth.set(false);
    }
  }

  async createSupportTicket(
    ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'status'>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (this.supabase.client.from as any)('support_tickets').insert({
        ...ticket,
        status: 'open',
      });

      if (error) {
        console.error('Error creating support ticket:', error);
        return { success: false, error: error.message };
      }

      this.toast.success(
        'Solicitud enviada',
        'Tu ticket de soporte ha sido recibido. Te responderemos a la brevedad.',
      );
      return { success: true };
    } catch (err: any) {
      console.error('Unexpected error creating ticket:', err);
      return { success: false, error: err?.message || 'Error inesperado al enviar el ticket' };
    }
  }

  async uploadAttachment(file: File): Promise<{ url: string | null; error: string | null }> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return { url: null, error: 'No tenant found' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await this.supabase.storage
        .from('support-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return { url: null, error: uploadError.message };
      }

      const { data } = this.supabase.storage.from('support-attachments').getPublicUrl(fileName);
      return { url: data.publicUrl, error: null };
    } catch (err: any) {
      return { url: null, error: err?.message || 'Error al subir archivo adjunto' };
    }
  }
}
