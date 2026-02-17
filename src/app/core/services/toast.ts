import { computed, Injectable, signal } from '@angular/core';
import {Toast, ToastType } from '@core/types';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);

  readonly toasts = computed(() => this._toasts());

  private add(type: ToastType, message: string, title?: string, duration = 4000): string {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, message, title, duration };

    this._toasts.update((toasts) => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  success(message: string, title = 'Éxito', duration?: number): string {
    return this.add('success', message, title, duration);
  }

  error(message: string, title = 'Error', duration?: number): string {
    return this.add('error', message, title, duration ?? 6000);
  }

  warning(message: string, title = 'Advertencia', duration?: number): string {
    return this.add('warning', message, title, duration);
  }

  info(message: string, title = 'Info', duration?: number): string {
    return this.add('info', message, title, duration);
  }

  remove(id: string): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
