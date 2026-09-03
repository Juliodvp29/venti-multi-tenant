// Runtime: Supabase Edge Functions (Deno), checked when deployed with Supabase CLI.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supportedEvents = new Set([
  'order.created',
  'order.status_changed',
  'payment.confirmed',
  'payment.failed',
  'product.stock_low',
]);

const retryDelaysInMinutes = [1, 5, 30];
const maxAttempts = 4;
const deliveryTimeoutMs = 10_000;
const maxResponseBodyLength = 10_000;

type DispatchRequest = {
  tenant_id: string;
  event_type: string;
  payload: unknown;
};

type WebhookEndpoint = {
  id: string;
  url: string;
  secret_key: string;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const getRetryAt = (attemptCount: number): string | null => {
  const delay = retryDelaysInMinutes[attemptCount - 1];
  if (delay === undefined) return null;

  return new Date(Date.now() + delay * 60_000).toISOString();
};

const signPayload = async (payload: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
};

const readResponseBody = async (response: Response): Promise<string> => {
  const body = await response.text();
  return body.length > maxResponseBodyLength
    ? body.slice(0, maxResponseBodyLength)
    : body;
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const internalSecret = Deno.env.get('DISPATCH_WEBHOOK_SECRET');
    if (!internalSecret || request.headers.get('X-Venti-Internal-Secret') !== internalSecret) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = await request.json() as Partial<DispatchRequest>;
    const tenantId = body.tenant_id;
    const eventType = body.event_type;

    if (
      typeof tenantId !== 'string' ||
      !tenantId ||
      typeof eventType !== 'string' ||
      !supportedEvents.has(eventType) ||
      body.payload === undefined
    ) {
      return json({ error: 'Invalid webhook event' }, 400);
    }

    const payloadJson = JSON.stringify(body.payload);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase service role configuration is missing');
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: endpoints, error: endpointError } = await admin
      .from('webhook_endpoints')
      .select('id, url, secret_key')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .contains('subscribed_events', [eventType]);

    if (endpointError) throw endpointError;

    const results: Array<{ endpoint_id: string; status: string }> = [];
    for (const endpoint of (endpoints ?? []) as WebhookEndpoint[]) {
      const attemptCount = 1;
      let status = 'success';
      let httpStatusCode: number | null = null;
      let responseBody: string | null = null;
      let errorMessage: string | null = null;

      try {
        const signature = await signPayload(payloadJson, endpoint.secret_key);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), deliveryTimeoutMs);
        try {
          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers: {
              'X-Venti-Signature': signature,
              'Content-Type': 'application/json',
            },
            body: payloadJson,
            signal: controller.signal,
          });
          httpStatusCode = response.status;
          responseBody = await readResponseBody(response);
          if (!response.ok) {
            status = 'pending_retry';
            errorMessage = `Webhook endpoint responded with HTTP ${response.status}`;
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        status = 'pending_retry';
        errorMessage = error instanceof Error ? error.message : 'Webhook delivery failed';
      }

      if (status === 'pending_retry' && !getRetryAt(attemptCount)) {
        status = 'failed';
      }

      const { error: deliveryError } = await admin.from('webhook_deliveries').insert({
        webhook_endpoint_id: endpoint.id,
        tenant_id: tenantId,
        event_type: eventType,
        payload: body.payload,
        status,
        http_status_code: httpStatusCode,
        response_body: responseBody,
        error_message: errorMessage,
        attempt_count: attemptCount,
        next_retry_at: status === 'pending_retry' ? getRetryAt(attemptCount) : null,
        delivered_at: status === 'success' ? new Date().toISOString() : null,
      });

      if (deliveryError) throw deliveryError;
      results.push({ endpoint_id: endpoint.id, status });
    }

    return json({ delivered: results.length, results });
  } catch (error) {
    console.error('dispatch-webhook error:', error);
    return json({ error: 'Unable to dispatch webhook' }, 500);
  }
});
