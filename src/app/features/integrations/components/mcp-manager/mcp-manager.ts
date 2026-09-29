import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { McpService } from '@core/services/mcp';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';
import { McpApiKey, McpAuditLog } from '@core/models';

interface AvailableTool {
  name: string;
  scope: string;
  description: string;
  exampleQueries: string[];
}

@Component({
  selector: 'app-mcp-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './mcp-manager.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpManager implements OnInit {
  private readonly mcpService = inject(McpService);
  private readonly toast = inject(ToastService);
  private readonly tenantService = inject(TenantService);

  readonly keys = signal<McpApiKey[]>([]);
  readonly logs = signal<McpAuditLog[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly actionId = signal<string | null>(null);

  // Creation modal state
  readonly isCreateOpen = signal(false);
  readonly newKeyName = signal('');
  readonly selectedScopes = signal<string[]>([
    'read:orders',
    'read:products',
    'read:inventory',
    'read:customers',
    'read:analytics',
  ]);
  readonly createdKeySecret = signal<string | null>(null);
  readonly activeConfigTab = signal<'claude' | 'gemini' | 'codex' | 'chatgpt'>('claude');

  readonly availableScopes = [
    {
      id: 'read:orders',
      label: 'Pedidos y Estados',
      desc: 'Consultar listas y detalles de pedidos',
    },
    {
      id: 'read:products',
      label: 'Productos y Catálogo',
      desc: 'Ver catálogo, precios y variantes',
    },
    {
      id: 'read:inventory',
      label: 'Inventario y Alertas',
      desc: 'Monitorear niveles de stock y quiebres',
    },
    {
      id: 'read:customers',
      label: 'Clientes y Segmentos',
      desc: 'Ver historial de compras y mejores clientes',
    },
    {
      id: 'read:analytics',
      label: 'Ventas y Analítica',
      desc: 'Obtener métricas, volumen e ingresos',
    },
  ];

  readonly catalogTools: AvailableTool[] = [
    {
      name: 'get_sales_overview',
      scope: 'read:analytics',
      description:
        'Calcula total de ventas, ingresos, pedidos y ticket promedio en cualquier período.',
      exampleQueries: [
        '¿Cuánto vendí hoy y cómo va respecto a la semana pasada?',
        'Dame el resumen de ventas de los últimos 30 días',
      ],
    },
    {
      name: 'list_orders',
      scope: 'read:orders',
      description:
        'Filtra y lista pedidos por estado (pendientes, enviados, entregados) o cliente.',
      exampleQueries: [
        '¿Cuáles son los pedidos pendientes de envío?',
        'Muéstrame los últimos 5 pedidos realizados hoy',
      ],
    },
    {
      name: 'get_order_details',
      scope: 'read:orders',
      description:
        'Obtiene los artículos, dirección de despacho y datos de pago de un pedido concreto.',
      exampleQueries: [
        'Dame el detalle del pedido #ORD-1002',
        '¿Qué productos compró Juan en su última orden?',
      ],
    },
    {
      name: 'get_inventory_alerts',
      scope: 'read:inventory',
      description: 'Detecta productos y variantes agotados o con stock inferior al umbral mínimo.',
      exampleQueries: [
        '¿Qué productos tienen menos de 5 unidades en stock?',
        '¿Hay productos agotados que necesite reponer?',
      ],
    },
    {
      name: 'list_products',
      scope: 'read:products',
      description: 'Busca productos por nombre o categoría con sus precios y disponibilidad.',
      exampleQueries: [
        '¿Cuál es el precio y stock actual de la camiseta polo?',
        'Lista todos los productos activos de la tienda',
      ],
    },
    {
      name: 'list_top_customers',
      scope: 'read:customers',
      description: 'Lista los clientes más valiosos según su volumen de compra o gasto acumulado.',
      exampleQueries: [
        '¿Quiénes son mis 5 mejores clientes este mes?',
        '¿Cuánto ha gastado en total la cliente Maria Pérez?',
      ],
    },
    {
      name: 'get_store_summary',
      scope: 'read:analytics',
      description:
        'Reporte rápido del estado general: moneda, productos activos y pedidos por despachar.',
      exampleQueries: ['Dame un diagnóstico rápido de cómo está la tienda hoy'],
    },
  ];

  readonly endpointUrl = computed(() => this.mcpService.getMcpEndpointUrl());
  readonly openApiUrl = computed(() => this.mcpService.getOpenApiUrl());

  readonly claudeConfigJson = computed(() => {
    const token = this.createdKeySecret() || 'TU_CLAVE_MCP';
    return this.mcpService.generateClaudeConfig(token);
  });

  readonly geminiConfigJson = computed(() => {
    const token = this.createdKeySecret() || 'TU_CLAVE_MCP';
    return this.mcpService.generateGeminiConfig(token);
  });

  readonly geminiSnippet = computed(() => {
    const token = this.createdKeySecret() || 'TU_CLAVE_MCP';
    return this.mcpService.generateGeminiPythonSnippet(token);
  });

  readonly codexConfigJson = computed(() => {
    const token = this.createdKeySecret() || 'TU_CLAVE_MCP';
    return this.mcpService.generateCursorConfig(token);
  });

  ngOnInit(): void {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [keys, logs] = await Promise.all([
        this.mcpService.listKeys(),
        this.mcpService.listAuditLogs(15),
      ]);
      this.keys.set(keys);
      this.logs.set(logs);
    } catch (error) {
      console.error('Error loading MCP data:', error);
      this.toast.error('No se pudieron cargar los datos de conexión IA (MCP)');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreate(): void {
    this.newKeyName.set('');
    this.selectedScopes.set([
      'read:orders',
      'read:products',
      'read:inventory',
      'read:customers',
      'read:analytics',
    ]);
    this.createdKeySecret.set(null);
    this.isCreateOpen.set(true);
  }

  closeCreate(): void {
    if (!this.isSaving()) {
      this.isCreateOpen.set(false);
      this.createdKeySecret.set(null);
    }
  }

  toggleScope(scopeId: string): void {
    this.selectedScopes.update((scopes) =>
      scopes.includes(scopeId) ? scopes.filter((s) => s !== scopeId) : [...scopes, scopeId],
    );
  }

  async createKey(): Promise<void> {
    const name = this.newKeyName().trim();
    if (!name) {
      this.toast.error('Ingresa un nombre para identificar la conexión (ej: Claude Desktop)');
      return;
    }
    if (this.selectedScopes().length === 0) {
      this.toast.error('Selecciona al menos un permiso');
      return;
    }

    this.isSaving.set(true);
    try {
      const result = await this.mcpService.createKey(name, this.selectedScopes());
      this.keys.update((list) => [result.apiKey, ...list]);
      this.createdKeySecret.set(result.rawToken);
      this.toast.success('Clave MCP generada con éxito');
    } catch (error) {
      console.error('Error creating MCP key:', error);
      this.toast.error('No se pudo generar la clave MCP');
    } finally {
      this.isSaving.set(false);
    }
  }

  async toggleKey(key: McpApiKey): Promise<void> {
    this.actionId.set(key.id);
    try {
      await this.mcpService.setKeyActive(key.id, !key.is_active);
      this.keys.update((list) =>
        list.map((item) => (item.id === key.id ? { ...item, is_active: !item.is_active } : item)),
      );
      this.toast.success(key.is_active ? 'Conexión desactivada' : 'Conexión activada');
    } catch (error) {
      console.error('Error updating MCP key:', error);
      this.toast.error('No se pudo cambiar el estado de la conexión');
    } finally {
      this.actionId.set(null);
    }
  }

  async deleteKey(key: McpApiKey): Promise<void> {
    const confirmed = await this.toast.confirm(
      `¿Deseas revocar y eliminar la conexión "${key.name}"? Los agentes que usen esta clave ya no podrán acceder.`,
      'Revocar conexión MCP',
    );
    if (!confirmed) return;

    this.actionId.set(key.id);
    try {
      await this.mcpService.deleteKey(key.id);
      this.keys.update((list) => list.filter((item) => item.id !== key.id));
      this.toast.success('Conexión revocada correctamente');
    } catch (error) {
      console.error('Error deleting MCP key:', error);
      this.toast.error('No se pudo revocar la clave');
    } finally {
      this.actionId.set(null);
    }
  }

  async copyText(text: string, successMessage: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.toast.success(successMessage);
    } catch {
      this.toast.error('No se pudo copiar al portapapeles');
    }
  }
}
