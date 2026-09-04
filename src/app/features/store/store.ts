import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  effect,
  Renderer2,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { TenantService } from '@core/services/tenant';
import { SeoService } from '@core/services/seo';
import {
  themeTokensToCssVars,
  AVAILABLE_FONTS,
  getContrastColor,
} from '@core/constants/theme-presets';
import { validateAndSanitizeCss } from '@core/utils/css-validator';
import { StorePageId, PageLayoutConfig, PageHeaderStyle, PageFooterStyle } from '@core/models';
import { StoreHeader } from './components/store-header/store-header';
import { CartDrawer } from './components/cart-drawer/cart-drawer';

@Component({
  selector: 'app-store',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, StoreHeader, CartDrawer],
  templateUrl: './store.html',
  styleUrl: './store.css',
})
export class StoreComponent {
  private readonly tenantService = inject(TenantService);
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);

  readonly isCartOpen = signal(false);
  readonly branding = this.tenantService.branding;
  readonly tenantSettings = this.tenantService.settings;
  readonly themeTokens = this.tenantService.publishedThemeTokens;

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e: any) => e.urlAfterRedirects || e.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly activePageId = computed<StorePageId>(() => {
    const url = this.currentUrl() || '';
    if (url.includes('/store/productos') || url.endsWith('/productos')) return 'catalog';
    if (url.includes('/store/product/') || url.includes('/product/')) return 'product_detail';
    if (url.includes('/store/carrito') || url.endsWith('/carrito')) return 'cart';
    if (url.includes('/store/checkout') || url.endsWith('/checkout')) return 'checkout';
    if (url.includes('/store/contacto') || url.endsWith('/contacto')) return 'contact';
    if (url.includes('/store/nosotros') || url.endsWith('/nosotros')) return 'about';
    return 'home';
  });

  readonly isHomePage = computed(() => this.activePageId() === 'home');

  readonly activePageLayout = computed<PageLayoutConfig>(() => {
    return this.tenantService.getPageLayout(this.activePageId());
  });

  readonly headerStyle = computed<PageHeaderStyle>(() => {
    return this.activePageLayout()?.styles?.headerStyle || 'default';
  });

  readonly footerStyle = computed<PageFooterStyle>(() => {
    return this.activePageLayout()?.styles?.footerStyle || 'default';
  });

  readonly pageBackgroundColor = computed<string>(() => {
    return this.activePageLayout()?.styles?.backgroundColor || 'var(--store-color-bg, #ffffff)';
  });

  readonly pageContainerMaxWidth = computed<string>(() => {
    const width = this.activePageLayout()?.styles?.containerWidth;
    if (width === 'full') return '100%';
    if (width === 'narrow') return '896px';
    return 'var(--store-max-width, 1280px)';
  });

  readonly pagePaddingTop = computed<string>(() => {
    const pt = this.activePageLayout()?.styles?.paddingTop;
    const map: Record<string, string> = {
      none: '0',
      sm: '1.5rem',
      md: '3rem',
      lg: '5rem',
      xl: '7rem',
    };
    return pt ? map[pt] || 'var(--store-grid-gap, 1.5rem)' : 'var(--store-grid-gap, 1.5rem)';
  });

  readonly pagePaddingBottom = computed<string>(() => {
    const pb = this.activePageLayout()?.styles?.paddingBottom;
    const map: Record<string, string> = {
      none: '0',
      sm: '1.5rem',
      md: '3rem',
      lg: '5rem',
      xl: '7rem',
    };
    return pb ? map[pb] || 'var(--store-section-py, 4rem)' : 'var(--store-section-py, 4rem)';
  });

  // Footer Computeds
  readonly footerColumns = computed(() => this.themeTokens()?.footer_columns || '3');
  readonly footerThemeMode = computed(() => this.themeTokens()?.footer_theme_mode || 'auto');
  readonly footerAlignment = computed(() => this.themeTokens()?.footer_alignment || 'left');

  readonly footerBgColor = computed(() => {
    const mode = this.footerThemeMode();
    if (mode === 'light') return '#ffffff';
    if (mode === 'dark') return '#0f172a';
    if (mode === 'custom') return this.themeTokens()?.footer_custom_bg || '#0f172a';
    return this.branding()?.footer_color || 'var(--store-color-footer, #ffffff)';
  });

  readonly footerTextColor = computed(() => {
    const mode = this.footerThemeMode();
    if (mode === 'light') return '#0f172a';
    if (mode === 'dark') return '#ffffff';
    if (mode === 'custom')
      return getContrastColor(this.themeTokens()?.footer_custom_bg || '#0f172a');
    return 'var(--store-color-text, #0f172a)';
  });

  readonly footerMutedColor = computed(() => {
    const mode = this.footerThemeMode();
    if (mode === 'light') return '#64748b';
    if (mode === 'dark') return '#94a3b8';
    if (mode === 'custom') {
      const isDark =
        getContrastColor(this.themeTokens()?.footer_custom_bg || '#0f172a') === '#ffffff';
      return isDark ? '#94a3b8' : '#64748b';
    }
    return 'var(--store-color-muted, #64748b)';
  });

  readonly footerBorderColor = computed(() => {
    const mode = this.footerThemeMode();
    if (
      mode === 'dark' ||
      (mode === 'custom' &&
        getContrastColor(this.themeTokens()?.footer_custom_bg || '#0f172a') === '#ffffff')
    ) {
      return 'rgba(255, 255, 255, 0.1)';
    }
    return 'rgba(0, 0, 0, 0.08)';
  });

  readonly footerShowLogo = computed(() => this.themeTokens()?.footer_show_logo ?? true);
  readonly footerShowDescription = computed(
    () => this.themeTokens()?.footer_show_description ?? true,
  );
  readonly footerDescription = computed(
    () =>
      this.themeTokens()?.footer_description ||
      this.branding()?.description ||
      'Tu tienda en línea de confianza con los mejores productos y atención.',
  );
  readonly footerShowSocial = computed(() => this.themeTokens()?.footer_show_social ?? true);
  readonly footerShowNewsletter = computed(
    () => this.themeTokens()?.footer_show_newsletter ?? true,
  );
  readonly footerNewsletterTitle = computed(
    () => this.themeTokens()?.footer_newsletter_title || 'Suscríbete a nuestro boletín',
  );
  readonly footerNewsletterDescription = computed(
    () =>
      this.themeTokens()?.footer_newsletter_description ||
      'Recibe promociones exclusivas, lanzamientos y novedades directamente en tu email.',
  );
  readonly footerShowContact = computed(() => this.themeTokens()?.footer_show_contact ?? true);
  readonly footerAddress = computed(() => this.themeTokens()?.footer_address || '');
  readonly footerPhone = computed(() => this.themeTokens()?.footer_phone || '');
  readonly footerHours = computed(() => this.themeTokens()?.footer_hours || '');
  readonly footerShowLegal = computed(() => this.themeTokens()?.footer_show_legal ?? true);
  readonly footerLegalLinks = computed(() => {
    const links = this.themeTokens()?.footer_legal_links;
    if (links && links.length) return links;
    return [
      { id: '1', label: 'Términos y Condiciones', url: '/store/terminos' },
      { id: '2', label: 'Política de Privacidad', url: '/store/privacidad' },
      { id: '3', label: 'Envíos y Devoluciones', url: '/store/envios' },
      { id: '4', label: 'Contacto', url: '/store/contacto' },
    ];
  });
  readonly footerShowPayments = computed(() => this.themeTokens()?.footer_show_payments ?? true);
  readonly footerPaymentMethods = computed(
    () =>
      this.themeTokens()?.footer_payment_methods || [
        'visa',
        'mastercard',
        'amex',
        'paypal',
        'mercadopago',
        'nequi',
        'pse',
        'cash',
      ],
  );
  readonly footerCopyrightText = computed(() => {
    const custom = this.themeTokens()?.footer_copyright_text;
    const year = new Date().getFullYear().toString();
    const storeName = this.branding()?.business_name || 'Mi Tienda';
    if (custom) {
      return custom.replace(/{{year}}/gi, year).replace(/{{store}}/gi, storeName);
    }
    return `© ${year} ${storeName}. Todos los derechos reservados. Potenciado por Venti Shop.`;
  });
  readonly primaryContrastColor = computed(() => {
    return getContrastColor(this.themeTokens()?.colors?.primary || this.branding()?.primary_color);
  });

  constructor() {
    effect(() => {
      const branding = this.branding();
      if (branding) {
        const isPrivateStorePage =
          ['cart', 'checkout', 'success'].includes(this.activePageId()) ||
          this.currentUrl().includes('/store/account');
        const settings = this.tenantSettings();
        const seoTitle = String(settings['seo_title'] || '').trim();
        const seoDescription = String(settings['seo_description'] || '').trim();
        const seoKeywords = String(settings['seo_keywords'] || '')
          .split(',')
          .map((keyword) => keyword.trim())
          .filter(Boolean);
        const seoOgImage = String(settings['seo_og_image'] || '').trim();
        this.seo.updateTags({
          title: seoTitle || branding.business_name || 'Venti Shop',
          description: seoDescription || branding.description || 'Nuestra tienda online oficial.',
          keywords: seoKeywords.length > 0 ? seoKeywords : undefined,
          image: seoOgImage || branding.social_share_image_url || branding.logo_url || undefined,
          siteName: branding.business_name || 'Venti Shop',
          robots: isPrivateStorePage ? 'noindex, nofollow' : 'index, follow',
        });
        if (branding.favicon_url) {
          this.seo.updateFavicon(branding.favicon_url);
        }
      }

      // Dynamically load Google Fonts if needed
      const tokens = this.themeTokens();
      if (tokens) {
        if (tokens.font_heading) this.ensureFontLoaded(tokens.font_heading);
        if (tokens.font_body) this.ensureFontLoaded(tokens.font_body);
        if (tokens.font_button) this.ensureFontLoaded(tokens.font_button);
      }
    });
  }

  readonly dynamicStyles = computed(() => {
    const tokens = this.themeTokens();
    const branding = this.branding();
    if (!tokens) return {};

    const cssVars = themeTokensToCssVars(tokens);
    const bgImage = branding?.background_image_url || tokens.background_image_url;

    return {
      ...cssVars,
      'font-family': tokens.font_body || branding?.font_family || '"Inter", sans-serif',
      ...(bgImage
        ? {
            'background-image': `url('${bgImage}')`,
            'background-size': 'cover',
            'background-attachment': 'fixed',
          }
        : {}),
    };
  });

  private readonly renderer = inject(Renderer2);
  private readonly elementRef = inject(ElementRef);
  private styleElement: HTMLStyleElement | null = null;

  readonly sanitizedCustomCss = computed(() => {
    const raw = this.themeTokens()?.custom_css;
    if (!raw || !raw.trim()) return '';
    return validateAndSanitizeCss(raw).sanitizedCss;
  });

  private injectCustomCss = effect(() => {
    const css = this.sanitizedCustomCss();
    const root = this.elementRef.nativeElement as HTMLElement;

    if (this.styleElement) {
      this.renderer.removeChild(root, this.styleElement);
      this.styleElement = null;
    }

    if (!css) return;

    this.styleElement = this.renderer.createElement('style');
    this.renderer.setProperty(this.styleElement, 'textContent', css);
    this.renderer.appendChild(root, this.styleElement);
  });

  private ensureFontLoaded(fontFamily: string) {
    if (typeof document === 'undefined' || !fontFamily) return;
    const fontObj = AVAILABLE_FONTS.find((f) => f.family === fontFamily);
    if (!fontObj || !fontObj.googleFontUrl) return;

    const linkId = `google-font-${fontObj.name.toLowerCase().replace(/\s+/g, '-')}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = fontObj.googleFontUrl;
      document.head.appendChild(link);
    }
  }
}
