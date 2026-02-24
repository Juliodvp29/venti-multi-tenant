export type SectionType = 'hero' | 'featured_categories' | 'about_us' | 'product_grid';

export interface SectionContentHero {
    title: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    backgroundColor?: string;
    buttonText?: string;
    buttonLink?: string;
    alignment: 'left' | 'center' | 'right';
    overlayOpacity?: number;
}

export interface SectionContentFeaturedCategories {
    title: string;
    description?: string;
    categoryIds: string[];
}

export interface SectionContentAboutUs {
    title: string;
    content: string;
    imageUrl?: string;
    imagePosition: 'left' | 'right';
}

export interface SectionContentProductGrid {
    title: string;
    description?: string;
    limit: number;
}

export interface StorefrontSection {
    id: string;
    type: SectionType;
    isActive: boolean;
    content: SectionContentHero | SectionContentFeaturedCategories | SectionContentAboutUs | SectionContentProductGrid;
}

export interface StorefrontLayout {
    sections: StorefrontSection[];
}
