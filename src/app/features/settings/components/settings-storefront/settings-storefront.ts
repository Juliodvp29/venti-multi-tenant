import { ChangeDetectionStrategy, Component, inject, signal, computed, output, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { StorefrontLayout, StorefrontSection, SectionType, SectionContentHero } from '@core/models';
import { ToastService } from '@core/services/toast';
import { StorageService } from '@core/services/storage';

@Component({
    selector: 'app-settings-storefront',
    imports: [FormsModule],
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

    readonly layout = signal<StorefrontLayout>(this.tenantService.storefrontLayout());
    readonly isSaving = signal(false);
    readonly selectedSectionId = signal<string | null>(null);

    readonly selectedSection = computed(() =>
        this.layout().sections.find(s => s.id === this.selectedSectionId())
    );

    constructor() {
        effect(() => {
            this.layoutChange.emit(this.layout());
        });
    }

    addSection(type: SectionType) {
        const newSection: StorefrontSection = {
            id: crypto.randomUUID(),
            type: type,
            isActive: true,
            content: this.getDefaultContentForType(type)
        };

        this.layout.update(l => ({
            ...l,
            sections: [...l.sections, newSection]
        }));

        this.selectedSectionId.set(newSection.id);
    }

    removeSection(id: string) {
        this.layout.update(l => ({
            ...l,
            sections: l.sections.filter(s => s.id !== id)
        }));
        if (this.selectedSectionId() === id) {
            this.selectedSectionId.set(null);
        }
    }

    moveSection(id: string, direction: 'up' | 'down') {
        const sections = [...this.layout().sections];
        const index = sections.findIndex(s => s.id === id);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
        } else if (direction === 'down' && index < sections.length - 1) {
            [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
        }

        this.layout.update(l => ({ ...l, sections }));
    }

    addNavigationLink() {
        const link = { label: 'New Link', url: '/store' };
        this.layout.update(l => ({
            ...l,
            navigation: [...(l.navigation || []), link]
        }));
    }

    removeNavigationLink(index: number) {
        this.layout.update(l => ({
            ...l,
            navigation: (l.navigation || []).filter((_, i) => i !== index)
        }));
    }

    moveNavigationLink(index: number, direction: 'up' | 'down') {
        const links = [...(this.layout().navigation || [])];
        if (direction === 'up' && index > 0) {
            [links[index], links[index - 1]] = [links[index - 1], links[index]];
        } else if (direction === 'down' && index < links.length - 1) {
            [links[index], links[index + 1]] = [links[index + 1], links[index]];
        }
        this.layout.update(l => ({ ...l, navigation: links }));
    }

    async onHeroBannerUpload(event: Event, section: StorefrontSection) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return;

        try {
            const result = await this.storage.uploadImage('products', file, `tenants/${tenantId}/storefront`);
            const content = section.content as SectionContentHero;
            content.backgroundImageUrl = result.url;
            this.forceLayoutUpdate();
            this.toast.success('Banner image uploaded');
        } catch (error) {
            console.error('Error uploading banner:', error);
            this.toast.error('Error uploading image');
        }
    }

    removeHeroBanner(section: StorefrontSection) {
        const content = section.content as SectionContentHero;
        content.backgroundImageUrl = undefined;
        this.forceLayoutUpdate();
    }

    async saveLayout() {
        this.isSaving.set(true);
        try {
            const result = await this.tenantService.updateStorefrontLayout(this.layout());
            if (result.success) {
                this.toast.success('Store layout updated successfully');
            } else {
                this.toast.error(result.error || 'Error updating layout');
            }
        } catch (error) {
            console.error('Error saving layout:', error);
            this.toast.error('An unexpected error occurred');
        } finally {
            this.isSaving.set(false);
        }
    }

    private getDefaultContentForType(type: SectionType): any {
        // ... (rest of the method)
    }

    forceLayoutUpdate() {
        this.layout.update(l => ({ ...l }));
    }
}
