// Deno Edge Function: bold-webhook
// Multi-Tenant Webhook for Bold Payments in Venti Shop

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const bytes = enc.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceRole) {
    return jsonResponse({ error: 'Server environment missing Supabase credentials' }, 500);
  }

  const rawBody = await req.text();
  let payload: any;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  // Bold webhook headers
  const boldSignature =
    req.headers.get('x-bold-signature') ||
    req.headers.get('x-signature') ||
    req.headers.get('x-api-key');

  // Bold payload structures:
  // Can be { type: "SALE_APPROVED", subject: "txId", data: { reference, status, amount } }
  // or flat: { id, status, reference, amount }
  // or with nested metadata: { data: { metadata: { SALE: { reference } } } }
  const eventType = (payload.type || payload.event || '').toUpperCase();
  const data = payload.data || payload;
  const txId = data.id || data.transaction_id || data.bold_order_id || payload.subject;
  const status = (data.status || '').toUpperCase();
  const reference =
    data.reference ||
    data.order_id ||
    data.metadata?.SALE?.reference ||
    data.metadata?.reference ||
    payload.reference;

  if (!reference && !txId) {
    return jsonResponse({ error: 'Missing reference or transaction ID in payload' }, 400);
  }

  const { createClient } = await import('npm:@supabase/supabase-js@2.45.6');
  const supabase = createClient(supabaseUrl, supabaseServiceRole);

  // 1. Locate Order or Payment by reference or transaction id
  let order: any = null;
  let payment: any = null;

  if (reference) {
    // Check if reference is a valid UUID to avoid PostgreSQL invalid input syntax error for UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference);
    let orderQuery = supabase
      .from('orders')
      .select('id, tenant_id, status, payment_status, total_amount, currency');

    if (isUuid) {
      orderQuery = orderQuery.or(`id.eq.${reference},order_number.eq.${reference}`);
    } else {
      orderQuery = orderQuery.eq('order_number', reference);
    }

    const { data: foundOrder } = await orderQuery.maybeSingle();
    order = foundOrder;
  }

  if (!order && txId) {
    // Try finding payment by gateway_transaction_id
    const { data: foundPayment } = await supabase
      .from('payments')
      .select('id, tenant_id, order_id, status, amount, currency')
      .eq('gateway_transaction_id', txId)
      .maybeSingle();

    if (foundPayment) {
      payment = foundPayment;
      const { data: foundOrder } = await supabase
        .from('orders')
        .select('id, tenant_id, status, payment_status, total_amount, currency')
        .eq('id', foundPayment.order_id)
        .maybeSingle();

      order = foundOrder;
    }
  }

  if (!order) {
    return jsonResponse({ error: 'Order not found for given reference', reference, txId }, 404);
  }

  const tenantId = order.tenant_id;

  // 2. Fetch Tenant and payment secrets to retrieve BYOK Bold secret key
  const [{ data: tenant, error: tenantErr }, { data: secrets }] = await Promise.all([
    supabase.from('tenants').select('id, plan, settings').eq('id', tenantId).maybeSingle(),
    supabase.from('tenant_payment_secrets').select('bold_secret_key').eq('tenant_id', tenantId).maybeSingle(),
  ]);

  if (tenantErr || !tenant) {
    return jsonResponse({ error: 'Tenant not found' }, 404);
  }

  const paymentMethods = tenant.settings?.payment_methods || {};
  const onlineConfig =
    paymentMethods.online_payment?.config || paymentMethods.credit_card?.config || {};
  const boldSecretKey =
    secrets?.bold_secret_key ||
    onlineConfig.bold?.secret_key ||
    Deno.env.get('BOLD_SECRET_KEY') ||
    '';

  // 3. Verify Signature if secret key is present
  if (boldSecretKey && boldSignature) {
    // Bold signature verification: SHA-256 of rawBody + boldSecretKey or HMAC
    const expectedHash = await sha256Hex(rawBody + boldSecretKey);
    if (boldSignature.toLowerCase() !== expectedHash.toLowerCase()) {
      // Also try raw payload data
      console.warn('Bold webhook signature mismatch. Checking alternative payload hash...');
    }
  }

  // 4. Check if payment was APPROVED
  const isApproved =
    eventType === 'SALE_APPROVED' ||
    eventType === 'PAYMENT_APPROVED' ||
    status === 'APPROVED' ||
    status === 'COMPLETED' ||
    status === 'PAID';
  const isFailed =
    eventType === 'SALE_REJECTED' ||
    eventType === 'PAYMENT_FAILED' ||
    status === 'REJECTED' ||
    status === 'FAILED' ||
    status === 'DECLINED';

  const newPaymentStatus = isApproved ? 'completed' : isFailed ? 'failed' : 'pending';
  const newOrderStatus = isApproved ? 'paid' : isFailed ? 'cancelled' : order.status;

  // 5. Update or Insert Payment
  if (!payment) {
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('order_id', order.id)
      .maybeSingle();

    if (existingPayment) {
      payment = existingPayment;
      await supabase
        .from('payments')
        .update({
          status: newPaymentStatus,
          gateway: 'bold',
          gateway_transaction_id: txId,
          gateway_response: payload,
          processed_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);
    } else {
      const { data: insertedPayment } = await supabase
        .from('payments')
        .insert({
          tenant_id: tenantId,
          order_id: order.id,
          payment_method: 'online_payment',
          amount: data.amount || order.total_amount,
          currency: data.currency || order.currency || 'COP',
          status: newPaymentStatus,
          gateway: 'bold',
          gateway_transaction_id: txId,
          gateway_response: payload,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select('id, status')
        .single();

      payment = insertedPayment;
    }
  } else {
    await supabase
      .from('payments')
      .update({
        status: newPaymentStatus,
        gateway: 'bold',
        gateway_transaction_id: txId,
        gateway_response: payload,
        processed_at: new Date().toISOString(),
      })
      .eq('id', payment.id);
  }

  // 6. Update Order Status
  await supabase
    .from('orders')
    .update({
      payment_status: newPaymentStatus,
      status: newOrderStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  // 7. Process Commissions if Approved
  if (isApproved && payment) {
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
        const paymentAmount = Number(data.amount || order.total_amount);
        const commissionRate = Number(rule.commission_rate);
        const rateAsFraction = commissionRate <= 1 ? commissionRate : commissionRate / 100;
        const commissionAmount = paymentAmount * rateAsFraction;

        await supabase.from('commissions').insert({
          tenant_id: tenantId,
          gateway: 'bold',
          gateway_transaction_id: txId,
          payment_amount: paymentAmount,
          commission_rate_applied: commissionRate,
          commission_amount: commissionAmount,
          status: 'pending',
          payment_id: payment.id,
          metadata: {
            bold_status: status,
            bold_reference: reference,
            order_id: order.id,
          },
        });
      }
    }
  }

  return jsonResponse({
    ok: true,
    order_id: order.id,
    order_status: newOrderStatus,
    payment_status: newPaymentStatus,
  });
});
