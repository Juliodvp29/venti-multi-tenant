import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

export interface OrganizationSchema {
    name: string;
    url: string;
    logo?: string;
    description?: string;
    contactPoint?: {
        telephone: string;
        contactType: string;
        email?: string;
    };
}

export interface ProductSchema {
    name: string;
    description: string;
    image: string;
    sku?: string;
    brand?: string;
    offers: {
        price: number;
        priceCurrency: string;
        availability: string;
    };
}

@Injectable({
    providedIn: 'root',
})
export class StructuredDataService {
    private readonly document = inject(DOCUMENT);
    private readonly renderer: Renderer2;

    constructor(rendererFactory: RendererFactory2) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    /**
     * Add Organization structured data
     */
    addOrganization(data: OrganizationSchema): void {
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: data.name,
            url: data.url,
            ...(data.logo && { logo: data.logo }),
            ...(data.description && { description: data.description }),
            ...(data.contactPoint && {
                contactPoint: {
                    '@type': 'ContactPoint',
                    ...data.contactPoint,
                }
            }),
        };

        this.insertSchema('organization-schema', schema);
    }

    /**
     * Add WebSite structured data
     */
    addWebSite(name: string, url: string, searchUrl?: string): void {
        const schema: any = {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name,
            url,
        };

        if (searchUrl) {
            schema.potentialAction = {
                '@type': 'SearchAction',
                target: `${searchUrl}?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
            };
        }

        this.insertSchema('website-schema', schema);
    }

    /**
     * Add Product structured data
     */
    addProduct(data: ProductSchema): void {
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: data.name,
            description: data.description,
            image: data.image,
            ...(data.sku && { sku: data.sku }),
            ...(data.brand && { brand: { '@type': 'Brand', name: data.brand } }),
            offers: {
                '@type': 'Offer',
                price: data.offers.price,
                priceCurrency: data.offers.priceCurrency,
                availability: `https://schema.org/${data.offers.availability}`,
            },
        };

        this.insertSchema('product-schema', schema);
    }

    /**
     * Add BreadcrumbList structured data
     */
    addBreadcrumb(items: Array<{ name: string; url: string }>): void {
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

        this.insertSchema('breadcrumb-schema', schema);
    }

    /**
     * Insert or update a JSON-LD schema script
     */
    private insertSchema(id: string, schema: any): void {
        // Remove existing schema with same ID
        this.removeSchema(id);

        // Create new script element
        const script = this.renderer.createElement('script');
        this.renderer.setAttribute(script, 'id', id);
        this.renderer.setAttribute(script, 'type', 'application/ld+json');
        this.renderer.setProperty(script, 'textContent', JSON.stringify(schema));
        this.renderer.appendChild(this.document.head, script);
    }

    /**
     * Remove a schema by ID
     */
    removeSchema(id: string): void {
        const existingScript = this.document.getElementById(id);
        if (existingScript) {
            this.renderer.removeChild(this.document.head, existingScript);
        }
    }

    /**
     * Remove all schemas
     */
    clearAll(): void {
        const scripts = this.document.querySelectorAll('script[type="application/ld+json"]');
        scripts.forEach((script) => {
            this.renderer.removeChild(this.document.head, script);
        });
    }
}
