export type SectionType =
    | 'hero'
    | 'promo_banner'
    | 'product_grid'
    | 'featured_categories'
    | 'offers'
    | 'testimonials'
    | 'reviews'
    | 'about_us'
    | 'image_gallery'
    | 'newsletter'
    | 'faq'
    | 'benefits'
    | 'brand_logos'
    | 'countdown'
    | 'social_feed'
    | 'map_location';

export type SpacingSizeOption = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type ContainerWidthOption = 'full' | 'boxed' | 'narrow';

export interface SectionUniversalStyles {
    paddingTop?: SpacingSizeOption;
    paddingBottom?: SpacingSizeOption;
    backgroundColor?: string;
    textColor?: string;
    titleColor?: string;
    backgroundImageUrl?: string;
    backgroundVideoUrl?: string;
    overlayOpacity?: number; // 0 to 100
    containerWidth?: ContainerWidthOption;
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
}

// 1. Hero
export interface SectionContentHero {
    title: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    backgroundVideoUrl?: string;
    backgroundColor?: string;
    buttonText?: string;
    buttonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    alignment: 'left' | 'center' | 'right';
    overlayOpacity?: number;
    overlayColor?: string;
    badgeText?: string;
    height?: 'compact' | 'medium' | 'tall' | 'full';
    textSize?: 'compact' | 'normal' | 'large' | 'display';
    compositionStyle?: 'full-banner' | 'split' | 'card-overlay' | 'minimal-centered';
    splitImagePosition?: 'left' | 'right';
    splitImageUrl?: string;
    animation?: 'none' | 'fade-in' | 'slide-up' | 'zoom-in';
}

// 2. Promo Banner
export interface SectionContentPromoBanner {
    badge?: string;
    title: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    discountPercent?: string;
    backgroundColor?: string;
    textColor?: string;
}

// 3. Product Grid
export interface SectionContentProductGrid {
    title: string;
    description?: string;
    limit: number;
    columns?: 2 | 3 | 4;
    showViewAll?: boolean;
    viewAllLink?: string;
}

// 4. Featured Categories
export interface CategoryItem {
    id?: string;
    name: string;
    icon?: string;
    imageUrl?: string;
    link?: string;
}
export interface SectionContentFeaturedCategories {
    title: string;
    description?: string;
    categoryIds?: string[];
    categories?: CategoryItem[];
}

// 5. Offers / Flash Sale
export interface SectionContentOffers {
    badge?: string;
    title: string;
    description?: string;
    discountBadge?: string;
    targetDate?: string;
    buttonText?: string;
    buttonLink?: string;
    imageUrl?: string;
}

// 6. Testimonials
export interface TestimonialItem {
    id: string;
    name: string;
    role?: string;
    avatarUrl?: string;
    content: string;
    rating: number;
}
export interface SectionContentTestimonials {
    title: string;
    subtitle?: string;
    items: TestimonialItem[];
}

// 7. Reviews
export interface ReviewItem {
    id: string;
    author: string;
    date?: string;
    rating: number;
    title?: string;
    comment: string;
    verified?: boolean;
}
export interface SectionContentReviews {
    title: string;
    subtitle?: string;
    overallRating: number;
    totalReviews: number;
    items: ReviewItem[];
}

// 8. About Us
export interface SectionContentAboutUs {
    badge?: string;
    title: string;
    content: string;
    imageUrl?: string;
    imagePosition: 'left' | 'right';
    buttonText?: string;
    buttonLink?: string;
    stats?: { label: string; value: string }[];
}

// 9. Image Gallery
export interface GalleryItem {
    id: string;
    imageUrl: string;
    caption?: string;
    link?: string;
}
export interface SectionContentImageGallery {
    title?: string;
    subtitle?: string;
    columns?: 2 | 3 | 4;
    items: GalleryItem[];
}

// 10. Newsletter
export interface SectionContentNewsletter {
    badge?: string;
    title: string;
    description?: string;
    placeholderText?: string;
    buttonText?: string;
    disclaimer?: string;
    successMessage?: string;
}

// 11. FAQ
export interface FaqItem {
    id: string;
    question: string;
    answer: string;
}
export interface SectionContentFaq {
    title: string;
    subtitle?: string;
    items: FaqItem[];
}

// 12. Benefits
export interface BenefitItem {
    id: string;
    icon: string;
    title: string;
    description: string;
}
export interface SectionContentBenefits {
    title?: string;
    items: BenefitItem[];
}

// 13. Brand Logos
export interface BrandLogoItem {
    id: string;
    name: string;
    logoUrl?: string;
    link?: string;
}
export interface SectionContentBrandLogos {
    title?: string;
    items: BrandLogoItem[];
}

