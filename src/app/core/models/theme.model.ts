export type ThemePresetId =
    | 'minimalist'
    | 'editorial'
    | 'fashion'
    | 'tech'
    | 'restaurant'
    | 'artisan'
    | 'luxury'
    | 'sport'
    | 'dark'
    | 'colorful'
    | 'custom';

export type BorderRadiusOption = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type BorderWidthOption = '0px' | '1px' | '2px';
export type ShadowStyleOption = 'none' | 'subtle' | 'elevated' | 'hard' | 'glow' | 'colored';
export type ButtonShapeOption = 'sharp' | 'rounded' | 'pill';
export type ButtonStyleOption = 'filled' | 'outline' | 'elevated' | 'soft';
export type CardStyleOption = 'minimal' | 'bordered' | 'elevated' | 'glass' | 'magazine' | 'playful';
export type CardOrientationOption = 'vertical' | 'horizontal';
export type CardBorderStyleOption = 'bordered' | 'borderless' | 'shadow' | 'flat';
export type CardCartButtonOption = 'hover' | 'always' | 'icon_only' | 'none';
export type HeaderStyleOption = 'minimal' | 'classic' | 'centered' | 'floating' | 'bold';
export type HeroStyleOption = 'centered' | 'split' | 'left' | 'minimal' | 'full';

export type SpacingDensityOption = 'compact' | 'normal' | 'spacious';
export type MaxContentWidthOption = '1024px' | '1280px' | '1440px' | '100%';

export type LogoPositionOption = 'left' | 'center' | 'right';
export type NavAlignOption = 'left' | 'center' | 'right';
export type LogoSizeOption = 'sm' | 'md' | 'lg' | 'xl';
export type NavSpacingOption = 'tight' | 'normal' | 'wide';

export type FontWeightOption = '400' | '500' | '600' | '700' | '800' | '900';
export type BaseFontSizeOption = '14px' | '15px' | '16px' | '18px';
export type LineHeightOption = '1.2' | '1.4' | '1.5' | '1.6' | '1.8';
export type LetterSpacingOption = '-0.03em' | '0em' | '0.03em' | '0.08em';

// Footer tokens
export type FooterColumnsOption = '1' | '2' | '3' | '4';
export type FooterThemeModeOption = 'auto' | 'light' | 'dark' | 'custom';
export type FooterAlignmentOption = 'left' | 'center';
export type FooterPaymentMethod = 'visa' | 'mastercard' | 'amex' | 'paypal' | 'mercadopago' | 'nequi' | 'pse' | 'cash';

export interface FooterLegalLink {
    id: string;
    label: string;
    url: string;
}

export interface TypographyPairing {
    id: string;
    name: string;
    tagline: string;
    description: string;
    font_heading: string;
    font_body: string;
    font_button: string;
    font_weight_heading: FontWeightOption;
}

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    header: string;
    footer: string;
    text_primary: string;
    text_muted: string;
    border: string;
}

export interface ThemeTokens {
    theme_id: ThemePresetId;
    theme_name: string;

    // Tipografías
    font_heading: string;
    font_body: string;
    font_button?: string;
    font_weight_heading?: FontWeightOption;
    font_size_base?: BaseFontSizeOption;
    line_height?: LineHeightOption;
    letter_spacing?: LetterSpacingOption;
    font_size_scale: 'compact' | 'normal' | 'spacious';

    // Bordes y Radios
    border_radius: BorderRadiusOption;
    border_radius_card: BorderRadiusOption;
    border_radius_button: BorderRadiusOption;
    border_radius_badge: BorderRadiusOption;
    border_width: BorderWidthOption;

    // Sombras
    shadow_style: ShadowStyleOption;

    // Espaciado y Distribución
    spacing_density: SpacingDensityOption;
    max_content_width: MaxContentWidthOption;

    // Botones
    button_shape: ButtonShapeOption;
    button_style: ButtonStyleOption;
    button_transform: 'none' | 'uppercase';

    // Tarjetas de Producto
    card_style: CardStyleOption;
    card_image_aspect: '1/1' | '4/5' | '3/4' | '16/9';
    card_orientation?: CardOrientationOption;
    card_border_style?: CardBorderStyleOption;
    card_show_price?: boolean;
    card_show_original_price?: boolean;
    card_show_discount_badge?: boolean;
    card_show_stock?: boolean;
    card_show_new_badge?: boolean;
    card_show_sale_badge?: boolean;
    card_cart_button_style?: CardCartButtonOption;
    card_hover_secondary_image?: boolean;

    // Header y Hero Banner
    header_style: HeaderStyleOption;
    header_logo_position?: LogoPositionOption;
    header_nav_align?: NavAlignOption;
    header_sticky?: boolean;
    header_transparent?: boolean;
    header_show_search?: boolean;
    header_show_cart?: boolean;
    header_show_socials?: boolean;
    header_hamburger?: boolean;
    header_logo_size?: LogoSizeOption;
    header_nav_spacing?: NavSpacingOption;
    hero_style: HeroStyleOption;

    // Footer Configurable
    footer_columns?: FooterColumnsOption;
    footer_theme_mode?: FooterThemeModeOption;
    footer_alignment?: FooterAlignmentOption;
    footer_custom_bg?: string;
    footer_show_logo?: boolean;
    footer_show_description?: boolean;
    footer_description?: string;
    footer_show_social?: boolean;
    footer_show_newsletter?: boolean;
    footer_newsletter_title?: string;
    footer_newsletter_description?: string;
    footer_show_contact?: boolean;
    footer_show_address?: boolean;
    footer_address?: string;
    footer_show_phone?: boolean;
    footer_phone?: string;
    footer_show_hours?: boolean;
    footer_hours?: string;
    footer_show_legal?: boolean;
    footer_legal_links?: FooterLegalLink[];
    footer_show_payments?: boolean;
    footer_payment_methods?: FooterPaymentMethod[];
    footer_copyright_text?: string;

    // Recursos Visuales de Marca
    logo_dark_url?: string;
    main_banner_url?: string;
    background_image_url?: string;
    background_pattern?: 'none' | 'dots' | 'grid' | 'mesh' | 'noise';
    promo_video_url?: string;

    // Paleta de Colores
    colors: ThemeColors;
}

export interface ThemePreset {
    id: ThemePresetId;
    name: string;
    tagline: string;
    description: string;
    category: string;
    preview_bg: string;
    preview_accent: string;
    tokens: ThemeTokens;
}

export interface FontOption {
    name: string;
    family: string;
    category: 'sans-serif' | 'serif' | 'display' | 'monospace';
    googleFontUrl?: string;
}


