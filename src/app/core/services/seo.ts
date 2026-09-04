import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
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
    /** Override the site name showed in og:site_name and title separator */
    siteName?: string;
    /** BCP 47 locale, e.g. 'es_MX'. Defaults to 'en_US' */
    locale?: string;
    /** For articles: ISO date string */
    publishedTime?: string;
    /** Twitter handle e.g. '@mystore' */
    twitterHandle?: string;
    robots?: string;
}

export interface ProductSeoData {
    name: string;
    description?: string;
    image?: string;
    price: number;
    currency?: string;
    sku?: string;
    brand?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    url?: string;
    category?: string;
}

export interface OrganizationSeoData {
    name: string;
    url?: string;
    logo?: string;
    sameAs?: string[]; // Social profile URLs
}

export interface BreadcrumbItem {
    name: string;
    url: string;
}

@Injectable({
    providedIn: 'root',
})
export class SeoService {
    private readonly meta = inject(Meta);
    private readonly titleService = inject(Title);
    private readonly router = inject(Router);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly document = inject(DOCUMENT);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    private readonly defaultSiteName = 'Venti Shop';
    private readonly defaultLocale = 'en_US';

    private readonly defaultConfig: Partial<SeoConfig> = {
        title: 'Venti Shop - Multi-Tenant Ecommerce Platform',
        description: 'Modern multi-tenant ecommerce platform built with Angular and Supabase',
        type: 'website',
        locale: this.defaultLocale,
    };

    // ── Core tag update ──────────────────────────────────────

    /**
     * Update all SEO tags for the current page.
     * Title is formatted as "Page Title | Site Name".
     */
    updateTags(config: Partial<SeoConfig>): void {
        const c = { ...this.defaultConfig, ...config };
        const siteName = c.siteName ?? this.defaultSiteName;
        const pageTitle = c.title ?? siteName;
        // Format: "Page | Site" — avoid duplication if same string
        const fullTitle = pageTitle === siteName ? pageTitle : `${pageTitle} | ${siteName}`;
        const currentUrl = c.url ?? this.getCurrentUrl();

        // ── Basic ──────────────────────────────────────────────
        this.titleService.setTitle(fullTitle);
        if (c.description) this.setName('description', c.description);
        if (c.keywords?.length) this.setName('keywords', c.keywords.join(', '));
        if (c.author) this.setName('author', c.author);

        // ── Robots (ensure indexable) ──────────────────────────
        this.setName('robots', c.robots ?? 'index, follow');

        // ── Canonical ──────────────────────────────────────────
        this.setLinkTag('canonical', c.url ?? currentUrl);

        // ── Open Graph ────────────────────────────────────────
        this.setProp('og:site_name', siteName);
        this.setProp('og:locale', c.locale ?? this.defaultLocale);
        this.setProp('og:title', fullTitle);
        this.setProp('og:description', c.description ?? '');
        this.setProp('og:type', c.type ?? 'website');
        this.setProp('og:url', c.url ?? currentUrl);
        if (c.image) {
            this.setProp('og:image', c.image);
            this.setProp('og:image:alt', pageTitle);
            this.setProp('og:image:width', '1200');
            this.setProp('og:image:height', '630');
        } else {
            this.removeProp('og:image');
            this.removeProp('og:image:alt');
            this.removeProp('og:image:width');
            this.removeProp('og:image:height');
        }
        if (c.type === 'article' && c.publishedTime) {
            this.setProp('article:published_time', c.publishedTime);
            if (c.author) this.setProp('article:author', c.author);
        }

        // ── Twitter / X Card ──────────────────────────────────
        this.setName('twitter:card', c.image ? 'summary_large_image' : 'summary');
        this.setName('twitter:title', fullTitle);
        this.setName('twitter:description', c.description ?? '');
        if (c.image) this.setName('twitter:image', c.image);
        else this.meta.removeTag('name="twitter:image"');
        if (c.twitterHandle) this.setName('twitter:site', c.twitterHandle);
    }