// 14. Countdown
export interface SectionContentCountdown {
    badge?: string;
    title: string;
    description?: string;
    targetDate: string;
    buttonText?: string;
    buttonLink?: string;
}

// 15. Social Feed
export interface SocialPostItem {
    id: string;
    imageUrl: string;
    likes?: number;
    link?: string;
}
export interface SectionContentSocialFeed {
    title: string;
    handle: string;
    subtitle?: string;
    followButtonText?: string;
    profileUrl?: string;
    items: SocialPostItem[];
}

// 16. Map & Location
export interface SectionContentMapLocation {
    title: string;
    address: string;
    cityState?: string;
    phone?: string;
    email?: string;
    hours?: string;
    googleMapsUrl?: string;
    embedMapUrl?: string;
}

export type SectionContent =
    | SectionContentHero
    | SectionContentPromoBanner
    | SectionContentProductGrid
    | SectionContentFeaturedCategories
    | SectionContentOffers
    | SectionContentTestimonials
    | SectionContentReviews
    | SectionContentAboutUs
    | SectionContentImageGallery
    | SectionContentNewsletter
    | SectionContentFaq
    | SectionContentBenefits
    | SectionContentBrandLogos
    | SectionContentCountdown
    | SectionContentSocialFeed
    | SectionContentMapLocation;

export interface StorefrontSection {
    id: string;
    type: SectionType;
    isActive: boolean;
    titleCustom?: string;
    styles?: SectionUniversalStyles;
    content: any;
}

export interface NavigationLink {
    label: string;
    url: string;
    isExternal?: boolean;
}

export type StorePageId =
    | 'home'
    | 'catalog'
    | 'product_detail'
    | 'cart'
    | 'checkout'
    | 'contact'
    | 'about';

export type PageHeaderStyle = 'default' | 'transparent' | 'minimal' | 'hidden';
export type PageFooterStyle = 'default' | 'compact' | 'hidden';

export interface PageStylesConfig {
    backgroundColor?: string;
    backgroundImageUrl?: string;
    headerStyle?: PageHeaderStyle;
    footerStyle?: PageFooterStyle;
    fontHeading?: string;
    fontBody?: string;
    paddingTop?: SpacingSizeOption;
    paddingBottom?: SpacingSizeOption;
    containerWidth?: ContainerWidthOption;
}

export interface PageLayoutConfig {
    pageId: StorePageId;
    title: string;
    isEnabled: boolean;
    styles: PageStylesConfig;
    sections: StorefrontSection[];
}

export interface StorefrontLayout {
    sections: StorefrontSection[];
    navigation?: NavigationLink[];
    pages?: Partial<Record<StorePageId, PageLayoutConfig>>;
}

