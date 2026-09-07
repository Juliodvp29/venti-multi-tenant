import { inject, Injectable } from '@angular/core';
import {
  AiGeneratedStore,
  AiStoreWizardInput,
  SuggestedCategory,
  ThemePresetId,
  ThemeTokens,
  StorefrontLayout,
  ThemeDesignSnapshot,
  StorefrontSection,
} from '@core/models';
import { THEME_PRESETS, TYPOGRAPHY_PAIRINGS } from '@core/constants/theme-presets';
import { getIndustryHeroBanner } from '@core/constants/industry-products';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { CategoriesService } from './categories';
import { ToastService } from './toast';
import { AiAssistantService } from './ai-assistant';

@Injectable({
  providedIn: 'root',
})
export class AiStoreWizardService {
  private readonly supabase = inject(Supabase);
  private readonly tenantService = inject(TenantService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly toast = inject(ToastService);
  private readonly aiAssistant = inject(AiAssistantService);

  /**
   * Genera la configuración completa de la tienda mediante la infraestructura probada de AiAssistantService.
   * Si la IA excede tiempo o falla, utiliza un generador de respaldo
   * determinista y de alta calidad para no interrumpir el flujo del comerciante.
   */
  async generateStoreSetup(input: AiStoreWizardInput): Promise<AiGeneratedStore> {
    try {
      const prompt = `Genera la configuración y diseño inicial para la tienda online "${input.businessName}".
Nicho / Categoría: ${input.industry} ${input.customIndustryDetail ? `(${input.customIndustryDetail})` : ''}
Público objetivo: ${input.targetAudience}
Propuesta de valor: ${input.valueProposition}
Estilo visual seleccionado: ${input.stylePreference}
Tono de comunicación: ${input.tone}

Reglas clave para e-commerce:
1. En menos de 5 segundos el comprador debe entender qué se vende, para quién es y por qué es valioso.
2. Los textos deben ser persuasivos, directos y adaptados al tono seleccionado (${input.tone}).
3. Las categorías deben ser lógicas para el nicho comercial.
4. El botón de llamada a la acción (CTA) debe ser claro y motivar la compra.

Devuelve OBLIGATORIAMENTE un único objeto JSON válido sin texto adicional ni preámbulos, sé conciso:
{
  "business_description": "Descripción corta de 1 o 2 oraciones para el negocio y SEO.",
  "tagline": "Un eslogan memorable y potente.",
  "suggested_theme_id": "${input.stylePreference}",
  "typography_pairing_id": "modern",
  "branding_colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "header": "#hex",
    "footer": "#hex"
  },
  "suggested_categories": [
    { "name": "Nombre categoría", "icon": "emoji", "description": "Breve descripción" }
  ],
  "hero_content": {
    "title": "Titular de impacto comercial",
    "subtitle": "Subtítulo detallando propuesta de valor",
    "buttonText": "Explorar Colección",
    "alignment": "center"
  },
  "benefits": [
    { "title": "Beneficio 1", "description": "Detalle del beneficio", "icon": "truck" },
    { "title": "Beneficio 2", "description": "Detalle del beneficio", "icon": "shield" },
    { "title": "Beneficio 3", "description": "Detalle del beneficio", "icon": "star" }
  ],
  "about_us_content": {
    "badge": "Nuestra Historia",
    "title": "Título sobre la marca",
    "story": "Párrafo conciso y persuasivo sobre la pasión detrás de la tienda (máx 40 palabras)."
  }
}`;

      // Llamada usando el mismo pipeline validado de AiAssistantService
      const invokePromise = this.aiAssistant.generateCompletion(prompt);

      // Timeout de 25 segundos para no dejar al usuario esperando
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout en la generación de IA')), 25000),
      );

      const rawText = await Promise.race([invokePromise, timeoutPromise]);
      if (!rawText) throw new Error('Respuesta vacía de IA');

      const parsed = this.extractJson(rawText);
      return this.formatGeminiResponse(input, parsed);
    } catch (error) {
      console.warn('ai-chat no respondió o hubo un error; usando fallback inteligente:', error);
      return this.buildFallbackSetup(input);
    }
  }

