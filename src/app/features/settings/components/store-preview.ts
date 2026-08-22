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
    styles: [':host { display: block; height: 100%; min-height: 0; }'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorePreview {
    readonly data = input.required<PreviewData>();

    readonly mockProducts = [
        { name: 'Classic Chrono', price: 129, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400' },
        { name: 'Sport Runner', price: 85, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400' },
        { name: 'Leather Wallet', price: 45, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400' },
        { name: 'Wireless Pods', price: 199, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400' },
        { name: 'Minimal Backpack', price: 120, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400' },
        { name: 'Smart Glasses', price: 250, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400' }
    ];

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

    asAny(val: any): any { return val; }
}