export const DEFAULT_PAGE_LAYOUTS: Record<StorePageId, PageLayoutConfig> = {
    home: {
        pageId: 'home',
        title: 'Página de Inicio',
        isEnabled: true,
        styles: {
            headerStyle: 'default',
            footerStyle: 'default',
            containerWidth: 'boxed',
            paddingTop: 'none',
            paddingBottom: 'lg',
        },
        sections: [],
    },
    catalog: {
        pageId: 'catalog',
        title: 'Catálogo de Productos',
        isEnabled: true,
        styles: {
            headerStyle: 'default',
            footerStyle: 'default',
            containerWidth: 'boxed',
            paddingTop: 'md',
            paddingBottom: 'xl',
        },
        sections: [
            {
                id: 'catalog-promo',
                type: 'promo_banner',
                isActive: true,
                content: {
                    badge: 'Temporada',
                    title: 'Explora nuestra colección exclusiva',
                    subtitle: 'Encuentra las mejores ofertas y productos con envíos garantizados.',
                },
            },
        ],
    },
    product_detail: {
        pageId: 'product_detail',
        title: 'Detalle de Producto',
        isEnabled: true,
        styles: {
            headerStyle: 'default',
            footerStyle: 'default',
            containerWidth: 'boxed',
            paddingTop: 'md',
            paddingBottom: 'xl',
        },
        sections: [
            {
                id: 'product-benefits',
                type: 'benefits',
                isActive: true,
                content: {
                    title: 'Garantía y Confianza en tu Compra',
                    items: [
                        { id: '1', icon: '🚚', title: 'Envío Rápido', description: 'Entregas a todo el país en 24 a 48 horas.' },
                        { id: '2', icon: '🔒', title: 'Pago Seguro', description: 'Tus transacciones están 100% protegidas y encriptadas.' },
                        { id: '3', icon: '🔄', title: 'Garantía de Devolución', description: '30 días de satisfacción o reembolso directo.' },
                    ],
                },
            },
        ],
    },
    cart: {
        pageId: 'cart',
        title: 'Carrito de Compras',
        isEnabled: true,
        styles: {
            headerStyle: 'default',
            footerStyle: 'default',
            containerWidth: 'boxed',
            paddingTop: 'lg',
            paddingBottom: 'xl',
        },
        sections: [
            {
                id: 'cart-benefits',
                type: 'benefits',
                isActive: true,
                content: {
                    title: 'Beneficios de Comprar con Nosotros',
                    items: [
                        { id: '1', icon: '⚡', title: 'Despacho Inmediato', description: 'Procesamiento en menos de 24 horas.' },
                        { id: '2', icon: '🛡️', title: 'Compra Protegida', description: 'Garantía extendida en todos los productos.' },
                    ],
                },
            },
        ],
    },
    checkout: {
        pageId: 'checkout',
        title: 'Pasarela de Pago / Checkout',
        isEnabled: true,
        styles: {
            headerStyle: 'minimal',
            footerStyle: 'compact',
            containerWidth: 'boxed',
            paddingTop: 'md',
            paddingBottom: 'lg',
        },
        sections: [],
    },
    contact: {
        pageId: 'contact',
        title: 'Contacto y Ubicación',
        isEnabled: true,
        styles: {
            headerStyle: 'default',
            footerStyle: 'default',
            containerWidth: 'boxed',
            paddingTop: 'lg',
            paddingBottom: 'xl',
        },
        sections: [
            {
                id: 'contact-map',
                type: 'map_location',
                isActive: true,
                content: {
                    title: 'Encuéntranos o Escríbenos',
                    address: 'Av. Principal #123, Centro Comercial',
                    cityState: 'Ciudad Comercial, País',
                    phone: '+1 (555) 123-4567',
                    email: 'contacto@mitienda.com',
                    hours: 'Lunes a Sábado: 9:00 AM - 8:00 PM',
                },
            },
            {
                id: 'contact-faq',
                type: 'faq',
                isActive: true,
                content: {
                    title: 'Preguntas Frecuentes',
                    subtitle: 'Resolvemos tus dudas más habituales sobre pedidos y envíos',
                    items: [
                        { id: '1', question: '¿Cómo realizo un seguimiento de mi pedido?', answer: 'Te enviaremos un número de guía a tu correo electrónico al despachar tu compra.' },
                        { id: '2', question: '¿Qué métodos de pago aceptan?', answer: 'Aceptamos tarjetas de crédito/débito, transferencias bancarias y pago contra entrega según tu ubicación.' },
                    ],
                },
            },
        ],
    },
    about: {
        pageId: 'about',
        title: 'Sobre Nosotros',
        isEnabled: true,
        styles: {
            headerStyle: 'default',
            footerStyle: 'default',
            containerWidth: 'boxed',
            paddingTop: 'lg',
            paddingBottom: 'xl',
        },
        sections: [
            {
                id: 'about-main',
                type: 'about_us',
                isActive: true,
                content: {
                    badge: 'Nuestra Historia',
                    title: 'Pasión por la calidad y el diseño excepcional',
                    content: 'Nacimos con la misión de ofrecer productos auténticos y duraderos. Cada detalle de nuestra tienda está pensado para brindarte la mejor experiencia.',
                    imagePosition: 'right',
                    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800',
                    stats: [
                        { label: 'Clientes Felices', value: '+10,000' },
                        { label: 'Años de Experiencia', value: '5+' },
                        { label: 'Productos Únicos', value: '+200' },
                    ],
                },
            },
            {
                id: 'about-testimonials',
                type: 'testimonials',
                isActive: true,
                content: {
                    title: 'Lo que dicen nuestros clientes',
                    subtitle: 'Historias reales de personas que confían en nosotros',
                    items: [
                        { id: '1', name: 'Laura Gómez', role: 'Cliente Frecuente', content: 'Excelente atención y los productos llegaron antes de lo esperado en perfecto estado.', rating: 5 },
                        { id: '2', name: 'Carlos Ruiz', role: 'Diseñador', content: 'Calidad superior en cada detalle. Totalmente recomendados.', rating: 5 },
                    ],
                },
            },
        ],
    },
};

export function getDefaultPageLayout(pageId: StorePageId, homeSections?: StorefrontSection[]): PageLayoutConfig {
    const base = DEFAULT_PAGE_LAYOUTS[pageId] || DEFAULT_PAGE_LAYOUTS.home;
    if (pageId === 'home' && homeSections && homeSections.length > 0) {
        return {
            ...base,
            sections: homeSections,
        };
    }
    return structuredClone(base);
}
