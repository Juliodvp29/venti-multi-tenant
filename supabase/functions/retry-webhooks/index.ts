// Runtime: Supabase Edge Functions (Deno), checked when deployed with Supabase CLI.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const retryDelaysInMinutes = [1, 5, 30];
const maxAttempts = 4;
const deliveryTimeoutMs = 10_000;
const maxResponseBodyLength = 10_000;

type Delivery = {
  id: string;
  webhook_endpoint_id: string;
  tenant_id: string;
  event_type: string;
  payload: unknown;
  attempt_count: number | null;
};

type Endpoint = {
  url: string;
  secret_key: string;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

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

const retryAt = (attemptCount: number): string | null => {
  const delay = retryDelaysInMinutes[attemptCount - 1];
  return delay === undefined
    ? null
    : new Date(Date.now() + delay * 60_000).toISOString();
};

const readResponseBody = async (response: Response): Promise<string> => {
  const body = await response.text();
  return body.length > maxResponseBodyLength ? body.slice(0, maxResponseBodyLength) : body;
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const internalSecret = Deno.env.get('DISPATCH_WEBHOOK_SECRET');
    if (!internalSecret || request.headers.get('X-Venti-Internal-Secret') !== internalSecret) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase service role configuration is missing');
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: deliveries, error: deliveryError } = await admin
      .from('webhook_deliveries')
      .select('id, webhook_endpoint_id, tenant_id, event_type, payload, attempt_count')
      .eq('status', 'pending_retry')
      .lte('next_retry_at', new Date().toISOString())
      .limit(100);

    if (deliveryError) throw deliveryError;

    let processed = 0;
    for (const delivery of (deliveries ?? []) as Delivery[]) {
      const currentAttempt = delivery.attempt_count ?? 1;
      const nextAttempt = currentAttempt + 1;
      const { data: claimed, error: claimError } = await admin
        .from('webhook_deliveries')
        .update({ status: 'processing' })
        .eq('id', delivery.id)
        .eq('status', 'pending_retry')
        .select('id')
        .maybeSingle();

      if (claimError) throw claimError;
      if (!claimed) continue;

      const { data: endpoint, error: endpointError } = await admin
        .from('webhook_endpoints')
        .select('url, secret_key')
        .eq('id', delivery.webhook_endpoint_id)
        .maybeSingle();

      if (endpointError) throw endpointError;

      let status = 'success';
      let httpStatusCode: number | null = null;
      let responseBody: string | null = null;
      let errorMessage: string | null = null;

      if (!endpoint || !endpoint.url || !endpoint.secret_key) {
        status = 'failed';
        errorMessage = 'Webhook endpoint no longer exists or is incomplete';
      } else {
        try {
          const payloadJson = JSON.stringify(delivery.payload);
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
              status = nextAttempt >= maxAttempts ? 'failed' : 'pending_retry';
              errorMessage = `Webhook endpoint responded with HTTP ${response.status}`;
            }
          } finally {
            clearTimeout(timeout);
          }
        } catch (error) {
          status = nextAttempt >= maxAttempts ? 'failed' : 'pending_retry';
          errorMessage = error instanceof Error ? error.message : 'Webhook delivery failed';
        }
      }

      const { error: updateError } = await admin
        .from('webhook_deliveries')
        .update({
          status,
          http_status_code: httpStatusCode,
          response_body: responseBody,
          error_message: errorMessage,
          attempt_count: nextAttempt,
          next_retry_at: status === 'pending_retry' ? retryAt(nextAttempt) : null,
          delivered_at: status === 'success' ? new Date().toISOString() : null,
        })
        .eq('id', delivery.id);

      if (updateError) throw updateError;
      processed++;
    }

    return json({ processed });
  } catch (error) {
    console.error('retry-webhooks error:', error);
    return json({ error: 'Unable to retry webhooks' }, 500);
  }
});
