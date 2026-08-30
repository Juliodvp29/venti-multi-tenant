import { computed, inject, Injectable, signal } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { AuthService } from './auth';
import { ToastService } from './toast';
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

  readonly troubleshootingGuides = signal<TroubleshootingGuide[]>([
    {
      id: 'trouble-shipping',
      title: '¿Por qué los clientes no pueden calcular el envío en el Checkout?',
      category: 'shipping_taxes',
      summary:
        'Si un cliente ingresa su dirección y no ve opciones de envío disponibles, suele deberse a que su país o región no está cubierto por una Zona de Envío.',
      commonCauses: [
        'No se ha creado una Zona de Envío para el país de destino del cliente.',
        'La zona existe pero no tiene ninguna tarifa activa (Tarifa Fija, por Peso o por Precio).',
        'El peso o valor total del pedido no entra en los rangos mínimos/máximos de la tarifa.',
      ],
      solutionSteps: [
        'Ve a Configuración > Envíos e Impuestos.',
        'Revisa si el país del comprador está incluido en alguna de tus Zonas de Envío.',
        'Asegúrate de agregar al menos una tarifa (ej. "Envío Estándar") y guardar los cambios.',
      ],
      actionLabel: 'Configurar Envíos',
      actionRoute: '/settings',
      queryParams: { tab: 'shipping-taxes' },
    },
    {
      id: 'trouble-draft-publish',
      title: '¿Por qué no se ven los cambios de diseño en mi tienda pública?',
      category: 'theme_storefront',
      summary:
        'Venti Shop utiliza un sistema de Borrador y Publicación para que puedas experimentar sin alterar tu tienda en vivo.',
      commonCauses: [
        'Guardaste cambios en el modo Borrador pero aún no has hecho clic en el botón "Publicar Cambios".',
        'El navegador del cliente tiene la versión anterior en caché.',
      ],
      solutionSteps: [
        'Entra a Configuración > Temas o Secciones.',
        'Verifica en la barra superior si dice "Borrador con cambios pendientes".',
        'Haz clic en el botón verde "Publicar" en la esquina superior derecha.',
      ],
      actionLabel: 'Ir al Editor de Tienda',
      actionRoute: '/settings',
      queryParams: { tab: 'storefront' },
    },
    {
      id: 'trouble-domain-dns',
      title: '¿Cómo configurar y verificar mi Dominio Personalizado?',
      category: 'domain_dns',
      summary:
        'Puedes conectar tu propio dominio (ej. mitienda.com) para que los clientes no tengan que usar el subdominio por defecto.',
      commonCauses: [
        'El registro DNS CNAME no apunta correctamente al servidor de Venti.',
        'La propagación DNS aún está en curso (puede tomar de 15 minutos a 24 horas).',
      ],
      solutionSteps: [
        'Ve a tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.).',
        'Crea un registro CNAME apuntando a "cname.ventishop.com".',
        'En Venti Shop ve a Configuración > General > Dominio y haz clic en "Verificar Dominio".',
      ],
      actionLabel: 'Verificar Dominio',
      actionRoute: '/settings',
      queryParams: { tab: 'general' },
    },
    {
      id: 'trouble-stock-sold-out',
      title: '¿Por qué mi producto aparece como "Agotado" si acabo de crearlo?',
      category: 'catalog_products',
      summary:
        'Los productos con inventario cero o sin variantes configuradas se marcan automáticamente como fuera de stock en el storefront.',
      commonCauses: [
        'El campo "Cantidad en Stock" se dejó en 0.',
        'El producto tiene variantes (tallas/colores) y ninguna de las variantes tiene inventario disponible.',
      ],
      solutionSteps: [
        'Ve a Catálogo de Productos y edita el producto afectado.',
        'Verifica la sección de Inventario o la tabla de Variantes.',
        'Ajusta las cantidades disponibles y guarda los cambios.',
      ],
      actionLabel: 'Revisar Productos',
      actionRoute: '/products',
    },
    {
      id: 'trouble-tax-rates',
      title: '¿Cómo aplicar impuestos (IVA) automáticamente en las compras?',
      category: 'shipping_taxes',
      summary:
        'Si necesitas cobrar impuestos según el país o estado del cliente, debes activar las tasas correspondientes.',
      commonCauses: [
        'No hay tasas de impuestos registradas para la ubicación del comprador.',
        'La tasa está creada pero está marcada como inactiva.',
      ],
      solutionSteps: [
        'Entra a Configuración > Envíos e Impuestos > Tasas de Impuesto.',
        'Agrega tu porcentaje de impuesto (ej. 19% o 16%) indicando el país o región.',
        'Verifica que el estado esté activo.',
      ],
      actionLabel: 'Configurar Impuestos',
      actionRoute: '/settings',
      queryParams: { tab: 'shipping-taxes' },
    },
  ]);

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
      const hasCustomizedTheme = Boolean(settings['theme'] || settings['branding']?.colors?.primary);

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
    ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'status'>
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
        'Tu ticket de soporte ha sido recibido. Te responderemos a la brevedad.'
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