    /**
     * Dynamically update browser tab favicon.
     */
    updateFavicon(url: string | null): void {
        if (!url) return;
        let iconLink = this.document.querySelector<HTMLLinkElement>("link[rel*='icon']");
        if (!iconLink) {
            iconLink = this.document.createElement('link');
            iconLink.rel = 'shortcut icon';
            this.document.head.appendChild(iconLink);
        }
        iconLink.href = url;
    }

    // ── JSON-LD Structured Data ──────────────────────────────

    /**
     * Inject a Product schema for rich results (price, availability, etc.)
     */
    setProductSchema(data: ProductSeoData): void {
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: data.name,
            description: data.description,
            image: data.image,
            sku: data.sku,
            brand: data.brand ? { '@type': 'Brand', name: data.brand } : undefined,
            category: data.category,
            url: data.url ?? this.getCurrentUrl(),
            offers: {
                '@type': 'Offer',
                price: data.price,
                priceCurrency: data.currency ?? 'USD',
                availability: `https://schema.org/${data.availability ?? 'InStock'}`,
                url: data.url ?? this.getCurrentUrl(),
            },
        };
        this.injectJsonLd('product-schema', schema);
    }

    /**
     * Inject an Organization schema for the homepage / about page.
     */
    setOrganizationSchema(data: OrganizationSeoData): void {
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: data.name,
            url: data.url ?? this.getCurrentUrl(),
            logo: data.logo
                ? { '@type': 'ImageObject', url: data.logo }
                : undefined,
            sameAs: data.sameAs,
        };
        this.injectJsonLd('organization-schema', schema);
    }

    /**
     * Inject a BreadcrumbList schema.
     */
    setBreadcrumbSchema(items: BreadcrumbItem[]): void {
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.url,
            })),
        };
        this.injectJsonLd('breadcrumb-schema', schema);
    }

    /**
     * Remove all JSON-LD scripts injected by this service.
     */
    clearSchemas(): void {
        this.document.querySelectorAll('script[data-seo]').forEach((el) => el.remove());
    }

    /**
     * Remove all dynamic SEO meta tags.
     */
    clearTags(): void {
        this.meta.removeTag('name="description"');
        this.meta.removeTag('name="keywords"');
        this.meta.removeTag('name="author"');
        this.meta.removeTag('name="robots"');
        this.meta.removeTag('property="og:title"');
        this.meta.removeTag('property="og:description"');
        this.meta.removeTag('property="og:type"');
        this.meta.removeTag('property="og:url"');
        this.meta.removeTag('property="og:image"');
        this.meta.removeTag('property="og:site_name"');
        this.meta.removeTag('property="og:locale"');
        this.meta.removeTag('name="twitter:card"');
        this.meta.removeTag('name="twitter:title"');
        this.meta.removeTag('name="twitter:description"');
        this.meta.removeTag('name="twitter:image"');
        this.meta.removeTag('name="twitter:site"');
    }

    // ── Private helpers ──────────────────────────────────────

    private setName(name: string, content: string): void {
        this.meta.updateTag({ name, content });
    }

    private setProp(property: string, content: string): void {
        this.meta.updateTag({ property, content });
    }

    private getCurrentUrl(): string {
        if (this.isBrowser) return `${window.location.origin}${this.router.url}`;
        return this.router.url || '/';
    }

    private removeProp(property: string): void {
        this.meta.removeTag(`property="${property}"`);
    }

    private setLinkTag(rel: string, href: string): void {
        let link = this.document.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', rel);
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', href);
    }

    private injectJsonLd(id: string, schema: Record<string, any>): void {
        // Remove previous version of this schema if exists
        this.document.querySelector(`script[data-seo="${id}"]`)?.remove();

        const script = this.document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo', id);
        script.textContent = JSON.stringify(schema, (_key, value) =>
            value === undefined ? undefined : value
        );
        this.document.head.appendChild(script);
    }
}
