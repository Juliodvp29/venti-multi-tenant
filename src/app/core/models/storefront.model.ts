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

export interface StorefrontLayout {
    sections: StorefrontSection[];
    navigation?: NavigationLink[];
}
