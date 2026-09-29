import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { McpService } from './mcp';

function createQuery(result: unknown) {
  const query: any = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
  };
  return query;
}

describe('McpService', () => {
  let service: McpService;
  let from: ReturnType<typeof vi.fn>;
  const tenantService = {
    tenantId: vi.fn<() => string | null>(() => 'tenant-123'),
  };

  beforeEach(() => {
    from = vi.fn();
    tenantService.tenantId.mockReturnValue('tenant-123');
    TestBed.configureTestingModule({
      providers: [
        McpService,
        { provide: Supabase, useValue: { client: { from } } },
        { provide: TenantService, useValue: tenantService },
      ],
    });
    service = TestBed.inject(McpService);
  });

  it('lists MCP keys scoped to the active tenant', async () => {
    const query = createQuery({ data: [], error: null });
    from.mockReturnValue(query);

    const keys = await service.listKeys();

    expect(from).toHaveBeenCalledWith('mcp_api_keys');
    expect(query.eq).toHaveBeenCalledWith('tenant_id', 'tenant-123');
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(keys).toEqual([]);
  });

  it('generates a new key with prefix and hash', async () => {
    const fakeKey = {
      id: 'key-1',
      tenant_id: 'tenant-123',
      name: 'Claude Test',
      key_prefix: 'vnt_mcp_...abcd',
      scopes: ['read:orders'],
      is_active: true,
      created_at: new Date().toISOString(),
    };
    const query = createQuery({ data: fakeKey, error: null });
    from.mockReturnValue(query);

    const result = await service.createKey('Claude Test', ['read:orders']);

    expect(from).toHaveBeenCalledWith('mcp_api_keys');
    expect(query.insert).toHaveBeenCalled();
    expect(result.rawToken).toMatch(/^vnt_mcp_live_[0-9a-f]{48}$/);
    expect(result.apiKey).toEqual(fakeKey);
  });

  it('generates valid Claude configuration JSON', () => {
    const jsonStr = service.generateClaudeConfig('vnt_mcp_live_123456');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.mcpServers.venti).toBeDefined();
    expect(parsed.mcpServers.venti.args).toContain('vnt_mcp_live_123456');
  });

  it('generates valid Cursor configuration JSON', () => {
    const jsonStr = service.generateCursorConfig('vnt_mcp_live_123456');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.mcpServers.venti).toBeDefined();
    expect(parsed.mcpServers.venti.type).toBe('sse');
    expect(parsed.mcpServers.venti.url).toContain('vnt_mcp_live_123456');
  });
});
