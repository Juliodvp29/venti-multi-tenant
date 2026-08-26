import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Output,
    computed,
    inject,
    input,
    signal,
    effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';

export interface MediaAssetItem {
    name: string;
    url: string;
    created_at?: string;
    size?: number;
    type: string;
}

@Component({
    selector: 'app-media-manager-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './media-manager-modal.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaManagerModal {
    private readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);

    readonly isOpen = input(false);
    readonly title = input('Administrador de Recursos de Marca');
    readonly allowedFilter = input<'all' | 'image' | 'video'>('all');

    @Output() selectAsset = new EventEmitter<string>();
    @Output() closeModal = new EventEmitter<void>();

    readonly activeTab = signal<'library' | 'upload' | 'url'>('library');
    readonly isLoading = signal(false);
    readonly isUploading = signal(false);
    readonly uploadProgress = signal(0);
    readonly searchQuery = signal('');
    readonly filterType = signal<'all' | 'image' | 'video'>('all');
    readonly externalUrl = signal('');

    readonly assets = signal<MediaAssetItem[]>([]);
    readonly selectedAssetUrl = signal<string | null>(null);

    readonly filteredAssets = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        const type = this.filterType();

        return this.assets().filter(item => {
            const matchesQuery = !query || item.name.toLowerCase().includes(query);
            const matchesType = type === 'all' || item.type === type;
            return matchesQuery && matchesType;
        });
    });

    constructor() {
        effect(() => {
            if (this.isOpen()) {
                this.loadMedia();
            }
        });
    }

    async loadMedia() {
        this.isLoading.set(true);
        try {
            const items = await this.tenantService.listTenantMedia();
            this.assets.set(items);
        } catch {
            this.toastService.error('Error al cargar los recursos multimedia');
        } finally {
            this.isLoading.set(false);
        }
    }

    async onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        const isVideo = file.type.startsWith('video/');
        const assetType = isVideo ? 'video' : 'media';

        this.isUploading.set(true);
        this.uploadProgress.set(30);

        try {
            const result = await this.tenantService.uploadBrandingAsset(file, assetType);
            this.uploadProgress.set(90);

            if (result.success && result.url) {
                this.toastService.success('Archivo subido con éxito');
                this.selectedAssetUrl.set(result.url);
                await this.loadMedia();
                this.activeTab.set('library');
            } else {
                this.toastService.error(result.error || 'Error al subir el archivo');
            }
        } catch {
            this.toastService.error('Error al subir el archivo');
        } finally {
            this.isUploading.set(false);
            this.uploadProgress.set(0);
            input.value = '';
        }
    }

    selectItem(url: string) {
        this.selectedAssetUrl.set(url);
    }

    confirmSelection(url?: string) {
        const finalUrl = url || this.selectedAssetUrl() || this.externalUrl();
        if (!finalUrl) {
            this.toastService.error('Por favor selecciona un recurso o ingresa una URL');
            return;
        }
        this.selectAsset.emit(finalUrl);
        this.close();
    }

    async deleteAsset(item: MediaAssetItem, event: Event) {
        event.stopPropagation();
        const confirmed = await this.toastService.confirm(
            `¿Estás seguro de eliminar "${item.name}"? Esta acción no se puede deshacer.`,
            'Eliminar recurso'
        );
        if (!confirmed) return;

        try {
            const success = await this.tenantService.deleteTenantMedia(item.name);
            if (success) {
                this.toastService.success('Recurso eliminado');
                if (this.selectedAssetUrl() === item.url) {
                    this.selectedAssetUrl.set(null);
                }
                await this.loadMedia();
            } else {
                this.toastService.error('Error al eliminar el recurso');
            }
        } catch {
            this.toastService.error('Error al eliminar el recurso');
        }
    }

    async copyUrl(url: string, event: Event) {
        event.stopPropagation();
        try {
            await navigator.clipboard.writeText(url);
            this.toastService.success('Enlace copiado al portapapeles');
        } catch {
            this.toastService.error('No se pudo copiar el enlace');
        }
    }

    close() {
        this.selectedAssetUrl.set(null);
        this.externalUrl.set('');
        this.closeModal.emit();
    }
}
