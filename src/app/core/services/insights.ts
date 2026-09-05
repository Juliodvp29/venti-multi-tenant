import { inject, Injectable } from '@angular/core';
import { NotificationType } from '@core/models/notification';
import { AbandonedCartService } from '@core/services/abandoned-cart';
import { AnalyticsService } from '@core/services/analytics';
import { DiscountsService } from '@core/services/discounts';
import { NotificationsService } from '@core/services/notifications';
import { OrdersService } from '@core/services/orders';
import { ReviewsService } from '@core/services/reviews';
import { Supabase } from '@core/services/supabase';
import { TenantService } from '@core/services/tenant';

const STORAGE_PREFIX = 'venti:insights:';
const VELOCITY_COVER_WARN_DAYS = 7;
const MAX_VELOCITY_ITEMS = 3;
const SALES_SPIKE_MULTIPLIER = 1.5;
const COUPON_WARN_DAYS = 3;
const SUBSCRIPTION_WARN_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

interface LowStockRow {
  id: string | null;
  name: string | null;
  sku: string | null;
  stock_quantity: number | null;
  days_of_stock_remaining: number | null;
  average_daily_sales: number | null;
}

interface InsightMemory {
  day: string;
  keys: string[];
}

/**
 * Motor de notificaciones proactivas: calcula insights diarios (velocidad de
 * venta, resumen matutino, reseñas, carritos, récord de ventas, cupones y
 * membresía) y los publica como notificaciones con dedup diario.
 *
 * Se ejecuta una vez por sesión al resolver el tenant (ver MainLayout).
 */
@Injectable({
  providedIn: 'root',
})
export class InsightsService {
  private readonly supabase = inject(Supabase);
  private readonly tenantService = inject(TenantService);
  private readonly notifications = inject(NotificationsService);
  private readonly ordersService = inject(OrdersService);
  private readonly analytics = inject(AnalyticsService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly cartsService = inject(AbandonedCartService);
  private readonly discountsService = inject(DiscountsService);

  private refreshedTenants = new Set<string>();
  private memoryFallback = new Map<string, InsightMemory>();

  async refreshInsights(): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId || this.refreshedTenants.has(tenantId)) return;
    this.refreshedTenants.add(tenantId);

