import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebhookEvent, WebhookStatus } from '@core/enums';
import { WebhookDelivery, WebhookEndpoint, WebhookEndpointSummary } from '@core/models';
import { WebhooksService } from '@core/services/webhooks';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';

type IntegrationTab = 'explore' | 'deliveries';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './integrations.html',
  styleUrl: './integrations.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Integrations {
  private readonly webhooksService = inject(WebhooksService);
  private readonly toast = inject(ToastService);
  private readonly tenantService = inject(TenantService);

  readonly activeTab = signal<IntegrationTab>('explore');
  readonly endpoints = signal<WebhookEndpointSummary[]>([]);
  readonly deliveries = signal<WebhookDelivery[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly actionId = signal<string | null>(null);
  readonly isCreateOpen = signal(false);
  readonly revealedSecret = signal<string | null>(null);
  readonly endpointUrl = signal('');
  readonly selectedEvents = signal<WebhookEvent[]>([WebhookEvent.OrderCreated]);
  readonly events = Object.values(WebhookEvent);
  readonly hasActiveEndpoints = computed(() =>
    this.endpoints().some((endpoint) => endpoint.is_active),
  );

  readonly eventLabels: Record<WebhookEvent, string> = {
    [WebhookEvent.OrderCreated]: 'Pedido creado',
    [WebhookEvent.OrderStatusChanged]: 'Cambio de estado del pedido',
    [WebhookEvent.PaymentConfirmed]: 'Pago confirmado',
    [WebhookEvent.PaymentFailed]: 'Pago fallido',
    [WebhookEvent.ProductStockLow]: 'Stock bajo',
  };

  constructor() {
    effect(() => {
      if (this.tenantService.tenantId()) void this.loadData();
    });
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [endpoints, deliveries] = await Promise.all([
        this.webhooksService.listEndpoints(),
        this.webhooksService.listDeliveries(),
      ]);
      this.endpoints.set(endpoints);
      this.deliveries.set(deliveries);
    } catch (error) {
      console.error('Error loading integrations:', error);
      this.toast.error('No se pudieron cargar las integraciones');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreate(): void {
    this.endpointUrl.set('');
    this.selectedEvents.set([WebhookEvent.OrderCreated]);
    this.revealedSecret.set(null);
    this.isCreateOpen.set(true);
  }

  closeCreate(): void {
    if (!this.isSaving()) this.isCreateOpen.set(false);
  }

  toggleEvent(event: WebhookEvent): void {
    this.selectedEvents.update((selected) =>
      selected.includes(event) ? selected.filter((item) => item !== event) : [...selected, event],
    );
  }

  async createEndpoint(): Promise<void> {
    const url = this.endpointUrl().trim();
    if (!this.isValidUrl(url) || this.selectedEvents().length === 0) {
      this.toast.error('Ingresa una URL HTTPS válida y selecciona al menos un evento');
      return;
    }

    this.isSaving.set(true);
    try {
      const endpoint = await this.webhooksService.createEndpoint(url, this.selectedEvents());
      this.endpoints.update((items) => [endpoint, ...items]);
      this.revealedSecret.set(endpoint.secret_key);
      this.toast.success('Endpoint creado correctamente');
    } catch (error) {
      console.error('Error creating webhook endpoint:', error);
      this.toast.error('No se pudo crear el endpoint');
    } finally {
      this.isSaving.set(false);
    }
  }

  async toggleEndpoint(endpoint: WebhookEndpointSummary): Promise<void> {
    this.actionId.set(endpoint.id);
    try {
      await this.webhooksService.setEndpointActive(endpoint.id, !endpoint.is_active);
      this.endpoints.update((items) =>
        items.map((item) =>
          item.id === endpoint.id ? { ...item, is_active: !item.is_active } : item,
        ),
      );
      this.toast.success(endpoint.is_active ? 'Endpoint desactivado' : 'Endpoint activado');
    } catch (error) {
      console.error('Error updating webhook endpoint:', error);
      this.toast.error('No se pudo actualizar el endpoint');
    } finally {
      this.actionId.set(null);
    }
  }

  async deleteEndpoint(endpoint: WebhookEndpointSummary): Promise<void> {
    if (
      !(await this.toast.confirm(`¿Eliminar el endpoint ${endpoint.url}?`, 'Eliminar integración'))
    )
      return;
    this.actionId.set(endpoint.id);
    try {
      await this.webhooksService.deleteEndpoint(endpoint.id);
      this.endpoints.update((items) => items.filter((item) => item.id !== endpoint.id));
      this.toast.success('Endpoint eliminado');
    } catch (error) {
      console.error('Error deleting webhook endpoint:', error);
      this.toast.error('No se pudo eliminar el endpoint');
    } finally {
      this.actionId.set(null);
    }
  }

  async retryDelivery(delivery: WebhookDelivery): Promise<void> {
    this.actionId.set(delivery.id);
    try {
      await this.webhooksService.retryDelivery(delivery.id);
      this.deliveries.update((items) =>
        items.map((item) =>
          item.id === delivery.id
            ? {
                ...item,
                status: WebhookStatus.PendingRetry,
                next_retry_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      this.toast.success('Entrega programada para reenvío');
    } catch (error) {
      console.error('Error retrying webhook delivery:', error);
      this.toast.error('No se pudo programar el reenvío');
    } finally {
      this.actionId.set(null);
    }
  }

  async copySecret(): Promise<void> {
    const secret = this.revealedSecret();
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    this.toast.success('Secreto copiado al portapapeles');
  }

  eventLabel(event: string): string {
    return this.eventLabels[event as WebhookEvent] ?? event;
  }

  statusLabel(status: WebhookStatus | string): string {
    return (
      {
        [WebhookStatus.Success]: 'Entregado',
        [WebhookStatus.Failed]: 'Fallido',
        [WebhookStatus.PendingRetry]: 'Pendiente de reintento',
        [WebhookStatus.Pending]: 'Pendiente',
        [WebhookStatus.Processing]: 'Procesando',
      }[status] ?? status
    );
  }

  isFailed(status: WebhookStatus | string): boolean {
    return status === WebhookStatus.Failed;
  }

  private isValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !!url.hostname;
    } catch {
      return false;
    }
  }
}
