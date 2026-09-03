import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebhookEvent } from '@core/enums';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { WebhooksService } from './webhooks';

function createQuery(result: unknown) {
  const query: any = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    contains: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
  };
  return query;
}

describe('WebhooksService', () => {
  let service: WebhooksService;
  let from: ReturnType<typeof vi.fn>;
  const tenantService = {
    tenantId: vi.fn<() => string | null>(() => 'tenant-1'),
  };

  beforeEach(() => {
    from = vi.fn();
    tenantService.tenantId.mockReturnValue('tenant-1');
    TestBed.configureTestingModule({
      providers: [
        WebhooksService,
        { provide: Supabase, useValue: { client: { from } } },
        { provide: TenantService, useValue: tenantService },
      ],
    });
    service = TestBed.inject(WebhooksService);
  });

  it('loads endpoints scoped to the active tenant without selecting secrets', async () => {
    const query = createQuery({ data: [], error: null });
    from.mockReturnValue(query);

    await service.listEndpoints();

    expect(from).toHaveBeenCalledWith('webhook_endpoints');
    expect(query.select).toHaveBeenCalledWith(
      'id, tenant_id, url, subscribed_events, is_active, created_at, updated_at',
    );
    expect(query.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
  });

  it('generates a secret when creating an endpoint', async () => {
    const query = createQuery({
      data: {
        id: 'endpoint-1',
        tenant_id: 'tenant-1',
        url: 'https://example.com/webhook',
        secret_key: 'whsec_secret',
        subscribed_events: [WebhookEvent.OrderCreated],
        is_active: true,
      },
      error: null,
    });
    from.mockReturnValue(query);

    await service.createEndpoint(' https://example.com/webhook ', [WebhookEvent.OrderCreated]);

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-1',
        url: 'https://example.com/webhook',
        subscribed_events: [WebhookEvent.OrderCreated],
        is_active: true,
      }),
    );
    expect(query.insert.mock.calls[0][0].secret_key).toMatch(/^whsec_[0-9a-f]{64}$/);
  });

  it('only retries failed deliveries for the active tenant', async () => {
    const query = createQuery({ data: null, error: null });
    from.mockReturnValue(query);

    await service.retryDelivery('delivery-1');

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending_retry',
        error_message: null,
      }),
    );
    expect(query.eq).toHaveBeenCalledWith('id', 'delivery-1');
    expect(query.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
    expect(query.eq).toHaveBeenCalledWith('status', 'failed');
  });

  it('rejects operations without an active tenant', async () => {
    tenantService.tenantId.mockReturnValue(null);

    await expect(service.listDeliveries()).rejects.toThrow('No active tenant');
  });
});
