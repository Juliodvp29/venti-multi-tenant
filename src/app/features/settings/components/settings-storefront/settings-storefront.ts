import { ChangeDetectionStrategy, Component, inject, signal, computed, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import {
    StorefrontLayout,
    StorefrontSection,
    SectionType,
    SectionUniversalStyles,
    SpacingSizeOption,
    ContainerWidthOption,
    StorePageId,
    PageLayoutConfig,
    PageStylesConfig,
    PageHeaderStyle,
    PageFooterStyle,
    DEFAULT_PAGE_LAYOUTS,
    getDefaultPageLayout
} from '@core/models';
import { ToastService } from '@core/services/toast';
import { StorageService } from '@core/services/storage';

export interface SectionMeta {
    type: SectionType;
    name: string;
    description: string;
    icon: string;
    category: 'Hero & Cabecera' | 'Catálogo & Ventas' | 'Confianza & Marca' | 'Contenido & Contacto';
}

export interface PageMeta {
    id: StorePageId;
    label: string;
    icon: string;
    description: string;
    path: string;
}

@Component({
    selector: 'app-settings-storefront',
    imports: [CommonModule, FormsModule],
    templateUrl: './settings-storefront.html',
    styleUrl: './settings-storefront.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsStorefront {
    asAny(val: any): any { return val; }
    private readonly tenantService = inject(TenantService);
    private readonly toast = inject(ToastService);
    private readonly storage = inject(StorageService);

    readonly layoutChange = output<StorefrontLayout>();
    readonly dirtyChange = output<boolean>();

    readonly layout = signal<StorefrontLayout>(this.tenantService.storefrontLayout());
    readonly savedLayout = signal<StorefrontLayout>(structuredClone(this.tenantService.storefrontLayout()));
    readonly isSaving = signal(false);
    readonly selectedSectionId = signal<string | null>(null);
    readonly activeSectionTab = signal<'content' | 'styles'>('content');
    readonly isAddModalOpen = signal(false);
    readonly addCategoryFilter = signal<string>('all');

    // Page Management Signals
    readonly activePageId = signal<StorePageId>('home');
    readonly activePageTab = signal<'sections' | 'styles'>('sections');

    readonly pagesList: PageMeta[] = [
        { id: 'home', label: 'Inicio', icon: '🏠', description: 'Página principal de tu tienda', path: '/store' },
        { id: 'catalog', label: 'Catálogo', icon: '📦', description: 'Explorador y grilla de productos', path: '/store/productos' },
        { id: 'product_detail', label: 'Detalle Producto', icon: '🔍', description: 'Ficha individual del producto', path: '/store/product/:id' },
        { id: 'cart', label: 'Carrito', icon: '🛒', description: 'Página y resumen del carrito', path: '/store/carrito' },
        { id: 'checkout', label: 'Checkout', icon: '💳', description: 'Pasarela de pago y finalización', path: '/store/checkout' },
        { id: 'contact', label: 'Contacto', icon: '✉️', description: 'Formulario, mapa y atención', path: '/store/contacto' },
        { id: 'about', label: 'Sobre Nosotros', icon: '👥', description: 'Historia, misión y testimonios', path: '/store/nosotros' },
    ];

    readonly activePageMeta = computed(() =>
        this.pagesList.find(p => p.id === this.activePageId()) || this.pagesList[0]
    );

    readonly activePageConfig = computed<PageLayoutConfig>(() => {
        const pageId = this.activePageId();
        const pages = this.layout().pages;
        if (pages && pages[pageId]) {
            return pages[pageId]!;
        }
        return getDefaultPageLayout(pageId, this.layout().sections);
    });

    readonly activeSections = computed<StorefrontSection[]>(() =>
        this.activePageConfig()?.sections || []
    );

    readonly selectedSection = computed(() => {
        const id = this.selectedSectionId();
        if (!id) return null;
        return this.activeSections().find(s => s.id === id) || null;
    });

    readonly pageHeaderStyleOptions: { label: string; value: PageHeaderStyle; description: string }[] = [
        { label: 'Estándar', value: 'default', description: 'Barra de navegación completa de la tienda' },
        { label: 'Transparente', value: 'transparent', description: 'Fondo transparente flotante sobre el banner' },
        { label: 'Minimalista', value: 'minimal', description: 'Solo logo y enlace de retorno' },
        { label: 'Ocultar Cabecera', value: 'hidden', description: 'Sin barra superior' },
    ];

    readonly pageFooterStyleOptions: { label: string; value: PageFooterStyle; description: string }[] = [
        { label: 'Estándar', value: 'default', description: 'Pie de página completo con redes y datos' },
        { label: 'Compacto', value: 'compact', description: 'Pie de página simplificado con copyright' },
        { label: 'Ocultar Pie de Página', value: 'hidden', description: 'Sin pie de página' },
    ];

    readonly sectionCatalog: SectionMeta[] = [
        // Hero & Cabecera
        {
            type: 'hero',
            name: 'Hero Principal',
            description: 'Banner principal de gran impacto visual con botones de acción e imagen o video de fondo.',
            icon: '🚩',
            category: 'Hero & Cabecera'
        },
        {
            type: 'promo_banner',
            name: 'Banner Promocional',
            description: 'Franja destacada para anuncios de temporada, rebajas o mensajes llamativos.',
            icon: '📣',
            category: 'Hero & Cabecera'
        },
        {
            type: 'countdown',
            name: 'Contador Promocional',
            description: 'Temporizador de cuenta regresiva para generar urgencia en lanzamientos o ventas especiales.',
            icon: '⏳',
            category: 'Hero & Cabecera'
        },

        // Catálogo & Ventas
        {
            type: 'product_grid',
            name: 'Productos Destacados',
            description: 'Cuadrícula con los productos más populares o destacados de la tienda.',
            icon: '📦',
            category: 'Catálogo & Ventas'
        },
        {
            type: 'featured_categories',
            name: 'Categorías Destacadas',
            description: 'Acceso directo a colecciones o categorías clave para facilitar la navegación.',
            icon: '📂',
            category: 'Catálogo & Ventas'
        },
        {
            type: 'offers',
            name: 'Ofertas Flash',
            description: 'Bloque dinámico de promociones con badge de descuento y botón de compra rápida.',
            icon: '⚡',
            category: 'Catálogo & Ventas'
        },

        // Confianza & Marca
        {
            type: 'testimonials',
            name: 'Testimonios',
            description: 'Citas y recomendaciones de clientes satisfechos.',
            icon: '💬',
            category: 'Confianza & Marca'
        },
        {
            type: 'reviews',
            name: 'Reseñas & Puntuación',
            description: 'Puntuación global y comentarios verificados de compradores.',
            icon: '⭐',
            category: 'Confianza & Marca'
        },
        {
            type: 'benefits',
            name: 'Beneficios de la Tienda',
            description: 'Tarjetas destacando envíos gratis, pagos seguros, soporte 24/7 y garantías.',
            icon: '🛡️',
            category: 'Confianza & Marca'
        },
        {
            type: 'brand_logos',
            name: 'Logos de Marcas',
            description: 'Muestra los logos de las marcas o aliados comerciales con los que trabajas.',
            icon: '🏢',
            category: 'Confianza & Marca'
        },

        // Contenido & Contacto
        {
            type: 'about_us',
            name: 'Sobre Nosotros',
            description: 'Historia de la marca, foto institucional y estadísticas de la empresa.',
            icon: '📖',
            category: 'Contenido & Contacto'
        },
        {
            type: 'image_gallery',
            name: 'Galería de Imágenes',
            description: 'Muro visual o lookbook con fotografías de alta calidad.',
            icon: '🖼️',
            category: 'Contenido & Contacto'
        },
        {
            type: 'newsletter',
            name: 'Suscripción Newsletter',
            description: 'Caja de captura de correos para construir tu base de clientes.',
            icon: '📧',
            category: 'Contenido & Contacto'
        },
        {
            type: 'faq',
            name: 'Preguntas Frecuentes',
            description: 'Acordeón con respuestas a las dudas más comunes de tus compradores.',
            icon: '❓',
            category: 'Contenido & Contacto'
        },
        {
            type: 'social_feed',
            name: 'Feed de Redes Sociales',
            description: 'Publicaciones simuladas de Instagram con botón de seguir perfil.',
            icon: '📸',
            category: 'Contenido & Contacto'
        },
        {
            type: 'map_location',
            name: 'Mapa & Ubicación',
            description: 'Dirección física, mapa interactivo, horarios y teléfonos de atención.',
            icon: '📍',
            category: 'Contenido & Contacto'
        }
    ];

    readonly catalogCategories = [
        'all',
        'Hero & Cabecera',
        'Catálogo & Ventas',
        'Confianza & Marca',
        'Contenido & Contacto'
    ];

    readonly filteredCatalog = computed(() => {
        const cat = this.addCategoryFilter();
        if (cat === 'all') return this.sectionCatalog;
        return this.sectionCatalog.filter(s => s.category === cat);
    });

    readonly spacingOptions: { label: string; value: SpacingSizeOption }[] = [
        { label: 'Ninguno (0)', value: 'none' },
        { label: 'Pequeño (1.5rem)', value: 'sm' },
        { label: 'Medio (3rem)', value: 'md' },
        { label: 'Grande (5rem)', value: 'lg' },
        { label: 'Extra Grande (7rem)', value: 'xl' }
    ];

    readonly containerWidthOptions: { label: string; value: ContainerWidthOption }[] = [
        { label: 'Estándar (1280px)', value: 'boxed' },
        { label: 'Estrecho Enfocado (896px)', value: 'narrow' },
        { label: 'Ancho Completo (100%)', value: 'full' }
    ];

    constructor() {
        effect(() => {
            this.layoutChange.emit(this.layout());
        });
    }

    switchPage(pageId: StorePageId) {
        this.activePageId.set(pageId);
        this.selectedSectionId.set(null);
    }

    updatePageStyle<K extends keyof PageStylesConfig>(key: K, value: PageStylesConfig[K]) {
        const pageId = this.activePageId();
        this.layout.update(l => {
            const pages = { ...(l.pages || {}) };
            const currentPage = pages[pageId] || getDefaultPageLayout(pageId, l.sections);
            
            pages[pageId] = {
                ...currentPage,
                styles: {
                    ...currentPage.styles,
                    [key]: value
                }
            };

            return {
                ...l,
                pages
            };
        });
        this.dirtyChange.emit(true);
    }

    togglePageEnabled(enabled: boolean) {
        const pageId = this.activePageId();
        this.layout.update(l => {
            const pages = { ...(l.pages || {}) };
            const currentPage = pages[pageId] || getDefaultPageLayout(pageId, l.sections);
            pages[pageId] = {
                ...currentPage,
                isEnabled: enabled
            };
            return { ...l, pages };
        });
        this.dirtyChange.emit(true);
    }

    private updateActivePageSections(updater: (sections: StorefrontSection[]) => StorefrontSection[]) {
        const pageId = this.activePageId();
        const currentSections = this.activeSections();
        const newSections = updater([...currentSections]);

        this.layout.update(l => {
            const pages = { ...(l.pages || {}) };
            const currentPage = pages[pageId] || getDefaultPageLayout(pageId, l.sections);
            
            pages[pageId] = {
                ...currentPage,
                sections: newSections
            };

            return {
                ...l,
                sections: pageId === 'home' ? newSections : l.sections,
                pages
            };
        });
        this.dirtyChange.emit(true);
    }

    addSection(type: SectionType) {
        const newSection: StorefrontSection = {
            id: crypto.randomUUID(),
            type: type,
            isActive: true,
            styles: {
                paddingTop: 'md',
                paddingBottom: 'md',
                containerWidth: 'boxed',
                hideOnMobile: false,
                hideOnDesktop: false
            },
            content: this.getDefaultContentForType(type)
        };

        this.updateActivePageSections(sections => [...sections, newSection]);
        this.selectedSectionId.set(newSection.id);
        this.isAddModalOpen.set(false);
        this.toast.success(`Sección "${this.getSectionName(type)}" agregada a ${this.activePageMeta().label}.`);
    }

    duplicateSection(id: string) {
        const sections = this.activeSections();
        const index = sections.findIndex(s => s.id === id);
        if (index === -1) return;

        const source = sections[index];
        const cloned: StorefrontSection = {
            ...structuredClone(source),
            id: crypto.randomUUID(),
            titleCustom: source.titleCustom ? `${source.titleCustom} (Copia)` : `${this.getSectionName(source.type)} (Copia)`
        };

        this.updateActivePageSections(list => {
            const copy = [...list];
            copy.splice(index + 1, 0, cloned);
            return copy;
        });

        this.selectedSectionId.set(cloned.id);
        this.toast.success('Sección duplicada correctamente.');
    }

    removeSection(id: string) {
        this.updateActivePageSections(list => list.filter(s => s.id !== id));
        if (this.selectedSectionId() === id) {
            this.selectedSectionId.set(null);
        }
        this.toast.info('Sección eliminada.');
    }

    toggleSectionActive(id: string) {
        this.updateActivePageSections(list =>
            list.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
        );
    }

    moveSection(id: string, direction: 'up' | 'down') {
        const sections = this.activeSections();
        const index = sections.findIndex(s => s.id === id);
        if (index === -1) return;

        this.updateActivePageSections(list => {
            const copy = [...list];
            if (direction === 'up' && index > 0) {
                [copy[index], copy[index - 1]] = [copy[index - 1], copy[index]];
            } else if (direction === 'down' && index < copy.length - 1) {
                [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
            }
            return copy;
        });
    }

    getSectionMeta(type: SectionType): SectionMeta | undefined {
        return this.sectionCatalog.find(s => s.type === type);
    }

    getSectionName(type: SectionType): string {
        return this.getSectionMeta(type)?.name || type.replace('_', ' ');
    }

    getSectionIcon(type: SectionType): string {
        return this.getSectionMeta(type)?.icon || '📄';
    }

    // Styles helpers
    ensureSectionStyles(section: StorefrontSection): SectionUniversalStyles {
        if (!section.styles) {
            section.styles = {
                paddingTop: 'md',
                paddingBottom: 'md',
                containerWidth: 'boxed',
                hideOnMobile: false,
                hideOnDesktop: false
            };
        }
        return section.styles;
    }

    // Navigation methods
    addNavigationLink() {
        const link = { label: 'Nuevo Enlace', url: '/store' };
        this.layout.update(l => ({
            ...l,
            navigation: [...(l.navigation || []), link]
        }));
        this.dirtyChange.emit(true);
    }

    removeNavigationLink(index: number) {
        this.layout.update(l => ({
            ...l,
            navigation: (l.navigation || []).filter((_, i) => i !== index)
        }));
        this.dirtyChange.emit(true);
    }

    moveNavigationLink(index: number, direction: 'up' | 'down') {
        const links = [...(this.layout().navigation || [])];
        if (direction === 'up' && index > 0) {
            [links[index], links[index - 1]] = [links[index - 1], links[index]];
        } else if (direction === 'down' && index < links.length - 1) {
            [links[index], links[index + 1]] = [links[index + 1], links[index]];
        }
        this.layout.update(l => ({ ...l, navigation: links }));
        this.dirtyChange.emit(true);
    }

    // Upload banner image
    async onHeroBannerUpload(event: Event, section: StorefrontSection) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return;

        try {
            const result = await this.storage.uploadImage('products', file, `tenants/${tenantId}/storefront`);
            section.content.backgroundImageUrl = result.url;
            this.forceLayoutUpdate();
            this.toast.success('Imagen subida correctamente');
        } catch (error) {
            console.error('Error uploading banner:', error);
            this.toast.error('Error al subir la imagen');
        }
    }

    async onHeroSplitImageUpload(event: Event, section: StorefrontSection) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return;

        try {
            const result = await this.storage.uploadImage('products', file, `tenants/${tenantId}/storefront`);
            section.content.splitImageUrl = result.url;
            this.forceLayoutUpdate();
            this.toast.success('Imagen de la composición subida correctamente');
        } catch (error) {
            console.error('Error uploading split image:', error);
            this.toast.error('Error al subir la imagen');
        }
    }

    async onSectionBgUpload(event: Event, section: StorefrontSection) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return;

        try {
            const result = await this.storage.uploadImage('products', file, `tenants/${tenantId}/storefront`);
            const styles = this.ensureSectionStyles(section);
            styles.backgroundImageUrl = result.url;
            this.forceLayoutUpdate();
            this.toast.success('Fondo de sección subido');
        } catch (error) {
            console.error('Error uploading image:', error);
            this.toast.error('Error al subir la imagen de fondo');
        }
    }

    removeSectionBg(section: StorefrontSection) {
        if (section.styles) {
            section.styles.backgroundImageUrl = undefined;
            this.forceLayoutUpdate();
        }
    }

    removeHeroBanner(section: StorefrontSection) {
        section.content.backgroundImageUrl = undefined;
        this.forceLayoutUpdate();
    }

    // Array Item Helpers
    addFaqItem(section: StorefrontSection) {
        if (!section.content.items) section.content.items = [];
        section.content.items.push({
            id: crypto.randomUUID(),
            question: '¿Nueva pregunta frecuente?',
            answer: 'Escribe aquí la respuesta detallada para tus clientes.'
        });
        this.forceLayoutUpdate();
    }

    removeFaqItem(section: StorefrontSection, index: number) {
        section.content.items.splice(index, 1);
        this.forceLayoutUpdate();
    }

    addBenefitItem(section: StorefrontSection) {
        if (!section.content.items) section.content.items = [];
        section.content.items.push({
            id: crypto.randomUUID(),
            icon: '🎁',
            title: 'Nuevo Beneficio',
            description: 'Descripción breve de la ventaja que ofreces.'
        });
        this.forceLayoutUpdate();
    }

    removeBenefitItem(section: StorefrontSection, index: number) {
        section.content.items.splice(index, 1);
        this.forceLayoutUpdate();
    }

    addTestimonialItem(section: StorefrontSection) {
        if (!section.content.items) section.content.items = [];
        section.content.items.push({
            id: crypto.randomUUID(),
            name: 'Nombre del Cliente',
            role: 'Cliente Verificado',
            content: 'Excelente experiencia de compra y servicio al cliente.',
            rating: 5,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
        });
        this.forceLayoutUpdate();
    }

    removeTestimonialItem(section: StorefrontSection, index: number) {
        section.content.items.splice(index, 1);
        this.forceLayoutUpdate();
    }

    addReviewItem(section: StorefrontSection) {
        if (!section.content.items) section.content.items = [];
        section.content.items.push({
            id: crypto.randomUUID(),
            author: 'Comprador Anónimo',
            date: 'Reciente',
            rating: 5,
            title: 'Muy satisfecho',
            comment: 'El producto llegó rápido y en perfectas condiciones.',
            verified: true
        });
        this.forceLayoutUpdate();
    }

    removeReviewItem(section: StorefrontSection, index: number) {
        section.content.items.splice(index, 1);
        this.forceLayoutUpdate();
    }

    addGalleryItem(section: StorefrontSection) {
        if (!section.content.items) section.content.items = [];
        section.content.items.push({
            id: crypto.randomUUID(),
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
            caption: 'Nueva Imagen'
        });
        this.forceLayoutUpdate();
    }

    removeGalleryItem(section: StorefrontSection, index: number) {
        section.content.items.splice(index, 1);
        this.forceLayoutUpdate();
    }

    addCategoryItem(section: StorefrontSection) {
        if (!section.content.categories) section.content.categories = [];
        section.content.categories.push({
            id: crypto.randomUUID(),
            name: 'Nueva Categoría',
            icon: '🛍️',
            link: '/store/productos'
        });
        this.forceLayoutUpdate();
    }

    removeCategoryItem(section: StorefrontSection, index: number) {
        section.content.categories.splice(index, 1);
        this.forceLayoutUpdate();
    }

    addStatItem(section: StorefrontSection) {
        if (!section.content.stats) section.content.stats = [];
        section.content.stats.push({
            label: 'Métrica',
            value: '+100'
        });
        this.forceLayoutUpdate();
    }

    removeStatItem(section: StorefrontSection, index: number) {
        section.content.stats.splice(index, 1);
        this.forceLayoutUpdate();
    }

    addBrandLogoItem(section: StorefrontSection) {
        if (!section.content.items) section.content.items = [];
        section.content.items.push({
            id: crypto.randomUUID(),
            name: 'Nueva Marca',
            logoUrl: ''
        });
        this.forceLayoutUpdate();
    }

    removeBrandLogoItem(section: StorefrontSection, index: number) {
        section.content.items.splice(index, 1);
        this.forceLayoutUpdate();
    }

    addSocialPostItem(section: StorefrontSection) {
        if (!section.content.items) section.content.items = [];
        section.content.items.push({
            id: crypto.randomUUID(),
            imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400',
            likes: 120
        });
        this.forceLayoutUpdate();
    }

    removeSocialPostItem(section: StorefrontSection, index: number) {
        section.content.items.splice(index, 1);
        this.forceLayoutUpdate();
    }

    async saveLayout() {
        this.isSaving.set(true);
        try {
            const result = await this.tenantService.updateStorefrontLayout(this.layout());
            if (result.success) {
                this.savedLayout.set(structuredClone(this.layout()));
                this.toast.success('Diseño de la tienda actualizado exitosamente');
                this.dirtyChange.emit(false);
            } else {
                this.toast.error(result.error || 'Error al actualizar el diseño');
            }
        } catch (error) {
            console.error('Error saving layout:', error);
            this.toast.error('Ocurrió un error inesperado al guardar el diseño');
        } finally {
            this.isSaving.set(false);
        }
    }

    forceLayoutUpdate() {
        this.layout.update(l => ({ ...l }));
        this.dirtyChange.emit(true);
    }

    discardLayout() {
        this.layout.set(structuredClone(this.savedLayout()));
        this.dirtyChange.emit(false);
        this.toast.info('Cambios de diseño descartados');
    }

    private getDefaultContentForType(type: SectionType): any {
        switch (type) {
            case 'hero':
                return {
                    title: 'Nueva Colección 2026',
                    subtitle: 'Descubre piezas exclusivas diseñadas con la máxima atención al detalle y acabados premium.',
                    buttonText: 'Comprar ahora',
                    buttonLink: '/store/productos',
                    secondaryButtonText: 'Ver catálogo',
                    secondaryButtonLink: '/store/productos',
                    alignment: 'center',
                    badgeText: 'NUEVA COLECCIÓN ✨',
                    height: 'medium',
                    textSize: 'large',
                    compositionStyle: 'full-banner',
                    splitImagePosition: 'right',
                    splitImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1000',
                    animation: 'fade-in',
                    overlayOpacity: 40,
                    overlayColor: '#000000',
                    backgroundImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600'
                };

            case 'promo_banner':
                return {
                    badge: 'OFERTA ESPECIAL',
                    title: '¡Aprovecha hasta un 40% de Descuento!',
                    subtitle: 'En artículos seleccionados por tiempo limitado.',
                    buttonText: 'Ver Ofertas',
                    buttonLink: '/store/productos',
                    discountPercent: '40% OFF',
                    backgroundColor: '#4f46e5',
                    textColor: '#ffffff'
                };

            case 'product_grid':
                return {
                    title: 'Productos Destacados',
                    description: 'Nuestra selección exclusiva de los artículos más populares.',
                    limit: 8,
                    columns: 4,
                    showViewAll: true,
                    viewAllLink: '/store/productos'
                };

            case 'featured_categories':
                return {
                    title: 'Explora por Categorías',
                    description: 'Encuentra exactamente lo que buscas navegando por nuestras colecciones.',
                    categories: [
                        { id: '1', name: 'Novedades', icon: '✨', link: '/store/productos' },
                        { id: '2', name: 'Tendencias', icon: '🔥', link: '/store/productos' },
                        { id: '3', name: 'Exclusivos', icon: '💎', link: '/store/productos' },
                        { id: '4', name: 'Rebajas', icon: '🎁', link: '/store/productos' }
                    ]
                };

            case 'offers':
                return {
                    badge: 'FLASH SALE',
                    title: 'Liquidación de Temporada',
                    description: 'Descuentos increíbles en artículos seleccionados. ¡No te quedes sin el tuyo!',
                    discountBadge: '50% OFF',
                    targetDate: new Date(Date.now() + 3 * 86400000).toISOString(),
                    buttonText: 'Comprar Oferta',
                    buttonLink: '/store/productos'
                };

            case 'testimonials':
                return {
                    title: 'Lo Que Dicen Nuestros Clientes',
                    subtitle: 'Miles de personas confían en la calidad y servicio de nuestra tienda.',
                    items: [
                        {
                            id: '1',
                            name: 'Sofía Morales',
                            role: 'Cliente Verificada',
                            content: 'La calidad de los productos superó todas mis expectativas. El envío fue súper rápido y el empaque impecable.',
                            rating: 5,
                            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
                        },
                        {
                            id: '2',
                            name: 'Carlos Mendoza',
                            role: 'Comprador Frecuente',
                            content: 'Excelente atención al cliente y productos auténticos. Sin duda volveré a comprar aquí.',
                            rating: 5,
                            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
                        },
                        {
                            id: '3',
                            name: 'Valeria Rivas',
                            role: 'Diseñadora de Interiores',
                            content: 'El diseño y los materiales son de primer nivel. Es mi tienda favorita para encontrar piezas únicas.',
                            rating: 5,
                            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                        }
                    ]
                };

            case 'reviews':
                return {
                    title: 'Reseñas & Calificaciones',
                    subtitle: 'Opiniones reales de compradores que ya disfrutan de nuestros productos.',
                    overallRating: 4.9,
                    totalReviews: 248,
                    items: [
                        {
                            id: '1',
                            author: 'Mariana L.',
                            rating: 5,
                            date: 'Hace 2 días',
                            title: '¡Totalmente recomendado!',
                            comment: 'Llegó en perfecto estado, tal como se mostraba en las fotos. El soporte respondió todas mis dudas al instante.',
                            verified: true
                        },
                        {
                            id: '2',
                            author: 'Alejandro P.',
                            rating: 5,
                            date: 'Hace 5 días',
                            title: 'Excelente calidad y acabados',
                            comment: 'Compré para un regalo y fue un éxito total. Muy buena relación calidad-precio.',
                            verified: true
                        },
                        {
                            id: '3',
                            author: 'Elena S.',
                            rating: 4,
                            date: 'Hace 1 semana',
                            title: 'Muy satisfecha',
                            comment: 'El producto es hermoso, solo tardó un día más de lo estimado pero valió la pena.',
                            verified: true
                        }
                    ]
                };

            case 'about_us':
                return {
                    badge: 'NUESTRA HISTORIA',
                    title: 'Pasión por el Detalle y la Excelencia',
                    content: 'Nacimos con el propósito de ofrecer productos de la más alta calidad, uniendo diseño contemporáneo con procesos sostenibles y un servicio al cliente inigualable.',
                    imagePosition: 'right',
                    imageUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=800',
                    buttonText: 'Conocer más',
                    buttonLink: '/store/productos',
                    stats: [
                        { label: 'Clientes Felices', value: '+10K' },
                        { label: 'Años de Experiencia', value: '5+' },
                        { label: 'Envíos Nacionales', value: '100%' }
                    ]
                };

            case 'image_gallery':
                return {
                    title: 'Galería de Inspiración',
                    subtitle: 'Descubre cómo lucen nuestros productos en la vida real.',
                    columns: 4,
                    items: [
                        { id: '1', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600', caption: 'Estilo Urbano' },
                        { id: '2', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600', caption: 'Edición Deportiva' },
                        { id: '3', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600', caption: 'Audio Premium' },
                        { id: '4', imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600', caption: 'Accesorios Esenciales' }
                    ]
                };

            case 'newsletter':
                return {
                    badge: 'CLUB EXCLUSIVO',
                    title: 'Únete a nuestra comunidad y recibe 10% de descuento',
                    description: 'Sé el primero en enterarte de nuevos lanzamientos, eventos especiales y descuentos para miembros.',
                    placeholderText: 'Ingresa tu correo electrónico',
                    buttonText: 'Suscribirme',
                    disclaimer: 'Sin spam. Puedes cancelar tu suscripción en cualquier momento.',
                    successMessage: '¡Gracias por suscribirte! Revisa tu bandeja de entrada.'
                };

            case 'faq':
                return {
                    title: 'Preguntas Frecuentes',
                    subtitle: 'Resolvemos tus dudas más habituales sobre compras, envíos y devoluciones.',
                    items: [
                        { id: '1', question: '¿Cuánto tiempo tarda en llegar mi pedido?', answer: 'Los envíos estándar toman entre 2 y 4 días hábiles. También contamos con envíos exprés con entrega en 24-48 horas.' },
                        { id: '2', question: '¿Cuáles son los métodos de pago aceptados?', answer: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, AMEX), transferencias bancarias y pagos en efectivo contra entrega.' },
                        { id: '3', question: '¿Puedo solicitar cambios o devoluciones?', answer: 'Sí, tienes hasta 30 días posteriores a tu compra para solicitar un cambio o reembolso total si no quedas satisfecho.' },
                        { id: '4', question: '¿Los productos cuentan con garantía?', answer: 'Todos nuestros productos incluyen una garantía oficial de 1 año contra defectos de fabricación.' }
                    ]
                };

            case 'benefits':
                return {
                    title: '¿Por qué elegirnos?',
                    items: [
                        { id: '1', icon: '🚀', title: 'Envío Rápido', description: 'Entrega garantizada y seguimiento en tiempo real.' },
                        { id: '2', icon: '🔒', title: 'Pago 100% Seguro', description: 'Tus transacciones están protegidas con cifrado SSL.' },
                        { id: '3', icon: '✨', title: 'Calidad Premium', description: 'Materiales seleccionados y acabados de primera.' },
                        { id: '4', icon: '💬', title: 'Atención 24/7', description: 'Soporte personalizado listo para ayudarte siempre.' }
                    ]
                };

            case 'brand_logos':
                return {
                    title: 'Marcas de Confianza',
                    items: [
                        { id: '1', name: 'Brand One', logoUrl: '' },
                        { id: '2', name: 'Brand Two', logoUrl: '' },
                        { id: '3', name: 'Brand Three', logoUrl: '' },
                        { id: '4', name: 'Brand Four', logoUrl: '' },
                        { id: '5', name: 'Brand Five', logoUrl: '' }
                    ]
                };

            case 'countdown':
                return {
                    badge: 'LANZAMIENTO',
                    title: 'Próxima Gran Venta Especial',
                    description: 'Prepárate para las mayores promociones del año. El contador está en marcha.',
                    targetDate: new Date(Date.now() + 5 * 86400000).toISOString(),
                    buttonText: 'Notificarme al iniciar',
                    buttonLink: '/store/productos'
                };

            case 'social_feed':
                return {
                    title: 'Síguenos en Instagram',
                    handle: '@mitienda_oficial',
                    subtitle: 'Etiquétanos en tus fotos con #MiTienda para aparecer en nuestro muro.',
                    followButtonText: 'Seguir en Instagram',
                    profileUrl: 'https://instagram.com',
                    items: [
                        { id: '1', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400', likes: 142 },
                        { id: '2', imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400', likes: 238 },
                        { id: '3', imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=400', likes: 310 },
                        { id: '4', imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400', likes: 185 }
                    ]
                };

            case 'map_location':
                return {
                    title: 'Visita Nuestra Tienda Física',
                    address: 'Av. Principal 1234, Centro Comercial Plaza Local 42',
                    cityState: 'Ciudad de México, CP 06000',
                    phone: '+52 55 1234 5678',
                    email: 'contacto@mitienda.com',
                    hours: 'Lunes a Sábado: 10:00 AM - 8:00 PM | Domingos: 11:00 AM - 6:00 PM',
                    googleMapsUrl: 'https://maps.google.com'
                };

            default:
                return {};
        }
    }
}
