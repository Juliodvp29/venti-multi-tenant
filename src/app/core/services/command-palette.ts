import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionsService, AppModule } from '@core/services/permissions';
import { ProductsService } from '@core/services/products';
import { OrdersService } from '@core/services/orders';
import { CustomersService } from '@core/services/customers';

export type PaletteItemKind = 'navigation' | 'product' | 'order' | 'customer';

export interface PaletteItem {
  id: string;
  kind: PaletteItemKind;
  title: string;
  subtitle: string;
  route: string[];
  queryParams?: Record<string, string>;
  keywords: string;
}

export interface PaletteGroup {
  label: string;
  items: PaletteItem[];
}

interface NavEntry {
  label: string;
  route: string[];
  queryParams?: Record<string, string>;
  module: AppModule;
  keywords: string;
}

/** Catálogo de destinos — espejo del sidebar (label + ruta + módulo para permisos). */
const NAV_ENTRIES: NavEntry[] = [
  {
    label: 'Inicio',
    route: ['/dashboard'],
    module: 'dashboard',
    keywords: 'inicio home resumen dashboard',
  },
  {
    label: 'Catálogo de Productos',
    route: ['/products'],
    module: 'products',
    keywords: 'productos catalogo inventario sku',
  },
  {
    label: 'Movimientos de Stock',
    route: ['/inventory-history'],
    module: 'inventory-history',
    keywords: 'stock inventario movimientos historial',
  },
  {
    label: 'Pedidos',
    route: ['/orders'],
    module: 'orders',
    keywords: 'pedidos ordenes ventas envios',
  },
  {
    label: 'Clientes',
    route: ['/customers'],
    module: 'customers',
    keywords: 'clientes customers compradores',
  },
  {
    label: 'Equipo',
    route: ['/members'],
    module: 'members',
    keywords: 'equipo miembros roles usuarios invitaciones',
  },
  {
    label: 'Cupones',
    route: ['/coupons'],
    module: 'coupons',
    keywords: 'cupones descuentos promociones codigos',
  },
  {
    label: 'Carritos Abandonados',
    route: ['/abandoned-carts'],
    module: 'abandoned-carts',
    keywords: 'carritos abandonados recuperacion',
  },
  {
    label: 'Reportes',
    route: ['/reports'],
    module: 'reports',
    keywords: 'reportes analiticas metricas',
  },
  {
    label: 'Comisiones',
    route: ['/commissions'],
    module: 'commissions',
    keywords: 'comisiones pagos liquidaciones',
  },
  {
    label: 'Reseñas',
    route: ['/reviews'],
    module: 'reviews',
    keywords: 'resenas reviews opiniones moderacion',
  },
  {
    label: 'Mi Suscripción',
    route: ['/subscription'],
    module: 'subscription',
    keywords: 'suscripcion plan facturacion billing',
  },
  {
    label: 'Configuración',
    route: ['/settings'],
    module: 'settings',
    keywords: 'configuracion ajustes settings tienda',
  },
  {
    label: 'Integraciones',
    route: ['/integrations'],
    module: 'integrations',
    keywords: 'integraciones conexiones api webhooks correos email plantillas resend',
  },
  {
    label: 'Correos y Plantillas',
    route: ['/integrations'],
    queryParams: { tab: 'emails' },
    module: 'integrations',
    keywords: 'correos correo email emails plantillas plantilla transaccionales resend notificaciones mensajeria mensajes smtp disenos',
  },
];

const RECENT_KEY = 'venti:palette-recent';
const MAX_RECENT = 5;
const SEARCH_LIMIT = 5;
const DEBOUNCE_MS = 220;

/** Normaliza para búsqueda insensible a tildes/mayúsculas. */
export function normalizePaletteText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchesQuery(haystack: string, query: string): boolean {
  const q = normalizePaletteText(query.trim());
  if (!q) return true;
  const words = q.split(/\s+/);
  const target = normalizePaletteText(haystack);
  return words.every((w) => target.includes(w));
}

