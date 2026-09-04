import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import { Toast } from '@shared/components/toast/toast';

/** Evita bucles: solo un reload por pestaña hasta la próxima navegación exitosa. */
const CHUNK_RELOAD_KEY = 'venti-chunk-reload';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('venti-multi-tenant');
  private readonly router = inject(Router);

  constructor() {
    // Si un deploy nuevo dejó al navegador con un index.html viejo, los lazy
    // chunks (dashboard, orders, ...) dan 404 y la navegación falla quedándose
    // en /auth/login aunque la sesión sí se guardó. Un reload carga el
    // index.html fresco con los hashes vigentes y la navegación prospera.
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.storageRemove(CHUNK_RELOAD_KEY);
      } else if (event instanceof NavigationError && this.isChunkLoadError(event.error)) {
        if (!this.storageGet(CHUNK_RELOAD_KEY)) {
          this.storageSet(CHUNK_RELOAD_KEY, '1');
          window.location.reload();
        }
      }
    });
  }

  private isChunkLoadError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return /Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk .* failed|importing a module script failed/i.test(
      message,
    );
  }

  private storageGet(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private storageSet(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Almacenamiento bloqueado: se omite la recuperación automática.
    }
  }

  private storageRemove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Sin almacenamiento no hay bandera que limpiar.
    }
  }
}