  /**
   * Extrae y parsea JSON de forma segura aun si el modelo incluye delimitadores markdown o texto circundante
   */
  private extractJson(text: string): any {
    const direct = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(direct);
    } catch {
      // Buscar el bloque {...} más amplio
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error('No se pudo encontrar un JSON válido en la respuesta de IA');
    }
  }

  /**
   * Transforma la respuesta de Gemini en el modelo de StorefrontLayout y ThemeTokens de Venti
   */
  private formatGeminiResponse(input: AiStoreWizardInput, parsed: any): AiGeneratedStore {
    const presetId: ThemePresetId =
      parsed.suggested_theme_id || input.stylePreference || 'minimalist';
    const preset = THEME_PRESETS[presetId] ?? THEME_PRESETS.minimalist;

    const colors = {
      primary: parsed.branding_colors?.primary || preset.tokens.colors.primary,
      secondary: parsed.branding_colors?.secondary || preset.tokens.colors.secondary,
      accent: parsed.branding_colors?.accent || preset.tokens.colors.accent,
      background: parsed.branding_colors?.background || preset.tokens.colors.background,
      header: parsed.branding_colors?.header || preset.tokens.colors.header,
      footer: parsed.branding_colors?.footer || preset.tokens.colors.footer,
    };

    const categories: SuggestedCategory[] =
      Array.isArray(parsed.suggested_categories) && parsed.suggested_categories.length > 0
        ? parsed.suggested_categories.slice(0, 5)
        : this.getDefaultCategoriesForIndustry(input.industry);

    const sections: StorefrontSection[] = [
      {
        id: 'hero-main',
        type: 'hero',
        isActive: true,
        content: {
          title: parsed.hero_content?.title || `Descubre lo mejor en ${input.industry}`,
          subtitle:
            parsed.hero_content?.subtitle ||
            `Productos seleccionados para ${input.targetAudience.toLowerCase()} con la mejor calidad.`,
          buttonText: parsed.hero_content?.buttonText || 'Explorar Tienda',
          buttonLink: '/store/productos',
          backgroundImageUrl:
            parsed.hero_content?.backgroundImageUrl || getIndustryHeroBanner(input.industry),
          alignment: parsed.hero_content?.alignment === 'left' ? 'left' : 'center',
          compositionStyle: presetId === 'minimalist' ? 'minimal-centered' : 'full-banner',
          height: 'medium',
        },
      },
      {
        id: 'benefits-main',
        type: 'benefits',
        isActive: true,
        content: {
          title: '¿Por qué elegirnos?',
          subtitle: 'Tu tranquilidad y satisfacción son nuestra prioridad',
          columns: 3,
          items:
            Array.isArray(parsed.benefits) && parsed.benefits.length >= 3
              ? parsed.benefits.slice(0, 3).map((b: any, index: number) => ({
                  id: `b-${index + 1}`,
                  title: b.title,
                  description: b.description,
                  icon: b.icon || 'shield',
                }))
              : this.getDefaultBenefits(input.valueProposition),
        },
      },
      {
        id: 'categories-main',
        type: 'featured_categories',
        isActive: true,
        content: {
          title: 'Explora por Categoría',
          description: 'Encuentra fácilmente lo que estás buscando',
          categories: categories.map((cat, idx) => ({
            id: `cat-${idx + 1}`,
            name: cat.name,
            icon: cat.icon,
            link: '/store/productos',
          })),
        },
      },
      {
        id: 'products-main',
        type: 'product_grid',
        isActive: true,
        content: {
          title: 'Colección Destacada',
          description: 'Los favoritos de nuestros clientes',
          limit: 8,
          columns: 4,
          showViewAll: true,
          viewAllLink: '/store/productos',
        },
      },
      {
        id: 'about-main',
        type: 'about_us',
        isActive: true,
        content: {
          badge: parsed.about_us_content?.badge || 'Nuestra Pasión',
          title: parsed.about_us_content?.title || `Sobre ${input.businessName}`,
          story:
            parsed.about_us_content?.story ||
            `En ${input.businessName} nos apasiona ofrecer una experiencia única para ${input.targetAudience.toLowerCase()}, combinando dedicación, diseño y atención en cada detalle.`,
          highlightText: input.valueProposition,
          layout: 'split',
        },
      },
      {
        id: 'newsletter-main',
        type: 'newsletter',
        isActive: true,
        content: {
          title: 'Únete a nuestra comunidad',
          description:
            'Recibe lanzamientos exclusivos, ofertas especiales y novedades en tu correo.',
          buttonText: 'Suscribirme',
          disclaimer: 'Sin spam. Puedes darte de baja en cualquier momento.',
        },
      },
    ];

    return {
      business_description:
        parsed.business_description ||
        `Tienda online de ${input.businessName} especializada en ${input.industry}.`,
      tagline: parsed.tagline || `Tu tienda favorita de ${input.industry}`,
      suggested_theme_id: presetId,
      typography_pairing_id: parsed.typography_pairing_id || 'modern',
      branding_colors: colors,
      storefront_sections: sections,
      suggested_categories: categories,
    };
  }

  /**
   * Generador de respaldo de alta fidelidad si Gemini no está accesible
   */
  public buildFallbackSetup(input: AiStoreWizardInput): AiGeneratedStore {
    const presetId: ThemePresetId = input.stylePreference || 'minimalist';
    const preset = THEME_PRESETS[presetId] ?? THEME_PRESETS.minimalist;
    const categories = this.getDefaultCategoriesForIndustry(input.industry);

    const colors = {
      primary: preset.tokens.colors.primary,
      secondary: preset.tokens.colors.secondary,
      accent: preset.tokens.colors.accent,
      background: preset.tokens.colors.background,
      header: preset.tokens.colors.header,
      footer: preset.tokens.colors.footer,
    };

    const sections: StorefrontSection[] = [
      {
        id: 'hero-main',
        type: 'hero',
        isActive: true,
        content: {
          title: `Lo mejor en ${input.industry} para ti`,
          subtitle: `En ${input.businessName} creamos soluciones para ${input.targetAudience.toLowerCase()} con ${input.valueProposition.toLowerCase()}.`,
          buttonText: 'Ver Productos',
          buttonLink: '/store/productos',
          backgroundImageUrl: getIndustryHeroBanner(input.industry),
          alignment: 'center',
          compositionStyle: 'minimal-centered',
          height: 'medium',
        },
      },
      {
        id: 'benefits-main',
        type: 'benefits',
        isActive: true,
        content: {
          title: '¿Por qué elegirnos?',
          subtitle: 'Comprometidos con tu mejor experiencia de compra',
          columns: 3,
          items: this.getDefaultBenefits(input.valueProposition),
        },
      },
      {
        id: 'categories-main',
        type: 'featured_categories',
        isActive: true,
        content: {
          title: 'Categorías Populares',
          description: 'Descubre nuestra variedad seleccionada',
          categories: categories.map((cat, idx) => ({
            id: `cat-${idx + 1}`,
            name: cat.name,
            icon: cat.icon,
            link: '/store/productos',
          })),
        },
      },
      {
        id: 'products-main',
        type: 'product_grid',
        isActive: true,
        content: {
          title: 'Productos Destacados',
          description: 'Novedades y artículos más vendidos',
          limit: 8,
          columns: 4,
          showViewAll: true,
          viewAllLink: '/store/productos',
        },
      },
      {
        id: 'about-main',
        type: 'about_us',
        isActive: true,
        content: {
          badge: 'Nuestra Esencia',
          title: `Conoce ${input.businessName}`,
          story: `Nacimos con el propósito de conectar a ${input.targetAudience.toLowerCase()} con productos de la más alta calidad, destacándonos por ${input.valueProposition.toLowerCase()}.`,
          highlightText: input.valueProposition,
          layout: 'split',
        },
      },
      {
        id: 'newsletter-main',
        type: 'newsletter',
        isActive: true,
        content: {
          title: 'Suscríbete y obtén beneficios',
          description: 'Recibe promociones exclusivas y lanzamientos directamente en tu email.',
          buttonText: 'Suscribirme',
          disclaimer: 'Respetamos tu privacidad. Desuscríbete cuando quieras.',
        },
      },
    ];

    return {
      business_description: `${input.businessName} es tu tienda de referencia en ${input.industry}, pensada para ${input.targetAudience.toLowerCase()} con ${input.valueProposition.toLowerCase()}.`,
      tagline: `Calidad y confianza en cada producto`,
      suggested_theme_id: presetId,
      typography_pairing_id: 'modern',
      branding_colors: colors,
      storefront_sections: sections,
      suggested_categories: categories,
    };
  }

  private getDefaultCategoriesForIndustry(industry: string): SuggestedCategory[] {
    const lower = (industry || '').toLowerCase();
    if (lower.includes('moda') || lower.includes('ropa') || lower.includes('calzado')) {
      return [
        { name: 'Novedades', icon: '✨', description: 'Lo más reciente de la temporada' },
        { name: 'Calzado & Zapatos', icon: '👟', description: 'Diseños cómodos y modernos' },
        { name: 'Prendas Superiores', icon: '👕', description: 'Camisas, poleras y tops' },
        { name: 'Accesorios & Bolsos', icon: '🎒', description: 'Complementos únicos' },
      ];
    }
    if (
      lower.includes('comida') ||
      lower.includes('restaurante') ||
      lower.includes('café') ||
      lower.includes('gastro')
    ) {
      return [
        { name: 'Especialidades', icon: '⭐', description: 'Nuestros platos insignia' },
        { name: 'Bebidas & Cafés', icon: '☕', description: 'Bebidas frías y calientes' },
        { name: 'Platos Fuertes', icon: '🍽️', description: 'Sabor irresistible' },
        { name: 'Postres & Dulces', icon: '🍰', description: 'El toque final perfecto' },
      ];
    }
    if (
      lower.includes('tech') ||
      lower.includes('tecnología') ||
      lower.includes('gadget') ||
      lower.includes('electrónica')
    ) {
      return [
        {
          name: 'Smartphones & Accesorios',
          icon: '📱',
          description: 'Cables, fundas y protectores',
        },
        { name: 'Audio & Sonido', icon: '🎧', description: 'Auriculares y parlantes inalámbricos' },
        { name: 'Smart Home & Gadgets', icon: '⚡', description: 'Tecnología para tu día a día' },
        { name: 'Cómputo & Oficina', icon: '💻', description: 'Periféricos y productividad' },
      ];
    }
    if (lower.includes('belleza') || lower.includes('cosmética') || lower.includes('cuidado')) {
      return [
        { name: 'Cuidado Facial', icon: '✨', description: 'Serums, cremas y limpiadores' },
        { name: 'Cuidado Corporal', icon: '🧴', description: 'Hidratación y bienestar' },
        { name: 'Maquillaje', icon: '💄', description: 'Tonos y texturas para resaltar' },
        { name: 'Fragancias', icon: '🌸', description: 'Aromas memorables' },
      ];
    }
    return [
      { name: 'Destacados', icon: '⭐', description: 'Nuestros productos más populares' },
      { name: 'Novedades', icon: '✨', description: 'Últimas incorporaciones al catálogo' },
      {
        name: 'Ofertas Especiales',
        icon: '🏷️',
        description: 'Precios con descuento por tiempo limitado',
      },
      { name: 'Colección General', icon: '📦', description: 'Explora toda nuestra variedad' },
    ];
  }

  private getDefaultBenefits(valueProp: string) {
    return [
      {
        id: 'b-1',
        title: 'Envíos Rápidos y Seguros',
        description: 'Despachamos tu pedido con seguimiento en tiempo real.',
        icon: 'truck',
      },
      {
        id: 'b-2',
        title: valueProp || 'Garantía de Calidad',
        description: 'Productos seleccionados bajo estrictos estándares.',
        icon: 'shield',
      },
      {
        id: 'b-3',
        title: 'Atención Personalizada',
        description: 'Estamos disponibles para resolver todas tus consultas.',
        icon: 'heart',
      },
    ];
  }

  /**
   * Aplica la tienda generada: guarda el diseño en draft, publica la tienda en vivo,
   * actualiza branding y crea las categorías sugeridas.
   */
  async applyGeneratedStore(
    tenantId: string,
    setup: AiGeneratedStore,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const preset = THEME_PRESETS[setup.suggested_theme_id] ?? THEME_PRESETS.minimalist;
      const pairing =
        TYPOGRAPHY_PAIRINGS.find((p) => p.id === setup.typography_pairing_id) ??
        TYPOGRAPHY_PAIRINGS[1]; // moderna

      const updatedTokens: ThemeTokens = {
        ...preset.tokens,
        theme_id: setup.suggested_theme_id,
        theme_name: preset.name,
        font_heading: pairing.font_heading,
        font_body: pairing.font_body,
        font_button: pairing.font_button,
        colors: {
          ...preset.tokens.colors,
          ...setup.branding_colors,
        },
      };

      const storefrontLayout: StorefrontLayout = {
        sections: setup.storefront_sections,
      };

      const snapshot: ThemeDesignSnapshot = {
        theme_tokens: updatedTokens,
        storefront_layout: storefrontLayout,
      };

      const currentTenant = this.tenantService.currentTenant();
      const currentSettings = (currentTenant?.settings || {}) as Record<string, unknown>;
      const updatedSettings = {
        ...currentSettings,
        ai_wizard_completed: true,
        seo_description: setup.business_description,
        seo_title: `${setup.tagline} | ${currentTenant?.business_name || 'Tienda'}`,
        tagline: setup.tagline,
        business_description: setup.business_description,
      };

      // 1. Actualizar branding y settings del tenant (columnas existentes en PostgreSQL)
      await this.tenantService.updateTenant(tenantId, {
        primary_color: setup.branding_colors.primary,
        secondary_color: setup.branding_colors.secondary,
        accent_color: setup.branding_colors.accent,
        background_color: setup.branding_colors.background,
        header_color: setup.branding_colors.header,
        footer_color: setup.branding_colors.footer,
        font_family: pairing.font_heading,
        settings: updatedSettings as any,
      });

      // 2. Guardar borrador y publicar el diseño
      await this.tenantService.saveDraft(snapshot);
      const publishRes = await this.tenantService.publishDesign('Diseño inicial creado con IA');
      if (!publishRes.success) {
        throw new Error(publishRes.error || 'Error al publicar el diseño');
      }

      // 3. Crear las categorías sugeridas en segundo plano
      if (Array.isArray(setup.suggested_categories) && setup.suggested_categories.length > 0) {
        for (let i = 0; i < setup.suggested_categories.length; i++) {
          const cat = setup.suggested_categories[i];
          const slug = this.slugify(cat.name);
          try {
            await this.categoriesService.createCategory({
              name: cat.name,
              slug,
              description: cat.description || `Categoría de ${cat.name}`,
              sort_order: i + 1,
              is_active: true,
            });
          } catch (catErr) {
            // Si ya existe o falla una categoría individual, no abortar
            console.warn(`No se pudo crear la categoría ${cat.name}:`, catErr);
          }
        }
      }

      // 4. Marcar en localStorage que se completó el asistente de IA
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`venti_ai_wizard_completed_${tenantId}`, 'true');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error aplicando configuración generada por IA:', error);
      return {
        success: false,
        error: error?.message || 'Error al aplicar configuración de la tienda',
      };
    }
  }

  isWizardCompleted(tenantId: string): boolean {
    if (!tenantId) return false;
    const currentTenant = this.tenantService.currentTenant();
    if (currentTenant?.settings?.['ai_wizard_completed']) return true;
    const storeDesignState = currentTenant?.settings?.['store_design_state'] as
      Record<string, unknown> | undefined;
    if (storeDesignState?.['published']) return true;
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(`venti_ai_wizard_completed_${tenantId}`) === 'true';
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
