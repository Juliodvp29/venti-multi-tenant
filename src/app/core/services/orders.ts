import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { Order, OrderItem, OrderStatusHistory } from '@core/models/order';
import { Payment } from '@core/models/payment';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@core/enums';
import { TenantService } from './tenant';
import { AuthService } from './auth';
import { NotificationsService } from './notifications';
import { EmailService } from './email';
import { Database } from '../types/database.types';

export interface OrderStats {
  totalThisMonth: number;
  pendingFulfillment: number;
  revenueToday: number;
  revenuePrevDay: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  customer_id?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly supabase = inject(Supabase);
  private readonly tenantService = inject(TenantService);
  private readonly authService = inject(AuthService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly emailService = inject(EmailService);

  async getOrders(
    page: number = 1,
    pageSize: number = 20,
    filters?: OrderFilters,
    options?: { columns?: string; withCount?: boolean },
  ): Promise<{ data: Order[]; count: number }> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return { data: [], count: 0 };

    const columns = options?.columns ?? '*';
    const withCount = options?.withCount ?? true;

    // Nota: se pasa siempre el objeto de opciones para no cambiar la sobrecarga
    // de tipos de postgrest; `count: undefined` equivale a no pedir COUNT.
    let query = this.supabase.client
      .from('orders')
      .select(columns, { count: withCount ? 'exact' : undefined })
      .eq('tenant_id', tenantId);

    // Apply delivery person filter if the current user has the 'delivery' role
    const role = this.tenantService.memberRole();
    const userId = this.authService.user()?.id;
    if (role === 'delivery' && userId) {
      query = query.eq('delivery_person_id', userId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }

    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.search) {
      const term = `%${filters.search}%`;
      query = query.or(`order_number.ilike.${term},customer_email.ilike.${term}`);
    }

    const sortField = filters?.sortField || 'created_at';
    const sortAscending = filters?.sortDirection === 'asc';
    query = query.order(sortField, { ascending: sortAscending });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: (data ?? []) as unknown as Order[], count: count ?? 0 };
  }

  async createOrder(
    orderData: Partial<Order>,
    items: Partial<OrderItem>[],
    paymentData?: Partial<Payment>,
    discountData?: {
      codeId: string;
      customerId: string;
      discountAmount: number;
    },
  ): Promise<Order> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) throw new Error('Tenant not selected');

    const orderId = crypto.randomUUID();
    const fallbackOrderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const orderPayload = {
      id: orderId,
      ...orderData,
      tenant_id: tenantId,
      order_number: orderData.order_number || fallbackOrderNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Execute checkout procedure with order and items to properly register inventory changes and audit logs
    // This RPC inserts the order, items, and triggers stock updates
    try {
      const orderItemsForRpc = items.map((item) => {
        const itemObj: any = {
          id: item.id || crypto.randomUUID(),
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price?.toString() || '0',
          discount_amount: item.discount_amount?.toString() || '0',
          tax_amount: item.tax_amount?.toString() || '0',
          total_amount: item.total_amount?.toString() || '0',
          created_at: new Date().toISOString(),
        };

        // Only add optional fields if they have values
        if (item.variant_id) itemObj.variant_id = item.variant_id;
        if (item.product_sku) itemObj.product_sku = item.product_sku;
        if (item.variant_name) itemObj.variant_name = item.variant_name;
        if (item.product_snapshot) itemObj.product_snapshot = item.product_snapshot;

        return itemObj;
      });

      // Build order object carefully, only including defined fields
      const orderObj: any = {
        id: orderPayload.id,
        tenant_id: orderPayload.tenant_id,
        customer_id: orderPayload.customer_id,
        order_number: orderPayload.order_number,
        status: orderPayload.status,
        payment_status: orderPayload.payment_status,
        subtotal: orderPayload.subtotal?.toString() || '0',
        discount_amount: orderPayload.discount_amount?.toString() || '0',
        tax_amount: orderPayload.tax_amount?.toString() || '0',
        shipping_amount: orderPayload.shipping_amount?.toString() || '0',
        total_amount: orderPayload.total_amount?.toString() || '0',
        currency: orderPayload.currency || 'USD',
        customer_email: orderPayload.customer_email,
        payment_method:
          paymentData?.payment_method || orderData.payment_method || PaymentMethod.CreditCard,
      };

      // Only add optional fields if they have values
      if (orderPayload.customer_first_name)
        orderObj.customer_first_name = orderPayload.customer_first_name;
      if (orderPayload.customer_last_name)
        orderObj.customer_last_name = orderPayload.customer_last_name;
      if (orderPayload.customer_phone) orderObj.customer_phone = orderPayload.customer_phone;

      const { data: rpcResult, error: rpcError } = await this.supabase.client.rpc(
        'checkout_create_order_with_items',
        {
          p_order: orderObj as any,
          p_items: orderItemsForRpc as any,
          p_reason: 'Venta',
        },
      );

      if (rpcError) {
        console.error('[OrdersService] RPC error:', rpcError);
        throw rpcError;
      }

      // Fetch the created order from the database
      const { data: order, error: fetchError } = await this.supabase.client
        .from('orders')
        .select('*')
        .eq('order_number', orderPayload.order_number)
        .single();

      if (fetchError) throw fetchError;
      if (!order) throw new Error('Order not found after creation');

      // Insert payment record if provided
      if (paymentData) {
        try {
          await this.supabase.client.from('payments').insert({
            tenant_id: tenantId,
            order_id: order.id,
            payment_method:
              paymentData.payment_method || (orderData as any).payment_method || 'credit_card',
            amount: paymentData.amount || orderData.total_amount || 0,
            currency: paymentData.currency || orderData.currency || 'USD',
            status: paymentData.status || (orderData.payment_status as any) || 'completed',
            gateway: paymentData.gateway || 'credit_card_checkout',
            gateway_response: (paymentData.payment_details || {}) as any,
            processed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          } as any);
        } catch (pError) {
          console.warn('[OrdersService] Could not insert payment record:', pError);
        }
      }

      if (discountData) {
        try {
          const usageInsert = {
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            customer_id: discountData.customerId,
            discount_code_id: discountData.codeId,
            order_id: order.id,
            discount_amount: discountData.discountAmount,
            created_at: new Date().toISOString(),
          };

          const { error: usageError } = await this.supabase.client
            .from('discount_usage')
            .insert(usageInsert as any);

          if (usageError) throw usageError;

          const { data: discountCode, error: codeFetchError } = await this.supabase.client
            .from('discount_codes')
            .select('id, usage_count')
            .eq('id', discountData.codeId)
            .single();

          if (!codeFetchError && discountCode) {
            await this.supabase.client
              .from('discount_codes')
              .update({
                usage_count: (discountCode.usage_count ?? 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('id', discountCode.id);
          }
        } catch (discountError) {
          console.warn('[OrdersService] Could not register discount usage:', discountError);
        }
      }

      // Insert initial status history entry
      try {
        const initialStatus = (orderData as any).status || OrderStatus.Pending;
        await this.supabase.client.from('order_status_history' as any).insert({
          order_id: order.id,
          tenant_id: tenantId,
          new_status: initialStatus,
          old_status: null,
          changed_by: null,
          note: 'Orden creada por el cliente desde la tienda',
          created_at: new Date().toISOString(),
        } as any);
      } catch (histErr) {
        console.warn('[OrdersService] Could not insert initial status history:', histErr);
      }

      // Create notification for the new order
      try {
        const orderNumber = (order as any).order_number || `#${order.id.slice(-6).toUpperCase()}`;
        const totalAmount = orderData.total_amount ?? 0;
        const currency = orderData.currency || 'COP';
        await this.notificationsService.createNotification({
          tenant_id: tenantId,
          type: 'order_created',
          title: `Nueva Orden ${orderNumber}`,
          message: `Se recibió un nuevo pedido por ${new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(totalAmount)} de ${orderData.customer_email || 'cliente'}`,
          link: `/orders/${order.id}`,
          metadata: { order_id: order.id, order_number: orderNumber },
        } as any);
      } catch (notifErr) {
        console.warn('[OrdersService] Could not create order notification:', notifErr);
      }

      // Send order confirmation email to customer (non-blocking)
      try {
        const customerEmail = orderData.customer_email;
        if (customerEmail) {
          const orderNumber = (order as any).order_number || `#${order.id.slice(-6).toUpperCase()}`;
          const totalAmount = orderData.total_amount ?? 0;
          const currency = orderData.currency || 'COP';
          const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(totalAmount);
          const customerName = `${orderData.customer_first_name || orderData.shipping_first_name || ''} ${orderData.customer_last_name || orderData.shipping_last_name || ''}`.trim() || 'Cliente';
          const tenant = this.tenantService.tenant();
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

          void this.emailService.sendOrderConfirmation({
            to: customerEmail,
            orderId: order.id,
            orderNumber,
            customerName,
            totalFormatted: formattedTotal,
            storeName: tenant?.business_name || 'Venti Shop',
            extraVariables: {
              order_total: formattedTotal,
              order_url: `${baseUrl}/store/${tenant?.slug || ''}/orders/${order.id}`,
            },
          }).catch(err => console.warn('[OrdersService] Could not send order confirmation email:', err));
        }
      } catch (emailErr) {
        console.warn('[OrdersService] Could not dispatch order confirmation email:', emailErr);
      }

      return order as unknown as Order;
    } catch (error) {
      console.error('[OrdersService] Error creating order:', error);
      throw error;
    }
  }

  async getOrder(id: string): Promise<Order | null> {
    let query = this.supabase.client
      .from('orders')
      .select(
        `
                *,
                items:order_items(*, product:products(images:product_images(url, is_primary))),
                status_history:order_status_history(*),
                refunds:refunds(*)
            `,
      )
      .eq('id', id);

    // Apply delivery person filter if the current user has the 'delivery' role
    const role = this.tenantService.memberRole();
    const userId = this.authService.user()?.id;
    if (role === 'delivery' && userId) {
      query = query.eq('delivery_person_id', userId);
    }

    const { data, error } = await query.single();

    if (error) throw error;

    // Sort status history ascending by date
    if (data?.status_history) {
      (data.status_history as OrderStatusHistory[]).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    }

    return data as Order;
  }

  async getOrderStats(): Promise<OrderStats> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId)
      return { totalThisMonth: 0, pendingFulfillment: 0, revenueToday: 0, revenuePrevDay: 0 };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfYesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
    ).toISOString();

    let monthQuery = this.supabase.client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth);
    let pendingQuery = this.supabase.client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'processing', 'paid']);
    let todayQuery = this.supabase.client
      .from('orders')
      .select('total_amount')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfToday)
      .neq('status', 'cancelled')
      .neq('status', 'refunded');
    let yesterdayQuery = this.supabase.client
      .from('orders')
      .select('total_amount')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfYesterday)
      .lt('created_at', startOfToday)
      .neq('status', 'cancelled')
      .neq('status', 'refunded');

    // Apply delivery role filter
    const role = this.tenantService.memberRole();
    const userId = this.authService.user()?.id;
    if (role === 'delivery' && userId) {
      monthQuery = monthQuery.eq('delivery_person_id', userId);
      pendingQuery = pendingQuery.eq('delivery_person_id', userId);
      todayQuery = todayQuery.eq('delivery_person_id', userId);
      yesterdayQuery = yesterdayQuery.eq('delivery_person_id', userId);
    }

    const [monthRes, pendingRes, todayRes, yesterdayRes] = await Promise.all([
      monthQuery,
      pendingQuery,
      todayQuery,
      yesterdayQuery,
    ]);

    const revenueToday = (todayRes.data ?? []).reduce(
      (s: number, o: any) => s + (o.total_amount ?? 0),
      0,
    );
    const revenuePrevDay = (yesterdayRes.data ?? []).reduce(
      (s: number, o: any) => s + (o.total_amount ?? 0),
      0,
    );

    return {
      totalThisMonth: monthRes.count ?? 0,
      pendingFulfillment: pendingRes.count ?? 0,
      revenueToday,
      revenuePrevDay,
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) throw new Error('Tenant not selected');

    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === OrderStatus.Paid) {
      updateData['payment_status'] = PaymentStatus.Completed;
    } else if (status === OrderStatus.Refunded) {
      updateData['payment_status'] = PaymentStatus.Refunded;
    }

    const { error } = await this.supabase.client
      .from('orders')
      .update(updateData as any)
      .eq('id', id);

    if (error) throw error;
  }

  async updatePaymentStatus(id: string, payment_status: PaymentStatus): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({ payment_status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async updateInternalNote(id: string, note: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({ internal_note: note, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async addTrackingInfo(
    id: string,
    info: { tracking_number?: string; tracking_url?: string; shipping_method?: string },
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({
        shipping_method: info.shipping_method ?? null,
        tracking_number: info.tracking_number ?? null,
        tracking_url: info.tracking_url ?? null,
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    // Send shipping notification email (non-blocking)
    try {
      const { data: order } = await this.supabase.client
        .from('orders')
        .select('id, order_number, customer_email, customer_first_name, customer_last_name, shipping_first_name, shipping_last_name')
        .eq('id', id)
        .maybeSingle();

      if (order?.customer_email) {
        const tenant = this.tenantService.tenant();
        const customerName = `${order.customer_first_name || order.shipping_first_name || ''} ${order.customer_last_name || order.shipping_last_name || ''}`.trim() || 'Cliente';
        const orderNumber = order.order_number || `#${id.slice(-6).toUpperCase()}`;

        void this.emailService.sendShippingNotification({
          to: order.customer_email,
          orderId: id,
          orderNumber,
          customerName,
          carrier: info.shipping_method ?? '',
          trackingNumber: info.tracking_number ?? '',
          trackingUrl: info.tracking_url ?? '',
          storeName: tenant?.business_name || 'Venti Shop',
        }).catch(err => console.warn('[OrdersService] Shipping email notification error:', err));
      }
    } catch (notifErr) {
      console.warn('[OrdersService] Could not dispatch shipping notification email:', notifErr);
    }
  }

  async assignDeliveryPerson(id: string, delivery_person_id: string | null): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({
        delivery_person_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  async cancelOrder(id: string, reason: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({
        status: OrderStatus.Cancelled,
        cancelled_at: new Date().toISOString(),
        cancelled_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    // Send cancellation notification email (non-blocking)
    try {
      const { data: order } = await this.supabase.client
        .from('orders')
        .select('id, order_number, customer_email, customer_first_name, customer_last_name, shipping_first_name, shipping_last_name')
        .eq('id', id)
        .maybeSingle();

      if (order?.customer_email) {
        const tenant = this.tenantService.tenant();
        const customerName = `${order.customer_first_name || order.shipping_first_name || ''} ${order.customer_last_name || order.shipping_last_name || ''}`.trim() || 'Cliente';
        const orderNumber = order.order_number || `#${id.slice(-6).toUpperCase()}`;

        void this.emailService.sendEmail({
          to: order.customer_email,
          templateKey: 'order_cancelled',
          orderId: id,
          variables: {
            order_number: orderNumber,
            customer_name: customerName,
            cancel_reason: reason,
            store_name: tenant?.business_name || 'Venti Shop',
          },
        }).catch(err => console.warn('[OrdersService] Order cancelled email error:', err));
      }
    } catch (notifErr) {
      console.warn('[OrdersService] Could not dispatch order cancelled email:', notifErr);
    }
  }

  async processRefund(
    order: Order,
    amount: number,
    reason: string,
    returnToStock: boolean,
  ): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) throw new Error('Tenant not selected');

    // 1. Insert refund record
    const { error: refundError } = await this.supabase.client.from('refunds').insert({
      tenant_id: tenantId,
      order_id: order.id,
      amount,
      reason,
      status: 'completed',
      processed_at: new Date().toISOString(),
    });

    if (refundError) throw refundError;

    // 2. Update order payment status
    const totalRefundedSoFar = (order.refunds?.reduce((sum, r) => sum + r.amount, 0) || 0) + amount;
    const newPaymentStatus =
      totalRefundedSoFar >= order.total_amount
        ? PaymentStatus.Refunded
        : PaymentStatus.PartiallyRefunded;

    const { error: orderError } = await this.supabase.client
      .from('orders')
      .update({
        payment_status: newPaymentStatus,
        status: totalRefundedSoFar >= order.total_amount ? OrderStatus.Refunded : order.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (orderError) throw orderError;

    // 3. Return items to stock if requested
    if (returnToStock && order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.product_id) {
          // Get current product stock
          const { data: product, error: productError } = await this.supabase.client
            .from('products')
            .select('stock_quantity, track_inventory')
            .eq('id', item.product_id)
            .single();

          if (!productError && product && product.track_inventory) {
            await this.supabase.client
              .from('products')
              .update({ stock_quantity: (product.stock_quantity || 0) + item.quantity })
              .eq('id', item.product_id);
          }
        }

        // If variant_id exists, also return to variant stock if tracked
        if (item.variant_id) {
          const { data: variant, error: variantError } = await this.supabase.client
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', item.variant_id)
            .single();

          if (!variantError && variant) {
            await this.supabase.client
              .from('product_variants')
              .update({ stock_quantity: (variant.stock_quantity || 0) + item.quantity })
              .eq('id', item.variant_id);
          }
        }
      }
    }

    // 4. Add status history entry
    await this.supabase.client.from('order_status_history').insert({
      order_id: order.id,
      tenant_id: tenantId,
      new_status: totalRefundedSoFar >= order.total_amount ? OrderStatus.Refunded : order.status,
      note: `Refund of $${amount} processed for reason: ${reason}`,
    });

    // 5. Send refund notification email (non-blocking)
    try {
      if (order.customer_email) {
        const tenant = this.tenantService.tenant();
        const customerName = `${order.customer_first_name || order.shipping_first_name || ''} ${order.customer_last_name || order.shipping_last_name || ''}`.trim() || 'Cliente';
        const orderNumber = order.order_number || `#${order.id.slice(-6).toUpperCase()}`;
        const currency = order.currency || 'COP';
        const formattedAmount = new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(amount);

        void this.emailService.sendEmail({
          to: order.customer_email,
          templateKey: 'refund_processed',
          orderId: order.id,
          variables: {
            order_number: orderNumber,
            customer_name: customerName,
            refund_amount: formattedAmount,
            refund_reason: reason,
            store_name: tenant?.business_name || 'Venti Shop',
          },
        }).catch(err => console.warn('[OrdersService] Refund email error:', err));
      }
    } catch (notifErr) {
      console.warn('[OrdersService] Could not dispatch refund email:', notifErr);
    }
  }
}
