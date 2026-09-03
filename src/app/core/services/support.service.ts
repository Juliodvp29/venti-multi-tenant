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
      const [productsRes, shippingRes, taxRes] = await Promise.all([
        (this.supabase.client.from as any)('products')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'active'),
        (this.supabase.client.from as any)('shipping_zones')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
        (this.supabase.client.from as any)('tax_rates')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
      ]);

      const hasGeneralInfo = Boolean(tenant.business_name && tenant.contact_email);
      const hasBranding = Boolean(tenant.logo_url);
      const hasActiveProducts = (productsRes.count ?? 0) > 0;
      const hasShippingZones = (shippingRes.count ?? 0) > 0;
      const hasTaxRates = (taxRes.count ?? 0) > 0;
      const settings = (tenant.settings || {}) as Record<string, any>;
      const hasCustomizedTheme = Boolean(
        settings['theme'] || settings['branding']?.colors?.primary,
      );

      const steps: StoreHealthStep[] = [
        {
          id: 'step-general',
          title: 'Información y Contacto del Negocio',
          description: 'Nombre comercial, correo oficial y moneda de tu tienda.',
          completed: hasGeneralInfo,
          actionLabel: hasGeneralInfo ? 'Editar Información' : 'Completar Datos',
          actionRoute: '/settings',
          queryParams: { tab: 'general' },
          category: 'essential',
        },
        {
          id: 'step-branding',
          title: 'Logo y Personalización de Marca',
          description: 'Sube tu logo y favicon para transmitir confianza a tus clientes.',
          completed: hasBranding,
          actionLabel: hasBranding ? 'Cambiar Logo' : 'Subir Logo',
          actionRoute: '/settings',
          queryParams: { tab: 'branding' },
          category: 'design',
        },
        {
          id: 'step-catalog',
          title: 'Catálogo de Productos',
          description: 'Publica al menos 1 producto activo con precio, fotos e inventario.',
          completed: hasActiveProducts,
          actionLabel: hasActiveProducts ? 'Ver Catálogo' : 'Crear Producto',
          actionRoute: '/products',
          category: 'essential',
        },
        {
          id: 'step-shipping',
          title: 'Zonas y Tarifas de Envío',
          description: 'Configura a qué países o ciudades realizas entregas y sus costos.',
          completed: hasShippingZones,
          actionLabel: hasShippingZones ? 'Revisar Zonas' : 'Configurar Envíos',
          actionRoute: '/settings',
          queryParams: { tab: 'shipping-taxes' },
          category: 'operations',
        },
        {
          id: 'step-theme',
          title: 'Estilo Visual y Secciones',
          description: 'Personaliza los colores, tipografías y el banner principal de tu tienda.',
          completed: hasCustomizedTheme,
          actionLabel: hasCustomizedTheme ? 'Editar Diseño' : 'Personalizar Tema',
          actionRoute: '/settings',
          queryParams: { tab: 'theme' },
          category: 'design',
        },
        {
          id: 'step-taxes',
          title: 'Configuración de Impuestos',
          description: 'Define las tasas de IVA o impuestos locales si aplica a tus ventas.',
          completed: hasTaxRates,
          actionLabel: hasTaxRates ? 'Ver Impuestos' : 'Agregar Tasas',
          actionRoute: '/settings',
          queryParams: { tab: 'shipping-taxes' },
          category: 'operations',
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
