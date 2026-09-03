import { TestBed } from '@angular/core/testing';
import { SubscriptionPlan } from '@core/enums';
import { CommissionsService } from './commissions';
import { Supabase } from './supabase';
import { TenantService } from './tenant';

function createQuery(result: unknown) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    or: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
  };
  return query;
}

describe('CommissionsService', () => {
  let service: CommissionsService;
  let query: any;
  const tenantService = {
    tenantId: vi.fn((): string | null => 'tenant-1'),
  };

  beforeEach(() => {
    query = createQuery({
      data: [
        { id: 'rule-tenant', plan: SubscriptionPlan.Basic, tenant_id: 'tenant-1' },
        { id: 'rule-global', plan: SubscriptionPlan.Basic, tenant_id: null },
        { id: 'rule-pro', plan: SubscriptionPlan.Professional, tenant_id: null },
      ],
      error: null,
    });

    TestBed.configureTestingModule({
      providers: [
        CommissionsService,
        { provide: Supabase, useValue: { client: { from: vi.fn(() => query) } } },
        { provide: TenantService, useValue: tenantService },
      ],
    });
    service = TestBed.inject(CommissionsService);
  });

  it('returns only the first active rule for each subscription plan', async () => {
    const rules = await service.getCommissionRules();

    expect(rules).toEqual([
      { id: 'rule-tenant', plan: SubscriptionPlan.Basic, tenant_id: 'tenant-1' },
      { id: 'rule-pro', plan: SubscriptionPlan.Professional, tenant_id: null },
    ]);
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.or).toHaveBeenCalledWith('tenant_id.eq.tenant-1,tenant_id.is.null');
  });

  it('throws when commission access has no tenant context', async () => {
    tenantService.tenantId.mockReturnValueOnce(null);

    await expect(service.getCommissionRules()).rejects.toThrow('No tenant ID found');
  });
});
