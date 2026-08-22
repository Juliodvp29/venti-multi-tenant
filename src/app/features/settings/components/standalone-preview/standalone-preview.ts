import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { PreviewSyncService, PreviewSyncData } from '@core/services/preview-sync.service';
import { StorePreview, PreviewData } from '../store-preview';

@Component({
    selector: 'app-standalone-preview',
    imports: [CommonModule, StorePreview],
    templateUrl: './standalone-preview.html',
    styles: [`
        :host {
            display: block;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandalonePreview implements OnInit, OnDestroy {
    private readonly previewSync = inject(PreviewSyncService);
    private subscription: Subscription | null = null;

    readonly isConnected = signal(false);
    readonly viewMode = signal<'desktop' | 'mobile'>('desktop');
    readonly lastUpdate = signal<Date | null>(null);

    readonly previewData = signal<PreviewData>({
        business_name: 'Cargando...',
        logo_url: null,
        primary_color: '#000000',
        secondary_color: '#ffffff',
        accent_color: '#3b82f6',
        background_color: '#ffffff',
        header_color: '#ffffff',
        footer_color: '#ffffff',
        currency: 'USD',
        timezone: 'America/New_York',
        font_family: '"Inter", sans-serif',
        layout: 'modern',
        viewMode: 'desktop',
        storefront_layout: { sections: [] },
    });

    ngOnInit(): void {
        this.previewSync.startListening();

        this.subscription = this.previewSync.previewUpdates$.subscribe((data: PreviewSyncData) => {
            this.previewData.set(data as PreviewData);
            this.viewMode.set(data.viewMode);
            this.isConnected.set(true);
            this.lastUpdate.set(new Date());
        });

        window.addEventListener('beforeunload', this.onBeforeUnload);
    }

    setViewMode(mode: 'desktop' | 'mobile'): void {
        this.viewMode.set(mode);
        this.previewData.update(prev => ({ ...prev, viewMode: mode }));
    }

    private readonly onBeforeUnload = (): void => {
        this.previewSync.notifyClosing();
    };

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        window.removeEventListener('beforeunload', this.onBeforeUnload);
        this.previewSync.notifyClosing();
    }
}
