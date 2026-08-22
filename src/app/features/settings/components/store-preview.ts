import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorefrontLayout, ThemeTokens } from '@core/models';
import { themeTokensToCssVars, THEME_PRESETS } from '@core/constants/theme-presets';

export interface PreviewData {
    business_name: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    header_color: string;
    footer_color: string;
    currency: string;
    timezone: string;
    font_family: string;
    layout: 'modern' | 'classic' | 'minimal';
    viewMode: 'desktop' | 'mobile';
    storefront_layout: StorefrontLayout;
    themeTokens?: ThemeTokens;
}

@Component({
    selector: 'app-store-preview',
    imports: [CommonModule],
    templateUrl: './store-preview.html',
    styles: [
        ':host { display: block; height: 100%; min-height: 0; }',
        `
        .store-section [class*="text-gray"],
        .store-section [class*="text-slate"],
        .store-section [class*="text-white"],
        .store-section [class*="text-black"],
        .store-section p,
        .store-section span:not(.badge-pill),
        .store-section li {
            color: var(--section-text-color, inherit);
        }
        .store-section h1,
        .store-section h2,
        .store-section h3,
        .store-section h4 {
            color: var(--section-title-color, var(--section-text-color, inherit));
        }
        `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorePreview {
    readonly data = input.required<PreviewData>();

    readonly mockProducts = [
        { 
            name: 'Classic Chrono', 
            price: 129, 
            original_price: 169,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
            secondaryImage: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&q=80&w=400',
            stock: 12,
            isNew: true,
        },
        { 
            name: 'Sport Runner', 
            price: 85, 
            original_price: 110,
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
            secondaryImage: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400',
            stock: 4,
            isNew: false,
        },
        { 
            name: 'Leather Wallet', 
            price: 45, 
            original_price: null,
            image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400',
            secondaryImage: null,
            stock: 25,
            isNew: true,
        },
        { 
            name: 'Wireless Pods', 
            price: 199, 
            original_price: 249,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
            secondaryImage: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=400',
            stock: 0,
            isNew: false,
        },
        { 
            name: 'Minimal Backpack', 
            price: 120, 
            original_price: null,
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
            secondaryImage: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&q=80&w=400',
            stock: 8,
            isNew: false,
        },
        { 
            name: 'Smart Glasses', 
            price: 250, 
            original_price: 320,
            image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400',
            secondaryImage: null,
            stock: 15,
            isNew: true,
        }
    ];

    get cardOrientation(): string {
        return this.activeTokens.card_orientation || 'vertical';
    }

    get cardBorderStyle(): string {
        return this.activeTokens.card_border_style || 'bordered';
    }

    get cardShowPrice(): boolean {
        return this.activeTokens.card_show_price ?? true;
    }

    get cardShowOriginalPrice(): boolean {
        return this.activeTokens.card_show_original_price ?? true;
    }

    get cardShowDiscountBadge(): boolean {
        return this.activeTokens.card_show_discount_badge ?? true;
    }

    get cardShowStock(): boolean {
        return this.activeTokens.card_show_stock ?? false;
    }

    get cardShowNewBadge(): boolean {
        return this.activeTokens.card_show_new_badge ?? true;
    }

    get cardShowSaleBadge(): boolean {
        return this.activeTokens.card_show_sale_badge ?? true;
    }

    get cardCartButtonStyle(): string {
        return this.activeTokens.card_cart_button_style || 'hover';
    }

    get cardHoverSecondaryImage(): boolean {
        return this.activeTokens.card_hover_secondary_image ?? true;
    }

    get cardImageAspectClass(): string {
        const aspect = this.activeTokens.card_image_aspect;
        switch (aspect) {
            case '1/1': return 'aspect-square';
            case '3/4': return 'aspect-[3/4]';
            case '16/9': return 'aspect-video';
            case '4/5':
            default:
                return 'aspect-[4/5]';
        }
    }

    getDiscountPercent(price: number, originalPrice: number | null): number | null {
        if (originalPrice && originalPrice > price) {
            return Math.round(((originalPrice - price) / originalPrice) * 100);
        }
        return null;
    }

    readonly dynamicCssVars = computed(() => {
        const d = this.data();
        const tokens = d.themeTokens || THEME_PRESETS.minimalist.tokens;
        const baseVars = themeTokensToCssVars(tokens);

        return {
            ...baseVars,
            '--store-color-primary': d.primary_color || tokens.colors.primary,
            '--store-color-secondary': d.secondary_color || tokens.colors.secondary,
            '--store-color-accent': d.accent_color || tokens.colors.accent,
            '--store-color-bg': d.background_color || tokens.colors.background,
            '--store-color-header': d.header_color || tokens.colors.header,
            '--store-color-footer': d.footer_color || tokens.colors.footer,
            '--store-font-heading': d.font_family || tokens.font_heading,
        };
    });

    get activeTokens(): ThemeTokens {
        return this.data().themeTokens || THEME_PRESETS.minimalist.tokens;
    }

    get headerLogoPosition(): string {
        return this.activeTokens.header_logo_position || 'left';
    }

    get headerShowSearch(): boolean {
        return this.activeTokens.header_show_search ?? true;
    }

    get headerShowCart(): boolean {
        return this.activeTokens.header_show_cart ?? true;
    }

    get headerShowSocials(): boolean {
        return this.activeTokens.header_show_socials ?? false;
    }

    get headerHamburger(): boolean {
        return this.activeTokens.header_hamburger ?? false;
    }

    get headerLogoSizeClass(): string {
        const size = this.activeTokens.header_logo_size || 'md';
        const map: Record<string, string> = { sm: 'h-6', md: 'h-8', lg: 'h-10', xl: 'h-14' };
        return map[size] || 'h-8';
    }

    get headerNavSpacingClass(): string {
        const spacing = this.activeTokens.header_nav_spacing || 'normal';
        const map: Record<string, string> = { tight: 'space-x-3', normal: 'space-x-6', wide: 'space-x-10' };
        return map[spacing] || 'space-x-6';
    }

    get navLinks(): any[] {
        const custom = this.data().storefront_layout?.navigation;
        if (custom && custom.length) return custom;
        return [
            { label: 'Productos', url: '#' },
            { label: 'Colecciones', url: '#' },
            { label: 'Sobre Nosotros', url: '#' }
        ];
    }

    get halfNavLinks(): number {
        return Math.ceil(this.navLinks.length / 2);
    }

    get containerClass() {
        const base = this.data().viewMode === 'mobile'
            ? 'w-[375px] h-[667px] border-[12px] border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden'
            : 'w-full h-full border border-slate-200 rounded-xl shadow-lg overflow-hidden';
        return base;
    }

    get fontStyle() {
        return {
            'font-family': this.activeTokens.font_body || this.data().font_family,
        };
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('es', {
            style: 'currency',
            currency: this.data().currency || 'USD',
        }).format(price);
    }

    formatCurrentDate(): string {
        return new Intl.DateTimeFormat('es', {
            dateStyle: 'medium',
            timeZone: this.data().timezone || 'UTC',
        }).format(new Date());
    }

    preventDefault(event: Event) {
        event.preventDefault();
    }

    getSectionPaddingClass(section: any): string {
        const pt = section.styles?.paddingTop || 'md';
        const pb = section.styles?.paddingBottom || 'md';
        const ptMap: Record<string, string> = { none: 'pt-0', sm: 'pt-4', md: 'pt-8', lg: 'pt-14', xl: 'pt-20' };
        const pbMap: Record<string, string> = { none: 'pb-0', sm: 'pb-4', md: 'pb-8', lg: 'pb-14', xl: 'pb-20' };
        return `${ptMap[pt] || 'pt-8'} ${pbMap[pb] || 'pb-8'}`;
    }

    getSectionContainerClass(section: any): string {
        const width = section.styles?.containerWidth || 'boxed';
        if (width === 'full') return 'w-full px-4';
        if (width === 'narrow') return 'max-w-3xl mx-auto px-4';
        return 'max-w-6xl mx-auto px-4 sm:px-6';
    }

    getSectionDeviceClass(section: any): string {
        if (section.styles?.hideOnMobile && section.styles?.hideOnDesktop) return 'hidden';
        if (section.styles?.hideOnMobile) return 'hidden md:block';
        if (section.styles?.hideOnDesktop) return 'block md:hidden';
        return '';
    }

    getSectionStyle(section: any): Record<string, string> {
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
