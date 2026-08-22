import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { SeoService } from '@core/services/seo';
import { themeTokensToCssVars, AVAILABLE_FONTS } from '@core/constants/theme-presets';
import { StoreHeader } from './components/store-header/store-header';
import { CartDrawer } from './components/cart-drawer/cart-drawer';

@Component({
  selector: 'app-store',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, StoreHeader, CartDrawer],
  templateUrl: './store.html',
  styleUrl: './store.css',
})
export class StoreComponent {
  private readonly tenantService = inject(TenantService);
  private readonly seo = inject(SeoService);

  readonly isCartOpen = signal(false);
  readonly branding = this.tenantService.branding;
  readonly themeTokens = this.tenantService.themeTokens;

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
        this.ensureFontLoaded(tokens.font_heading);
        this.ensureFontLoaded(tokens.font_body);
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
