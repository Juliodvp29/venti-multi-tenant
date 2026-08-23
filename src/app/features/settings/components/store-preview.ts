import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, ViewEncapsulation, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorefrontLayout, ThemeTokens, StorePageId, PageLayoutConfig, PageHeaderStyle, PageFooterStyle, StorefrontSection, getDefaultPageLayout } from '@core/models';
import { themeTokensToCssVars, THEME_PRESETS, getContrastColor } from '@core/constants/theme-presets';
import { validateAndSanitizeCss } from '@core/utils/css-validator';

export interface PreviewData {
    business_name: string;
    logo_url: string | null;
    logo_dark_url?: string | null;
    social_share_image_url?: string | null;
    main_banner_url?: string | null;
    background_image_url?: string | null;
    background_pattern?: string;
    promo_video_url?: string | null;
    brand_gallery?: any[];
    social_links?: any;
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
        'app-store-preview { display: block; height: 100%; min-height: 0; }',
        `
        app-store-preview .product-card {
            border-radius: var(--store-radius-card, 1rem);
            border-color: var(--store-color-border, #e5e5e5);
            background-color: var(--store-color-surface, #ffffff);
            transition: all 0.2s ease-in-out;
        }
        app-store-preview .category-card,
        app-store-preview .testimonial-card,
        app-store-preview .review-card {
            border-radius: var(--store-radius-card, 1rem);
            background-color: var(--store-color-surface, #ffffff);
            transition: all 0.2s ease-in-out;
        }
        app-store-preview .store-btn-primary {
            border-radius: var(--store-radius-btn, 0.75rem);
            background-color: var(--store-color-primary, #4f46e5);
            color: var(--store-color-btn-text, #ffffff);
            transition: all 0.2s ease-in-out;
        }
        `
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorePreview {
    readonly data = input.required<PreviewData>();

    private readonly renderer = inject(Renderer2);
    private readonly elementRef = inject(ElementRef);
    private styleElement: HTMLStyleElement | null = null;

    readonly previewPage = signal<StorePageId>('home');

    readonly pageOptions: { id: StorePageId; label: string }[] = [
        { id: 'home', label: 'Inicio' },
        { id: 'catalog', label: 'Catálogo' },
        { id: 'product_detail', label: 'Detalle' },
        { id: 'cart', label: 'Carrito' },
        { id: 'checkout', label: 'Checkout' },
        { id: 'contact', label: 'Contacto' },
        { id: 'about', label: 'Nosotros' },
    ];

    readonly activePageConfig = computed<PageLayoutConfig>(() => {
        const pageId = this.previewPage();
        const layout = this.data().storefront_layout;
        if (layout?.pages?.[pageId]) {
            return layout.pages[pageId]!;
        }
        return getDefaultPageLayout(pageId, layout?.sections);
    });

    readonly activeSections = computed<StorefrontSection[]>(() => {
        return this.activePageConfig()?.sections || [];
    });

    readonly pageHeaderStyle = computed<PageHeaderStyle>(() => {
        return this.activePageConfig()?.styles?.headerStyle || 'default';
    });

    readonly pageFooterStyle = computed<PageFooterStyle>(() => {
        return this.activePageConfig()?.styles?.footerStyle || 'default';
    });

    readonly pageBgColor = computed<string>(() => {
        return this.activePageConfig()?.styles?.backgroundColor || this.data().background_color || '#ffffff';
    });

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

    get activeLogoUrl(): string | null {
        const headerBg = this.data().header_color || '#ffffff';
        const isHeaderDark = getContrastColor(headerBg) === '#ffffff';
        if (isHeaderDark && this.data().logo_dark_url) {
            return this.data().logo_dark_url!;
        }
        return this.data().logo_url;
    }

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
        const primaryColor = d.primary_color || tokens.colors.primary;
        const secondaryColor = d.secondary_color || tokens.colors.secondary;
        const accentColor = d.accent_color || tokens.colors.accent;

        return {
            ...baseVars,
            '--store-color-primary': primaryColor,
            '--store-color-primary-contrast': getContrastColor(primaryColor),
            '--store-color-secondary': secondaryColor,
            '--store-color-secondary-contrast': getContrastColor(secondaryColor),
            '--store-color-accent': accentColor,
            '--store-color-accent-contrast': getContrastColor(accentColor),
            '--store-color-bg': d.background_color || tokens.colors.background,
            '--store-color-header': d.header_color || tokens.colors.header,
            '--store-color-footer': d.footer_color || tokens.colors.footer,
            '--store-font-heading': d.font_family || tokens.font_heading,
            '--store-color-btn-text': getContrastColor(primaryColor),
        };
    });

    readonly sanitizedCustomCss = computed(() => {
        const raw = this.data().themeTokens?.custom_css;
        if (!raw || !raw.trim()) return '';
        const result = validateAndSanitizeCss(raw);
        if (result.errors.length > 0) {
            console.warn('[StorePreview] CSS validation errors:', result.errors);
        }
        if (result.warnings.length > 0) {
            console.info('[StorePreview] CSS validation warnings:', result.warnings);
        }
        return result.sanitizedCss;
    });

    // Effect to inject custom CSS into the component's style element
    private injectCustomCss = effect(() => {
        const css = this.sanitizedCustomCss();
        const root = this.elementRef.nativeElement as HTMLElement;

        // Remove existing style element if any
        if (this.styleElement) {
            this.renderer.removeChild(root, this.styleElement);
            this.styleElement = null;
        }

        if (!css) return;

        // Create new style element and inject CSS
        this.styleElement = this.renderer.createElement('style');
        this.renderer.setProperty(this.styleElement, 'textContent', css);
        this.renderer.appendChild(root, this.styleElement);
    }, { allowSignalWrites: true });

    primaryContrastColor(): string {
        return getContrastColor(this.data().primary_color || this.activeTokens.colors.primary);
    }

    accentContrastColor(): string {
        return getContrastColor(this.data().accent_color || this.activeTokens.colors.accent);
    }

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

    // Footer Configurable Getters
    get footerColumns(): string {
        return this.activeTokens.footer_columns || '3';
    }

    get footerThemeMode(): string {
        return this.activeTokens.footer_theme_mode || 'auto';
    }

    get footerAlignment(): string {
        return this.activeTokens.footer_alignment || 'left';
    }

    get footerBgColor(): string {
        const mode = this.footerThemeMode;
        if (mode === 'light') return '#ffffff';
        if (mode === 'dark') return '#0f172a';
        if (mode === 'custom') return this.activeTokens.footer_custom_bg || '#0f172a';
        return this.data().footer_color || 'var(--store-color-footer, #ffffff)';
    }

    get footerTextColor(): string {
        const mode = this.footerThemeMode;
        if (mode === 'light') return '#0f172a';
        if (mode === 'dark') return '#ffffff';
        if (mode === 'custom') return getContrastColor(this.activeTokens.footer_custom_bg || '#0f172a');
        return 'var(--store-color-text, #0f172a)';
    }

    get footerMutedColor(): string {
        const mode = this.footerThemeMode;
        if (mode === 'light') return '#64748b';
        if (mode === 'dark') return '#94a3b8';
        if (mode === 'custom') {
            const isDark = getContrastColor(this.activeTokens.footer_custom_bg || '#0f172a') === '#ffffff';
            return isDark ? '#94a3b8' : '#64748b';
        }
        return 'var(--store-color-muted, #64748b)';
    }

    get footerBorderColor(): string {
        const mode = this.footerThemeMode;
        if (mode === 'dark' || (mode === 'custom' && getContrastColor(this.activeTokens.footer_custom_bg || '#0f172a') === '#ffffff')) {
            return 'rgba(255, 255, 255, 0.1)';
        }
        return 'rgba(0, 0, 0, 0.08)';
    }

    get footerShowLogo(): boolean {
        return this.activeTokens.footer_show_logo ?? true;
    }

    get footerShowDescription(): boolean {
        return this.activeTokens.footer_show_description ?? true;
    }

    get footerDescription(): string {
        return this.activeTokens.footer_description || 'Tu tienda en línea de confianza con los mejores productos y atención.';
    }

    get footerShowSocial(): boolean {
        return this.activeTokens.footer_show_social ?? true;
    }

    get footerShowNewsletter(): boolean {
        return this.activeTokens.footer_show_newsletter ?? true;
    }

    get footerNewsletterTitle(): string {
        return this.activeTokens.footer_newsletter_title || 'Suscríbete a nuestro boletín';
    }

    get footerNewsletterDescription(): string {
        return this.activeTokens.footer_newsletter_description || 'Recibe promociones exclusivas, lanzamientos y novedades directamente en tu email.';
    }

    get footerShowContact(): boolean {
        return this.activeTokens.footer_show_contact ?? true;
    }

    get footerAddress(): string {
        return this.activeTokens.footer_address || 'Carrera 15 #85-12, Bogotá, Colombia';
    }

    get footerPhone(): string {
        return this.activeTokens.footer_phone || '+57 310 123 4567';
    }

    get footerHours(): string {
        return this.activeTokens.footer_hours || 'Lun–Sáb: 8:00 AM – 6:00 PM';
    }

    get footerShowLegal(): boolean {
        return this.activeTokens.footer_show_legal ?? true;
    }

    get footerLegalLinks(): any[] {
        const links = this.activeTokens.footer_legal_links;
        if (links && links.length) return links;
        return [
            { id: '1', label: 'Términos y Condiciones', url: '#' },
            { id: '2', label: 'Política de Privacidad', url: '#' },
            { id: '3', label: 'Envíos y Devoluciones', url: '#' },
            { id: '4', label: 'Preguntas Frecuentes', url: '#' },
        ];
    }

    get footerShowPayments(): boolean {
        return this.activeTokens.footer_show_payments ?? true;
    }

    get footerPaymentMethods(): string[] {
        return this.activeTokens.footer_payment_methods || ['visa', 'mastercard', 'amex', 'paypal', 'mercadopago', 'nequi', 'pse', 'cash'];
    }

    get footerCopyrightText(): string {
        const custom = this.activeTokens.footer_copyright_text;
        const year = new Date().getFullYear().toString();
        const storeName = this.data().business_name || 'Mi Tienda';
        if (custom) {
            return custom.replace(/{{year}}/gi, year).replace(/{{store}}/gi, storeName);
        }
        return `© ${year} ${storeName}. Todos los derechos reservados. Potenciado por Venti Shop.`;
    }

    asAny(val: any): any { return val; }
}