    await Promise.allSettled([
      this.refreshMorningBriefing(),
      this.refreshVelocityAlerts(),
      this.refreshReviewDigest(),
      this.refreshCartDigest(),
      this.refreshSalesRecord(),
      this.refreshCouponAlerts(),
      this.refreshSubscriptionReminder(),
    ]);
  }

  /** Resumen de la mañana al primer ingreso: envíos pendientes, ventas y alertas. */
  async refreshMorningBriefing(): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return;
    const day = this.todayKey();
    if (!this.claim(`briefing:${day}`)) return;

    try {
      const [statsRes, dashboardRes, lowRes, reviewsRes, cartsRes] = await Promise.allSettled([
        this.ordersService.getOrderStats(),
        this.analytics.getDashboardStats(),
        this.countLowStock(),
        this.reviewsService.getReviewStats(),
        this.cartsService.getAbandonedCarts(24),
      ]);

      const pending = statsRes.status === 'fulfilled' ? statsRes.value.pendingFulfillment : 0;
      const dashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value : null;
      const todayRevenue = dashboard?.today_revenue ?? 0;
      const lowCount = lowRes.status === 'fulfilled' ? lowRes.value : 0;
      const reviewsPending = reviewsRes.status === 'fulfilled' ? reviewsRes.value.pending : 0;
      const carts = cartsRes.status === 'fulfilled' ? cartsRes.value : [];

      const noteworthy =
        pending > 0 || todayRevenue > 0 || lowCount > 0 || reviewsPending > 0 || carts.length > 0;
      if (!noteworthy) {
        this.release(`briefing:${day}`);
        return;
      }

      const parts: string[] = [];
      if (pending > 0) {
        parts.push(
          `${pending} ${pending === 1 ? 'orden pendiente de envío' : 'órdenes pendientes de envío'}`,
        );
      }
      if (todayRevenue > 0) parts.push(`${this.money(todayRevenue)} en ventas hoy`);
      if (lowCount > 0)
        parts.push(
          `${lowCount} ${lowCount === 1 ? 'producto por agotarse' : 'productos por agotarse'}`,
        );
      if (reviewsPending > 0)
        parts.push(
          `${reviewsPending} ${reviewsPending === 1 ? 'reseña por moderar' : 'reseñas por moderar'}`,
        );
      if (carts.length > 0)
        parts.push(
          `${carts.length} ${carts.length === 1 ? 'carrito abandonado' : 'carritos abandonados'} por recuperar`,
        );

      await this.notify(
        'morning_briefing',
        this.greeting(),
        `${parts.join('. ')}.`,
        '/dashboard',
        `briefing:${day}`,
      );
    } catch (error) {
      console.error('Error generando resumen matutino:', error);
      this.release(`briefing:${day}`);
    }
  }

  /** Alerta cuando un producto se agotará pronto según su velocidad de venta. */
  async refreshVelocityAlerts(): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return;
    const day = this.todayKey();
    if (!this.claim(`velocity:${day}`)) return;

    try {
      const { data, error } = await this.supabase.client
        .from('vw_low_stock_alerts')
        .select('id,name,sku,stock_quantity,days_of_stock_remaining,average_daily_sales')
        .eq('tenant_id', tenantId)
        .limit(50);
      if (error) throw error;

      const atRisk = ((data ?? []) as LowStockRow[])
        .filter(
          (row) =>
            row.days_of_stock_remaining != null &&
            row.days_of_stock_remaining > 0 &&
            row.days_of_stock_remaining <= VELOCITY_COVER_WARN_DAYS,
        )
        .sort((a, b) => (a.days_of_stock_remaining ?? 99) - (b.days_of_stock_remaining ?? 99))
        .slice(0, MAX_VELOCITY_ITEMS);

      if (atRisk.length === 0) {
        this.release(`velocity:${day}`);
        return;
      }

      const detail = atRisk
        .map(
          (row) =>
            `${row.name || 'Producto'} (quedan ${row.stock_quantity ?? 0}, ~${Math.ceil(row.days_of_stock_remaining ?? 0)} ${Math.ceil(row.days_of_stock_remaining ?? 0) === 1 ? 'día' : 'días'})`,
        )
        .join('; ');
      await this.notify(
        'stock_velocity',
        atRisk.length === 1 ? 'Producto por agotarse' : `${atRisk.length} productos por agotarse`,
        `Según la velocidad de venta: ${detail}.`,
        '/products',
        `velocity:${day}`,
      );
    } catch (error) {
      console.error('Error calculando velocidad de inventario:', error);
      this.release(`velocity:${day}`);
    }
  }

  /** Digest diario de reseñas pendientes de moderación. */
  async refreshReviewDigest(): Promise<void> {
    if (!this.tenantService.tenantId()) return;
    const day = this.todayKey();
    if (!this.claim(`reviews:${day}`)) return;

    try {
      const stats = await this.reviewsService.getReviewStats();
      if (!stats || stats.pending <= 0) {
        this.release(`reviews:${day}`);
        return;
      }
      await this.notify(
        'review_digest',
        stats.pending === 1 ? 'Reseña por moderar' : `${stats.pending} reseñas por moderar`,
        `Tienes ${stats.pending} ${stats.pending === 1 ? 'reseña pendiente de aprobación' : 'reseñas pendientes de aprobación'} de tus clientes.`,
        '/reviews',
        `reviews:${day}`,
      );
    } catch (error) {
      console.error('Error generando digest de reseñas:', error);
      this.release(`reviews:${day}`);
    }
  }

  /** Digest diario de carritos abandonados con potencial recuperable. */
  async refreshCartDigest(): Promise<void> {
    if (!this.tenantService.tenantId()) return;
    const day = this.todayKey();
    if (!this.claim(`carts:${day}`)) return;

    try {
      const carts = await this.cartsService.getAbandonedCarts(24);
      const potential = carts.reduce((sum, cart) => sum + Number(cart.total_amount || 0), 0);
      if (carts.length === 0 || potential <= 0) {
        this.release(`carts:${day}`);
        return;
      }
      await this.notify(
        'cart_digest',
        'Carritos por recuperar',
        `${carts.length} ${carts.length === 1 ? 'carrito abandonado' : 'carritos abandonados'} con ${this.money(potential)} de potencial en las últimas 24 horas.`,
        '/abandoned-carts',
        `carts:${day}`,
      );
    } catch (error) {
      console.error('Error generando digest de carritos:', error);
      this.release(`carts:${day}`);
    }
  }

  /** Aviso cuando las ventas de hoy superan el promedio de 7 días. */
  async refreshSalesRecord(): Promise<void> {
    if (!this.tenantService.tenantId()) return;
    const day = this.todayKey();
    if (!this.claim(`sales:${day}`)) return;

    try {
      const rows = (await this.analytics.getFullDailySalesSummary(8)) as {
        date: string | null;
        total_revenue: number | null;
      }[];
      const today = rows.find((row) => row.date?.slice(0, 10) === day);
      const previous = rows.filter((row) => row.date && row.date.slice(0, 10) !== day);
      const todayRevenue = Number(today?.total_revenue ?? 0);
      const average =
        previous.length >= 3
          ? previous.reduce((sum, row) => sum + Number(row.total_revenue ?? 0), 0) / previous.length
          : 0;

      if (!(todayRevenue > 0 && average > 0 && todayRevenue >= average * SALES_SPIKE_MULTIPLIER)) {
        this.release(`sales:${day}`);
        return;
      }
      const uplift = Math.round(((todayRevenue - average) / average) * 100);
      await this.notify(
        'sales_record',
        'Día récord en ventas',
        `Hoy llevas ${this.money(todayRevenue)}, un ${uplift}% por encima de tu promedio de 7 días.`,
        '/reports',
        `sales:${day}`,
      );
    } catch (error) {
      console.error('Error evaluando récord de ventas:', error);
      this.release(`sales:${day}`);
    }
  }

  /** Aviso de cupones activos que vencen pronto. */
  async refreshCouponAlerts(): Promise<void> {
    if (!this.tenantService.tenantId()) return;
    const day = this.todayKey();
    if (!this.claim(`coupons:${day}`)) return;

    try {
      const { data } = await this.discountsService.getDiscountCodes();
      const now = Date.now();
      const expiring = (data ?? []).filter((coupon) => {
        if (!coupon.is_active || !coupon.ends_at) return false;
        const remaining = Math.ceil((new Date(coupon.ends_at).getTime() - now) / DAY_MS);
        return remaining >= 0 && remaining <= COUPON_WARN_DAYS;
      });

      if (expiring.length === 0) {
        this.release(`coupons:${day}`);
        return;
      }
      const names = expiring
        .slice(0, 2)
        .map((coupon) => coupon.code)
        .join(', ');
      await this.notify(
        'coupon_expiring',
        expiring.length === 1 ? 'Cupón por vencer' : `${expiring.length} cupones por vencer`,
        expiring.length === 1
          ? `El cupón ${names} vence pronto. Revísalo antes de que expire.`
          : `${names}${expiring.length > 2 ? ` y ${expiring.length - 2} más` : ''} vencen en los próximos ${COUPON_WARN_DAYS} días.`,
        '/coupons',
        `coupons:${day}`,
      );
    } catch (error) {
      console.error('Error evaluando vencimiento de cupones:', error);
      this.release(`coupons:${day}`);
    }
  }

  /** Recordatorio cuando la membresía o el trial están por vencer. */
  async refreshSubscriptionReminder(): Promise<void> {
    const tenant = this.tenantService.tenant();
    if (!tenant || tenant.plan === 'free') return;
    const day = this.todayKey();
    if (!this.claim(`subscription:${day}`)) return;

    try {
      const isTrial = tenant.plan_status === 'trial';
      const expiryRaw = isTrial ? tenant.trial_ends_at : tenant.subscription_ends_at;
      if (!expiryRaw) {
        this.release(`subscription:${day}`);
        return;
      }
      const remaining = Math.ceil((new Date(expiryRaw).getTime() - Date.now()) / DAY_MS);
      if (remaining < 0 || remaining > SUBSCRIPTION_WARN_DAYS) {
        this.release(`subscription:${day}`);
        return;
      }
      const when = remaining === 0 ? 'hoy' : remaining === 1 ? 'mañana' : `en ${remaining} días`;
      await this.notify(
        'subscription_expiring',
        isTrial ? 'Tu prueba termina pronto' : 'Tu membresía vence pronto',
        isTrial
          ? `Tu periodo de prueba termina ${when}. Elige un plan para no interrumpir tu tienda.`
          : `Tu membresía vence ${when}. Renuévala para mantener tu tienda activa.`,
        '/subscription',
        `subscription:${day}`,
      );
    } catch (error) {
      console.error('Error evaluando vencimiento de membresía:', error);
      this.release(`subscription:${day}`);
    }
  }

  private async notify(
    type: NotificationType,
    title: string,
    message: string,
    link: string,
    key: string,
  ): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) {
      this.release(key);
      return;
    }
    await this.notifications.createNotification({
      tenant_id: tenantId,
      type,
      title,
      message,
      link,
      metadata: { insight: key },
    } as never);
  }

  private async countLowStock(): Promise<number> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return 0;
    const { count, error } = await this.supabase.client
      .from('vw_low_stock_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return count ?? 0;
  }

  private greeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  private money(value: number): string {
    const currency = this.tenantService.currency?.() ?? 'USD';
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  private todayKey(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${date}`;
  }

  /** Reserva una clave de dedup diario. Retorna false si ya se notificó hoy. */
  private claim(key: string): boolean {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return false;
    const memory = this.readMemory(tenantId);
    const day = this.todayKey();
    if (memory.day !== day) {
      memory.day = day;
      memory.keys = [];
    }
    if (memory.keys.includes(key)) return false;
    memory.keys.push(key);
    this.writeMemory(tenantId, memory);
    return true;
  }

  private release(key: string): void {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return;
    const memory = this.readMemory(tenantId);
    memory.keys = memory.keys.filter((existing) => existing !== key);
    this.writeMemory(tenantId, memory);
  }

  private readMemory(tenantId: string): InsightMemory {
    const fallback = this.memoryFallback.get(tenantId);
    if (fallback) return { day: fallback.day, keys: [...fallback.keys] };
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${tenantId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as InsightMemory;
        if (parsed && typeof parsed.day === 'string' && Array.isArray(parsed.keys)) {
          return parsed;
        }
      }
    } catch {
      // localStorage no disponible (SSR/tests): se usa memoria de sesión.
    }
    return { day: '', keys: [] };
  }

  private writeMemory(tenantId: string, memory: InsightMemory): void {
    this.memoryFallback.set(tenantId, { day: memory.day, keys: [...memory.keys] });
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${tenantId}`, JSON.stringify(memory));
    } catch {
      // Sin persistencia: la memoria de sesión evita duplicados.
    }
  }
}
