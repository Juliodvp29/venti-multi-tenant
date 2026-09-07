import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { AiStoreWizardService } from '@core/services/ai-store-wizard.service';
import { AiGeneratedStore, AiStoreWizardInput, ThemePresetId, ThemeTokens } from '@core/models';
import { THEME_PRESETS, TYPOGRAPHY_PAIRINGS } from '@core/constants/theme-presets';
import { StorePreview, PreviewData } from '@features/settings/components/store-preview';

@Component({
  selector: 'app-ai-store-wizard-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, StorePreview],
  templateUrl: './ai-store-wizard-modal.html',
  styleUrl: './ai-store-wizard-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiStoreWizardModal implements OnInit, OnDestroy {
  private readonly tenantService = inject(TenantService);
  private readonly wizardService = inject(AiStoreWizardService);
  private readonly toast = inject(ToastService);

  readonly close = output<void>();
  readonly applied = output<void>();

  // Pasos: 1 (Industria), 2 (Audiencia/Valor), 3 (Estilo/Tono), 4 (Generando), 5 (Previsualización)
  readonly step = signal<1 | 2 | 3 | 4 | 5>(1);
  readonly isApplying = signal<false | true>(false);
  readonly previewMode = signal<'desktop' | 'mobile'>('desktop');

  // Datos del formulario
  readonly businessName = signal<string>('');
  readonly industry = signal<string>('Moda & Ropa');
  readonly customDetail = signal<string>('');
  readonly targetAudience = signal<string>('Jóvenes y universitarios');
  readonly valueProposition = signal<string>('Calidad artesanal y diseño exclusivo');
  readonly stylePreference = signal<ThemePresetId>('minimalist');
  readonly tone = signal<string>('Cercano y amigable');

  // Resultado de la IA
  readonly generatedStore = signal<AiGeneratedStore | null>(null);

  // Mensaje animado de generación
  readonly loadingMessage = signal<string>('Analizando tu modelo de negocio...');
  private messageInterval: any = null;

  // Opciones predefinidas
  readonly industries = [
    { id: 'Moda & Ropa', label: 'Moda & Ropa', icon: '👗' },
    { id: 'Calzado & Sneakers', label: 'Calzado & Sneakers', icon: '👟' },
    { id: 'Cafetería & Comida', label: 'Cafetería & Comida', icon: '☕' },
    { id: 'Tecnología & Gadgets', label: 'Tecnología & Gadgets', icon: '📱' },
    { id: 'Belleza & Cosmética', label: 'Belleza & Cosmética', icon: '✨' },
    { id: 'Hogar & Decoración', label: 'Hogar & Decoración', icon: '🛋️' },
    { id: 'Deportes & Fitness', label: 'Deportes & Fitness', icon: '🏋️' },
    { id: 'Joyería & Accesorios', label: 'Joyería & Accesorios', icon: '💍' },
    { id: 'Salud & Bienestar', label: 'Salud & Bienestar', icon: '🌿' },
  ];

  readonly audiences = [
    { id: 'Jóvenes y universitarios', label: 'Jóvenes (18-28)', icon: '🧢' },
    { id: 'Profesionales y ejecutivos', label: 'Profesionales (25-45)', icon: '💼' },
    { id: 'Familias y niños', label: 'Familias y hogares', icon: '👨‍👩‍👧‍👦' },
    { id: 'Clientes que buscan exclusividad y lujo', label: 'Exclusivo y Gourmet', icon: '💎' },
    { id: 'Público masivo y general', label: 'Todo público', icon: '🌍' },
  ];

  readonly valueProps = [
    {
      id: 'Envíos express y entregas garantizadas en 24h',
      label: 'Envíos Express 24h',
      icon: '🚚',
    },
    { id: 'Calidad artesanal y diseño exclusivo', label: 'Calidad & Exclusividad', icon: '⭐' },
    { id: 'Materiales 100% ecológicos y sostenibles', label: 'Sostenible & Eco', icon: '🌿' },
    { id: 'Precios justos y accesibles con ofertas', label: 'Precios Justos', icon: '💰' },
    { id: 'Atención personalizada y asesoría 24/7', label: 'Atención Personalizada', icon: '💬' },
  ];

  readonly styles: { id: ThemePresetId; name: string; desc: string; colors: string[] }[] = [
    {
      id: 'minimalist',
      name: 'Minimalista',
      desc: 'Limpio, sobrio y enfocado en la fotografía de producto',
      colors: ['#000000', '#ffffff', '#737373'],
    },
    {
      id: 'luxury',
      name: 'Lujo & Elegante',
      desc: 'Sofisticado, premium y exclusivo con contrastes nobles',
      colors: ['#0f172a', '#c5a059', '#f8fafc'],
    },
    {
      id: 'tech',
      name: 'Tech & Moderno',
      desc: 'Vanguardista, dinámico y con estética digital contemporánea',
      colors: ['#0284c7', '#0f172a', '#38bdf8'],
    },
    {
      id: 'artisan',
      name: 'Artesanal & Cálido',
      desc: 'Orgánico, texturado y con tonos tierra acogedores',
      colors: ['#78350f', '#fef3c7', '#d97706'],
    },
    {
      id: 'colorful',
      name: 'Colorido & Alegre',
      desc: 'Enérgico, divertido y con colores vivos para conectar',
      colors: ['#8b5cf6', '#ec4899', '#f43f5e'],
    },
    {
      id: 'editorial',
      name: 'Editorial & Clásico',
      desc: 'Estilo revista, tipografías distinguidas e historias de marca',
      colors: ['#1c1917', '#c25e3d', '#fafaf9'],
    },
  ];

  readonly tones = [
    { id: 'Cercano y amigable', label: 'Cercano & Amigable', desc: 'Conversacional y cálido' },
    { id: 'Sofisticado y refinado', label: 'Sofisticado & Exclusivo', desc: 'Elegante y selecto' },
    {
      id: 'Dinámico y juvenil',
      label: 'Dinámico & Juvenil',
      desc: 'Directo, fresco y con energía',
    },
    {
      id: 'Profesional y confiable',
      label: 'Profesional & Confiable',
      desc: 'Seguro, serio y transparente',
    },
  ];

  // Datos para StorePreview
  readonly previewData = computed<PreviewData>(() => {
    const generated = this.generatedStore();
    const tenant = this.tenantService.currentTenant();
    const presetId = generated?.suggested_theme_id || this.stylePreference();
    const preset = THEME_PRESETS[presetId] ?? THEME_PRESETS.minimalist;

    const pairing =
      TYPOGRAPHY_PAIRINGS.find((p) => p.id === generated?.typography_pairing_id) ??
      TYPOGRAPHY_PAIRINGS[1];

    const tokens: ThemeTokens = {
      ...preset.tokens,
      theme_id: presetId,
      theme_name: preset.name,
      font_heading: pairing.font_heading,
      font_body: pairing.font_body,
      font_button: pairing.font_button,
      colors: {
        ...preset.tokens.colors,
        ...(generated?.branding_colors || {}),
      },
    };

    return {
      business_name: this.businessName() || tenant?.business_name || 'Mi Tienda',
      logo_url: tenant?.logo_url || null,
      primary_color: generated?.branding_colors.primary || preset.tokens.colors.primary,
      secondary_color: generated?.branding_colors.secondary || preset.tokens.colors.secondary,
      accent_color: generated?.branding_colors.accent || preset.tokens.colors.accent,
      background_color: generated?.branding_colors.background || preset.tokens.colors.background,
      header_color: generated?.branding_colors.header || preset.tokens.colors.header,
      footer_color: generated?.branding_colors.footer || preset.tokens.colors.footer,
      currency: (tenant?.settings?.['currency'] as string) || 'USD',
      timezone: 'America/Bogota',
      font_family: pairing.font_heading,
      layout: presetId === 'minimalist' ? 'minimal' : 'modern',
      viewMode: this.previewMode(),
      storefront_layout: {
        sections: generated?.storefront_sections || [],
      },
      themeTokens: tokens,
      industry: this.industry(),
    };
  });

  ngOnInit(): void {
    const tenant = this.tenantService.currentTenant();
    if (tenant?.business_name) {
      this.businessName.set(tenant.business_name);
    }
  }

  ngOnDestroy(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
    }
  }

  selectIndustry(id: string): void {
    this.industry.set(id);
  }

  selectAudience(id: string): void {
    this.targetAudience.set(id);
  }

  selectValueProp(id: string): void {
    this.valueProposition.set(id);
  }

  selectStyle(id: ThemePresetId): void {
    this.stylePreference.set(id);
  }

  selectTone(id: string): void {
    this.tone.set(id);
  }

  goToStep(s: 1 | 2 | 3): void {
    this.step.set(s);
  }

  prevStep(): void {
    const s = this.step();
    if (s === 2) this.step.set(1);
    else if (s === 3) this.step.set(2);
  }

  async startGeneration(): Promise<void> {
    this.step.set(4);
    this.startLoadingMessages();

    const input: AiStoreWizardInput = {
      businessName: this.businessName().trim() || 'Mi Tienda',
      industry: this.industry(),
      customIndustryDetail: this.customDetail().trim() || undefined,
      targetAudience: this.targetAudience(),
      valueProposition: this.valueProposition(),
      stylePreference: this.stylePreference(),
      tone: this.tone(),
    };

    try {
      const result = await this.wizardService.generateStoreSetup(input);
      this.generatedStore.set(result);
      // Breve pausa para que el usuario aprecie el estado de finalización
      setTimeout(() => {
        this.stopLoadingMessages();
        this.step.set(5);
      }, 1000);
    } catch (err) {
      this.stopLoadingMessages();
      console.error('Error generando tienda con IA:', err);
      this.toast.error(
        'Ocurrió un inconveniente al generar la tienda. Usaremos una plantilla base.',
      );
      const fallback = this.wizardService.buildFallbackSetup(input);
      this.generatedStore.set(fallback);
      this.step.set(5);
    }
  }

  async applyAndPublish(): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    const generated = this.generatedStore();

    if (!tenantId || !generated) {
      this.toast.error('No se pudo aplicar la configuración. Intenta nuevamente.');
      return;
    }

    this.isApplying.set(true);
    try {
      const res = await this.wizardService.applyGeneratedStore(tenantId, generated);
      if (res.success) {
        this.toast.success('¡Tienda configurada y publicada exitosamente con IA!');
        this.applied.emit();
        this.close.emit();
      } else {
        this.toast.error(res.error || 'Error al aplicar el diseño.');
      }
    } catch (e: any) {
      this.toast.error('Error al publicar la tienda.');
    } finally {
      this.isApplying.set(false);
    }
  }

  private startLoadingMessages(): void {
    const messages = [
      'Analizando tu modelo de negocio...',
      'Diseñando una paleta de colores armónica...',
      'Redactando una propuesta de valor de alto impacto...',
      'Estructurando las secciones de tu tienda...',
      'Seleccionando la combinación tipográfica perfecta...',
      'Creando categorías recomendadas para tu catálogo...',
      'Casi listo... ensamblando tu tienda online...',
    ];
    let idx = 0;
    this.loadingMessage.set(messages[0]);
    this.messageInterval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      this.loadingMessage.set(messages[idx]);
    }, 2200);
  }

  private stopLoadingMessages(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }
  }
}
