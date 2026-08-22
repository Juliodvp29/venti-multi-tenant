import { Injectable, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface PreviewSyncData {
  business_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  header_color: string;
  footer_color: string;
  currency: string;
  timezone: string;
  font_family: string;
  layout: 'modern' | 'classic' | 'minimal';
  viewMode: 'desktop' | 'mobile';
  storefront_layout: unknown;
  themeTokens?: unknown;
}

interface SyncMessage {
  type: 'preview-update' | 'request-state' | 'popout-ready' | 'popout-closing';
  data?: PreviewSyncData;
}

const CHANNEL_NAME = 'venti-store-preview';

@Injectable({ providedIn: 'root' })
export class PreviewSyncService implements OnDestroy {
  private channel: BroadcastChannel | null = null;

  /** Whether the popout preview tab is currently open */
  readonly isPopoutOpen = signal(false);

  /** Emits preview data received from the settings tab (used by standalone preview) */
  private readonly _previewUpdates = new Subject<PreviewSyncData>();
  readonly previewUpdates$ = this._previewUpdates.asObservable();

  /** Cached last preview data so late-joining tabs get immediate state */
  private lastData: PreviewSyncData | null = null;

  /** Reference to the popout window */
  private popoutWindow: Window | null = null;

  /** Timer for checking if popout is still open */
  private popoutCheckInterval: ReturnType<typeof setInterval> | null = null;

  private ensureChannel(): BroadcastChannel {
    if (!this.channel) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        this.handleMessage(event.data);
      };
    }
    return this.channel;
  }

  /** Send preview data to the popout tab */
  broadcastPreview(data: PreviewSyncData): void {
    this.lastData = data;
    if (this.isPopoutOpen()) {
      const msg: SyncMessage = { type: 'preview-update', data };
      this.ensureChannel().postMessage(msg);
    }
  }

  /** Open the preview in a new browser tab */
  openPopout(): void {
    // If already open, just focus
    if (this.popoutWindow && !this.popoutWindow.closed) {
      this.popoutWindow.focus();
      return;
    }

    this.ensureChannel();
    this.popoutWindow = window.open(
      '/preview',
      'venti-preview',
      'noopener=no'
    );

    if (this.popoutWindow) {
      this.isPopoutOpen.set(true);
      this.startPopoutCheck();
    }
  }

  /** Close the popout and restore embedded preview */
  closePopout(): void {
    if (this.popoutWindow && !this.popoutWindow.closed) {
      this.popoutWindow.close();
    }
    this.popoutWindow = null;
    this.isPopoutOpen.set(false);
    this.stopPopoutCheck();
  }

  /** Called by the standalone preview component to start listening */
  startListening(): void {
    this.ensureChannel();
    // Request current state from the settings tab
    const msg: SyncMessage = { type: 'popout-ready' };
    this.channel!.postMessage(msg);
  }

  /** Called by the standalone preview to notify it's closing */
  notifyClosing(): void {
    if (this.channel) {
      const msg: SyncMessage = { type: 'popout-closing' };
      this.channel.postMessage(msg);
    }
  }

  private handleMessage(msg: SyncMessage): void {
    switch (msg.type) {
      case 'preview-update':
        // Received by the standalone preview tab
        if (msg.data) {
          this._previewUpdates.next(msg.data);
        }
        break;

      case 'popout-ready':
        // Received by the settings tab — send current state immediately
        this.isPopoutOpen.set(true);
        if (this.lastData) {
          const reply: SyncMessage = { type: 'preview-update', data: this.lastData };
          this.ensureChannel().postMessage(reply);
        }
        break;

      case 'popout-closing':
        // Received by the settings tab — restore embedded preview
        this.isPopoutOpen.set(false);
        this.popoutWindow = null;
        this.stopPopoutCheck();
        break;

      case 'request-state':
        // Fallback: send cached state
        if (this.lastData) {
          const reply: SyncMessage = { type: 'preview-update', data: this.lastData };
          this.ensureChannel().postMessage(reply);
        }
        break;
    }
  }

  private startPopoutCheck(): void {
    this.stopPopoutCheck();
    // Poll every 1s to detect if the popout window was closed directly
    this.popoutCheckInterval = setInterval(() => {
      if (this.popoutWindow && this.popoutWindow.closed) {
        this.popoutWindow = null;
        this.isPopoutOpen.set(false);
        this.stopPopoutCheck();
      }
    }, 1000);
  }

  private stopPopoutCheck(): void {
    if (this.popoutCheckInterval) {
      clearInterval(this.popoutCheckInterval);
      this.popoutCheckInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.stopPopoutCheck();
    this.channel?.close();
    this.channel = null;
  }
}
