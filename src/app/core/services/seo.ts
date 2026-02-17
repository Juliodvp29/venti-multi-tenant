import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

export interface SeoConfig {
    title: string;
    description: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
    author?: string;
}

@Injectable({
    providedIn: 'root',
})
export class SeoService {
    private readonly meta = inject(Meta);
    private readonly title = inject(Title);
    private readonly router = inject(Router);

    private readonly defaultConfig: Partial<SeoConfig> = {
        title: 'Venti - Plataforma Multi-Tenant de Ecommerce',
        description: 'Plataforma moderna de ecommerce multi-tenant construida con Angular y Supabase',
        type: 'website',
    };

    /**
     * Update all SEO tags for the current page
     */
    updateTags(config: Partial<SeoConfig>): void {
        const seoConfig = { ...this.defaultConfig, ...config };
        const fullTitle = seoConfig.title || this.defaultConfig.title!;
        const currentUrl = `${window.location.origin}${this.router.url}`;

        // Basic meta tags
        this.title.setTitle(fullTitle);
        this.updateTag('description', seoConfig.description!);

        if (seoConfig.keywords && seoConfig.keywords.length > 0) {
            this.updateTag('keywords', seoConfig.keywords.join(', '));
        }

        if (seoConfig.author) {
            this.updateTag('author', seoConfig.author);
        }

        // Canonical URL
        this.updateLinkTag('canonical', seoConfig.url || currentUrl);

        // Open Graph tags (Facebook, LinkedIn)
        this.updateMetaProperty('og:title', fullTitle);
        this.updateMetaProperty('og:description', seoConfig.description!);
        this.updateMetaProperty('og:type', seoConfig.type || 'website');
        this.updateMetaProperty('og:url', seoConfig.url || currentUrl);

        if (seoConfig.image) {
            this.updateMetaProperty('og:image', seoConfig.image);
            this.updateMetaProperty('og:image:alt', fullTitle);
        }

        // Twitter Card tags
        this.updateTag('twitter:card', 'summary_large_image');
        this.updateTag('twitter:title', fullTitle);
        this.updateTag('twitter:description', seoConfig.description!);

        if (seoConfig.image) {
            this.updateTag('twitter:image', seoConfig.image);
        }
    }

    /**
     * Update a standard meta tag
     */
    private updateTag(name: string, content: string): void {
        this.meta.updateTag({ name, content });
    }

    /**
     * Update an Open Graph meta property
     */
    private updateMetaProperty(property: string, content: string): void {
        this.meta.updateTag({ property, content });
    }

    /**
     * Update a link tag (e.g., canonical)
     */
    private updateLinkTag(rel: string, href: string): void {
        let link: HTMLLinkElement | null = document.querySelector(`link[rel='${rel}']`);

        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', rel);
            document.head.appendChild(link);
        }

        link.setAttribute('href', href);
    }

    /**
     * Remove all dynamic SEO tags
     */
    clearTags(): void {
        this.meta.removeTag('name="description"');
        this.meta.removeTag('name="keywords"');
        this.meta.removeTag('name="author"');
        this.meta.removeTag('property="og:title"');
        this.meta.removeTag('property="og:description"');
        this.meta.removeTag('property="og:type"');
        this.meta.removeTag('property="og:url"');
        this.meta.removeTag('property="og:image"');
        this.meta.removeTag('name="twitter:card"');
        this.meta.removeTag('name="twitter:title"');
        this.meta.removeTag('name="twitter:description"');
        this.meta.removeTag('name="twitter:image"');
    }
}
