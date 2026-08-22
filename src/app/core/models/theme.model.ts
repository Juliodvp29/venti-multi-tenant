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
export type HeaderStyleOption = 'minimal' | 'classic' | 'centered' | 'floating' | 'bold';
export type HeroStyleOption = 'centered' | 'split' | 'left' | 'minimal' | 'full';

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
    font_size_scale: 'compact' | 'normal' | 'spacious';

    // Bordes y Radios
    border_radius: BorderRadiusOption;
    border_radius_card: BorderRadiusOption;
    border_radius_button: BorderRadiusOption;
    border_radius_badge: BorderRadiusOption;
    border_width: BorderWidthOption;

    // Sombras
    shadow_style: ShadowStyleOption;

    // Botones
    button_shape: ButtonShapeOption;
    button_style: ButtonStyleOption;
    button_transform: 'none' | 'uppercase';

    // Tarjetas de Producto
    card_style: CardStyleOption;
    card_image_aspect: '1/1' | '4/5' | '3/4' | '16/9';

    // Header y Hero Banner
    header_style: HeaderStyleOption;
    hero_style: HeroStyleOption;

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
