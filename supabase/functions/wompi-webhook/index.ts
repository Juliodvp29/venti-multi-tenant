// Deno Edge Function: wompi-webhook
// Multi-Tenant Webhook for Wompi Payments in Venti Shop

type WompiPayload = {
  event?: string;
  data?: {
    transaction?: {
      id?: string;
      status?: string;
      amount_in_cents?: number;
      amountInCents?: number;
      amount?: number;
      reference?: string;
    };
  };
  signature?: {
    properties?: string[];
    checksum?: string;
  };
  timestamp?: number | string;
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  return JSON.stringify(v);
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const bytes = enc.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceRole) {
    return jsonResponse({ error: 'Missing Supabase server credentials' }, 500);
  }

  const headerChecksum = req.headers.get('X-Event-Checksum');

  const raw = await req.text();
  let payload: WompiPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const event = payload.event;
  const tx = payload.data?.transaction;
  const signature = payload.signature;

  if (!event || !tx?.id) {
    return jsonResponse({ error: 'Missing event or transaction.id' }, 400);
  }

  if (event !== 'transaction.updated') {
    return jsonResponse({ ok: true, ignored: true, reason: 'event not handled' });
  }

  const { createClient } = await import('npm:@supabase/supabase-js@2.45.6');
  const supabase = createClient(supabaseUrl, supabaseServiceRole);

  // 1. Locate Payment or Order (by tx.id or reference)
  let payment: any = null;
  let order: any = null;

  if (tx.reference) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tx.reference);
    let orderQuery = supabase
      .from('orders')
      .select('id, tenant_id, status, payment_status, total_amount, currency');

    if (isUuid) {
      orderQuery = orderQuery.or(`id.eq.${tx.reference},order_number.eq.${tx.reference}`);
    } else {
      orderQuery = orderQuery.eq('order_number', tx.reference);
    }

    const { data: foundOrder } = await orderQuery.maybeSingle();
    order = foundOrder;
  }

  const { data: foundPayment } = await supabase
    .from('payments')
    .select('id, tenant_id, order_id, amount, currency, gateway_transaction_id, status')
    .or(`gateway_transaction_id.eq.${tx.id},order_id.eq.${tx.reference}`)
    .maybeSingle();

  payment = foundPayment;

  if (!order && payment?.order_id) {
    const { data: foundOrder } = await supabase
      .from('orders')
      .select('id, tenant_id, status, payment_status, total_amount, currency')
      .eq('id', payment.order_id)
      .maybeSingle();

    order = foundOrder;
  }

  const tenantId = order?.tenant_id || payment?.tenant_id;

  // 2. Fetch tenant BYOK Wompi Secret Key
  let wompiSecret = Deno.env.get('WOMPI_WEBHOOK_SECRET') || '';
  let tenant: any = null;

  if (tenantId) {
    const [{ data: tenantData }, { data: secrets }] = await Promise.all([
      supabase.from('tenants').select('id, plan, settings').eq('id', tenantId).maybeSingle(),
      supabase.from('tenant_payment_secrets').select('wompi_webhook_secret').eq('tenant_id', tenantId).maybeSingle(),
    ]);

    tenant = tenantData;
    const paymentMethods = tenant?.settings?.payment_methods || {};
    const onlineConfig =
      paymentMethods.online_payment?.config || paymentMethods.credit_card?.config || {};
    if (secrets?.wompi_webhook_secret) {
      wompiSecret = secrets.wompi_webhook_secret;
    } else if (onlineConfig.wompi?.webhook_secret) {
      wompiSecret = onlineConfig.wompi.webhook_secret;
    }
  }

  // 3. Verificación checksum (SHA256(props_values + timestamp + event_secret))
  const props = signature?.properties;
  const bodyChecksum = signature?.checksum;
  const timestamp = payload.timestamp;

  if (wompiSecret && props && Array.isArray(props) && (headerChecksum || bodyChecksum) && timestamp !== undefined) {
    const propValues: string[] = [];

    for (const p of props) {
      if (p === 'transaction.id') propValues.push(getString(tx.id));
      else if (p === 'transaction.status') propValues.push(getString(tx.status));
      else if (p === 'transaction.amountInCents') {
        propValues.push(getString((tx as any).amountInCents ?? tx.amount_in_cents ?? null));
      } else {
        return jsonResponse({ error: `Unknown signature property: ${p}` }, 400);
      }
    }

    const message = propValues.join('') + getString(timestamp) + wompiSecret;
    const computed = await sha256Hex(message);

    const provided = headerChecksum ?? bodyChecksum;
    if (provided && computed.toLowerCase() !== provided.toLowerCase()) {
      return jsonResponse({ error: 'Webhook checksum mismatch' }, 400);
    }
  }

  const isApproved = tx.status === 'APPROVED';
  const isFailed = tx.status === 'DECLINED' || tx.status === 'ERROR';

  const newPaymentStatus = isApproved ? 'completed' : isFailed ? 'failed' : 'pending';
  const newOrderStatus = isApproved ? 'paid' : isFailed ? 'cancelled' : order?.status || 'pending';

  // 4. Update or Insert Payment
  if (payment) {
    await supabase
      .from('payments')
      .update({
        status: newPaymentStatus,
        gateway: 'wompi',
        gateway_transaction_id: tx.id,
        gateway_response: payload as any,
        processed_at: new Date().toISOString(),
      })
      .eq('id', payment.id);
  } else if (order) {
    const { data: insertedPayment } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        order_id: order.id,
        payment_method: 'online_payment',
        amount: order.total_amount,
        currency: order.currency || 'COP',
        status: newPaymentStatus,
        gateway: 'wompi',
        gateway_transaction_id: tx.id,
        gateway_response: payload as any,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select('id, status')
      .single();

    payment = insertedPayment;
  }

  // 5. Update Order to 'paid'
  if (order) {
    await supabase
      .from('orders')
      .update({
        payment_status: newPaymentStatus,
        status: newOrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
  }

  // 6. Process Commission if Approved
  if (isApproved && tenant && payment) {
    const { data: existingCommission } = await supabase
      .from('commissions')
      .select('id')
      .eq('payment_id', payment.id)
      .maybeSingle();

    if (!existingCommission) {
      const { data: rule } = await supabase
        .from('commission_rules')
        .select('commission_rate')
        .eq('plan', tenant.plan)
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rule) {
        const paymentAmount = Number(payment.amount || order?.total_amount || 0);
        const commissionRate = Number(rule.commission_rate);
        const rateAsFraction = commissionRate <= 1 ? commissionRate : commissionRate / 100;
        const commissionAmount = paymentAmount * rateAsFraction;

        await supabase.from('commissions').insert({
          tenant_id: tenant.id,
          gateway: 'wompi',
          gateway_transaction_id: tx.id,
          payment_amount: paymentAmount,
          commission_rate_applied: commissionRate,
          commission_amount: commissionAmount,
          status: 'pending',
          payment_id: payment.id,
          metadata: {
            wompi_event: event,
            wompi_status: tx.status,
            wompi_reference: (tx as any).reference ?? null,
            order_id: order?.id ?? null,
          },
        });
      }
    }
  }

  return jsonResponse({ ok: true, order_id: order?.id, status: newPaymentStatus });
});
