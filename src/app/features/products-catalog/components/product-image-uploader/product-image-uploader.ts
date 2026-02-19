import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    inject,
    input,
    OnInit,
    output,
    signal,
    ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductImage } from '@core/models/product';
import { ProductsService } from '@core/services/products';
import { ToastService } from '@core/services/toast';

export interface PendingImage {
    file: File;
    previewUrl: string;
    uploading: boolean;
}

@Component({
    selector: 'app-product-image-uploader',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-image-uploader.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductImageUploader implements OnInit {
    @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

    private readonly productsService = inject(ProductsService);
    private readonly toast = inject(ToastService);

    /** Product id (null for new products - images will be queued) */
    readonly productId = input<string | null>(null);

    /** Pre-existing images when editing */
    readonly existingImages = input<ProductImage[]>([]);

    /** Emits updated saved images list whenever something changes */
    readonly savedImagesChange = output<ProductImage[]>();

    /** Emits pending files list (for new products) */
    readonly pendingFilesChange = output<File[]>();

    readonly savedImages = signal<ProductImage[]>([]);
    readonly pendingImages = signal<PendingImage[]>([]);
    readonly isDragging = signal(false);
    readonly isUploading = signal(false);

    ngOnInit() {
        this.savedImages.set([...(this.existingImages() ?? [])]);
    }

    // ── Drag & drop ─────────────────────────────────────────

    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(true);
    }

    onDragLeave() {
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(false);
        const files = Array.from(event.dataTransfer?.files ?? []);
        this.addFiles(files);
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        this.addFiles(files);
        input.value = '';
    }

    openFilePicker() {
        this.fileInputRef.nativeElement.click();
    }

    // ── File processing ──────────────────────────────────────

    private addFiles(files: File[]) {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (!imageFiles.length) return;

        const newPending: PendingImage[] = imageFiles.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            uploading: false,
        }));

        this.pendingImages.update(prev => [...prev, ...newPending]);
        this.pendingFilesChange.emit(this.pendingImages().map(p => p.file));

        // If we have a product id, upload immediately
        if (this.productId()) {
            this.uploadPendingImages(newPending);
        }
    }

    /** Called by parent after product creation to upload queued images */
    async uploadAllPending(productId: string): Promise<ProductImage[]> {
        const pending = this.pendingImages();
        if (!pending.length) return [];

        const uploaded: ProductImage[] = [];
        const currentSaved = this.savedImages();
        const isFirstImage = currentSaved.length === 0;

        for (let i = 0; i < pending.length; i++) {
            const item = pending[i];
            this.pendingImages.update(prev =>
                prev.map(p => p.previewUrl === item.previewUrl ? { ...p, uploading: true } : p)
            );
            try {
                const isPrimary = isFirstImage && i === 0;
                const image = await this.productsService.uploadImage(item.file, productId, isPrimary, undefined, i);
                uploaded.push(image);
                URL.revokeObjectURL(item.previewUrl);
            } catch (e: any) {
                this.toast.error(`Error al subir "${item.file.name}": ${e?.message ?? 'Error desconocido'}`);
            }
        }

        this.pendingImages.set([]);
        const allSaved = [...currentSaved, ...uploaded];
        this.savedImages.set(allSaved);
        this.savedImagesChange.emit(allSaved);
        return uploaded;
    }

    private async uploadPendingImages(items: PendingImage[]) {
        const productId = this.productId();
        if (!productId) return;

        this.isUploading.set(true);
        const currentSaved = this.savedImages();

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            this.pendingImages.update(prev =>
                prev.map(p => p.previewUrl === item.previewUrl ? { ...p, uploading: true } : p)
            );
            try {
                const isPrimary = currentSaved.length === 0 && i === 0;
                const image = await this.productsService.uploadImage(
                    item.file, productId, isPrimary, undefined, currentSaved.length + i
                );
                this.savedImages.update(s => [...s, image]);
                this.pendingImages.update(prev => prev.filter(p => p.previewUrl !== item.previewUrl));
                URL.revokeObjectURL(item.previewUrl);
            } catch (e: any) {
                this.toast.error(`Error al subir "${item.file.name}": ${e?.message ?? 'Error desconocido'}`);
                this.pendingImages.update(prev =>
                    prev.map(p => p.previewUrl === item.previewUrl ? { ...p, uploading: false } : p)
                );
            }
        }

        this.isUploading.set(false);
        this.savedImagesChange.emit(this.savedImages());
    }

    // ── Actions ──────────────────────────────────────────────

    async deleteSavedImage(image: ProductImage) {
        try {
            await this.productsService.deleteProductImage(image.id, image.url);
            this.savedImages.update(imgs => imgs.filter(i => i.id !== image.id));
            this.savedImagesChange.emit(this.savedImages());
            this.toast.success('Imagen eliminada.');
        } catch (e: any) {
            this.toast.error(`Error al eliminar imagen: ${e?.message ?? 'Error desconocido'}`);
        }
    }

    removePendingImage(item: PendingImage) {
        URL.revokeObjectURL(item.previewUrl);
        this.pendingImages.update(prev => prev.filter(p => p.previewUrl !== item.previewUrl));
        this.pendingFilesChange.emit(this.pendingImages().map(p => p.file));
    }

    async setPrimaryImage(image: ProductImage) {
        const productId = this.productId();
        if (!productId) return;

        try {
            await this.productsService.setPrimaryImage(productId, image.id);
            this.savedImages.update(imgs => imgs.map(i => ({ ...i, is_primary: i.id === image.id })));
            this.savedImagesChange.emit(this.savedImages());
        } catch (e: any) {
            this.toast.error('Error al cambiar imagen principal.');
        }
    }
}