@Injectable({
  providedIn: 'root',
})
export class CommandPaletteService {
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionsService);
  private readonly productsService = inject(ProductsService);
  private readonly ordersService = inject(OrdersService);
  private readonly customersService = inject(CustomersService);

  readonly isOpen = signal(false);
  readonly query = signal('');
  readonly isSearching = signal(false);

  private readonly products = signal<PaletteItem[]>([]);
  private readonly orders = signal<PaletteItem[]>([]);
  private readonly customers = signal<PaletteItem[]>([]);
  private readonly recent = signal<PaletteItem[]>(this.loadRecent());

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private searchSeq = 0;

  readonly allowedNav = computed<PaletteItem[]>(() =>
    NAV_ENTRIES.filter((entry) => this.permissions.canAccess(entry.module)).map(
      (entry): PaletteItem => ({
        id: `nav:${entry.route.join('/')}${entry.queryParams ? '?' + new URLSearchParams(entry.queryParams).toString() : ''}`,
        kind: 'navigation',
        title: entry.label,
        subtitle: 'Ir a módulo',
        route: entry.route,
        queryParams: entry.queryParams,
        keywords: `${entry.label} ${entry.keywords}`,
      }),
    ),
  );

  readonly groups = computed<PaletteGroup[]>(() => {
    const q = this.query().trim();
    const groups: PaletteGroup[] = [];

    if (!q) {
      const recent = this.recent().filter((item) =>
        this.allowedNav().some((nav) => nav.id === item.id || item.kind !== 'navigation'),
      );
      if (recent.length > 0)
        groups.push({ label: 'Recientes', items: recent.slice(0, MAX_RECENT) });
      groups.push({ label: 'Navegación', items: this.allowedNav() });
      return groups;
    }

    const nav = this.allowedNav().filter((item) =>
      matchesQuery(`${item.title} ${item.keywords}`, q),
    );
    if (nav.length > 0) groups.push({ label: 'Navegación', items: nav });

    if (this.products().length > 0) groups.push({ label: 'Productos', items: this.products() });
    if (this.orders().length > 0) groups.push({ label: 'Órdenes', items: this.orders() });
    if (this.customers().length > 0) groups.push({ label: 'Clientes', items: this.customers() });

    return groups;
  });

  readonly flatItems = computed<PaletteItem[]>(() => this.groups().flatMap((g) => g.items));

  readonly hasResults = computed(() => this.flatItems().length > 0);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.query.set('');
    this.isSearching.set(false);
    this.products.set([]);
    this.orders.set([]);
    this.customers.set([]);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  setQuery(value: string): void {
    this.query.set(value);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    const q = value.trim();
    if (!q) {
      this.isSearching.set(false);
      this.products.set([]);
      this.orders.set([]);
      this.customers.set([]);
      return;
    }

    this.isSearching.set(true);
    this.debounceTimer = setTimeout(() => void this.runEntitySearch(q), DEBOUNCE_MS);
  }

  async go(item: PaletteItem): Promise<void> {
    this.pushRecent(item);
    this.close();
    await this.router.navigate(item.route, { queryParams: item.queryParams });
  }

  private async runEntitySearch(term: string): Promise<void> {
    const seq = ++this.searchSeq;
    try {
      const [productsRes, ordersRes, customersRes] = await Promise.allSettled([
        this.productsService.getProducts(1, SEARCH_LIMIT, { search: term }),
        this.ordersService.getOrders(1, SEARCH_LIMIT, { search: term }),
        this.customersService.getCustomers(1, SEARCH_LIMIT, { search: term }),
      ]);
      if (seq !== this.searchSeq) return;

      if (productsRes.status === 'fulfilled') {
        this.products.set(
          (productsRes.value.data ?? []).map((p): PaletteItem => ({
            id: `product:${p.id}`,
            kind: 'product',
            title: p.name,
            subtitle: p.sku ? `SKU ${p.sku}` : 'Producto',
            route: ['/products'],
            keywords: `${p.name} ${p.sku ?? ''}`,
          })),
        );
      }
      if (ordersRes.status === 'fulfilled') {
        this.orders.set(
          (ordersRes.value.data ?? []).map((o): PaletteItem => ({
            id: `order:${o.id}`,
            kind: 'order',
            title: `#${o.order_number}`,
            subtitle: o.customer_email || 'Orden',
            route: ['/orders', o.id],
            keywords: `${o.order_number} ${o.customer_email}`,
          })),
        );
      }
      if (customersRes.status === 'fulfilled') {
        this.customers.set(
          (customersRes.value.data ?? []).map((c): PaletteItem => ({
            id: `customer:${c.id}`,
            kind: 'customer',
            title: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Invitado',
            subtitle: c.email,
            route: ['/customers', c.id],
            keywords: `${c.first_name ?? ''} ${c.last_name ?? ''} ${c.email}`,
          })),
        );
      }
    } catch (error) {
      console.error('Error en búsqueda global:', error);
    } finally {
      if (seq === this.searchSeq) this.isSearching.set(false);
    }
  }

  private loadRecent(): PaletteItem[] {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as PaletteItem[];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
    } catch {
      return [];
    }
  }

  private pushRecent(item: PaletteItem): void {
    const next = [item, ...this.recent().filter((r) => r.id !== item.id)].slice(0, MAX_RECENT);
    this.recent.set(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Almacenamiento no disponible (SSR/privado): los recientes solo viven en memoria.
    }
  }
}
