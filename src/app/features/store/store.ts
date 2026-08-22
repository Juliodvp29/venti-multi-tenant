import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { TenantService } from '@core/services/tenant';
import { SeoService } from '@core/services/seo';
import { themeTokensToCssVars, AVAILABLE_FONTS } from '@core/constants/theme-presets';
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
  readonly themeTokens = this.tenantService.themeTokens;

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: any) => e.urlAfterRedirects || e.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
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
    return pt ? (map[pt] || 'var(--store-grid-gap, 1.5rem)') : 'var(--store-grid-gap, 1.5rem)';
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
    return pb ? (map[pb] || 'var(--store-section-py, 4rem)') : 'var(--store-section-py, 4rem)';
  });

  constructor() {
    effect(() => {
      const branding = this.branding();
      if (branding) {
        this.seo.updateTags({
          title: branding.business_name || 'Venti Shop',
          description: branding.description || 'Nuestra tienda online oficial.',
          image: branding.logo_url || undefined,
          siteName: branding.business_name || 'Venti Shop'
        });
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

    return {
      ...cssVars,
      'font-family': tokens.font_body || branding?.font_family || '"Inter", sans-serif'
    };
  });

  private ensureFontLoaded(fontFamily: string) {
    if (!fontFamily) return;
    const fontObj = AVAILABLE_FONTS.find(f => f.family === fontFamily);
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
