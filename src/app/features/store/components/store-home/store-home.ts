import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { ProductGrid } from '../product-grid/product-grid';
import { StorefrontSection } from '@core/models';

@Component({
    selector: 'app-store-home',
    imports: [CommonModule, RouterModule, ProductGrid],
    templateUrl: './store-home.html',
    styleUrl: './store-home.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreHome {
    private readonly tenantService = inject(TenantService);

    readonly branding = this.tenantService.branding;
    readonly homeConfig = computed(() => this.tenantService.getPageLayout('home'));
    readonly themeTokens = this.tenantService.publishedThemeTokens;
    
    readonly activeSections = computed(() =>
        (this.homeConfig()?.sections || []).filter((s: StorefrontSection) => s.isActive)
    );

    readonly hasFeaturedProducts = signal(true);

    onProductsLoaded(hasProducts: boolean) {
        this.hasFeaturedProducts.set(hasProducts);
    }

    getSectionPaddingClass(section: StorefrontSection): string {
        const pt = section.styles?.paddingTop || 'md';
        const pb = section.styles?.paddingBottom || 'md';
        const ptMap: Record<string, string> = { none: 'pt-0', sm: 'pt-6', md: 'pt-14', lg: 'pt-24', xl: 'pt-32' };
        const pbMap: Record<string, string> = { none: 'pb-0', sm: 'pb-6', md: 'pb-14', lg: 'pb-24', xl: 'pb-32' };
        return `${ptMap[pt] || 'pt-14'} ${pbMap[pb] || 'pb-14'}`;
    }

    getSectionContainerClass(section: StorefrontSection): string {
        const width = section.styles?.containerWidth || 'boxed';
        if (width === 'full') return 'w-full px-4';
        if (width === 'narrow') return 'max-w-4xl mx-auto px-4 sm:px-6';
        return 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
    }

    getSectionDeviceClass(section: StorefrontSection): string {
        if (section.styles?.hideOnMobile && section.styles?.hideOnDesktop) return 'hidden';
        if (section.styles?.hideOnMobile) return 'hidden md:block';
        if (section.styles?.hideOnDesktop) return 'block md:hidden';
        return '';
    }

    getSectionStyle(section: StorefrontSection): Record<string, string> {
        const styles: Record<string, string> = {};
        if (section.styles?.backgroundColor) {
            styles['background-color'] = section.styles.backgroundColor;
        }
        if (section.styles?.textColor) {
            styles['color'] = section.styles.textColor;
            styles['--section-text-color'] = section.styles.textColor;
        }
        if (section.styles?.titleColor) {
            styles['--section-title-color'] = section.styles.titleColor;
        }
        return styles;
    }

    asAny(val: any): any { return val; }
}
