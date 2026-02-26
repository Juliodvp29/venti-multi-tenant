import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { SeoService } from '@core/services/seo';
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
    });
  }

  readonly dynamicStyles = computed(() => {
    const branding = this.branding();
    if (!branding) return {};

    return {
      '--primary-color': branding.primary_color || '#4f46e5',
      '--secondary-color': branding.secondary_color || '#1e293b',
      '--accent-color': branding.accent_color || '#f59e0b',
      'font-family': branding.font_family || 'Inter, sans-serif'
    };
  });
}
