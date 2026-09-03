import { TestBed } from '@angular/core/testing';
import { DiscountsService } from './discounts';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { AuthService } from './auth';

function createQuery(result: unknown) {
  const query: any = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn(() => query),
    maybeSingle: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
  };
  return query;
}

describe('DiscountsService', () => {
  let service: DiscountsService;
  let from: ReturnType<typeof vi.fn>;
  const tenantService = {
    tenantId: vi.fn(() => 'tenant-1'),
  };
  const authService = {
    user: vi.fn(() => ({ id: 'user-1' })),
  };

  beforeEach(() => {
    from = vi.fn((table: string) => {
      if (table === 'customers') {
        return createQuery({ data: { id: 'customer-1' }, error: null });
      }
      return createQuery({ data: null, error: null });
    });

    TestBed.configureTestingModule({
      providers: [
        DiscountsService,
        { provide: Supabase, useValue: { client: { from } } },
        { provide: TenantService, useValue: tenantService },
        { provide: AuthService, useValue: authService },
      ],
    });
    service = TestBed.inject(DiscountsService);
  });

  it('normalizes the coupon code and initializes usage count when creating it', async () => {
    const query = createQuery({ data: { id: 'discount-1', code: 'WELCOME10' }, error: null });
    from.mockReturnValueOnce(query);

    await service.createDiscountCode({ code: 'welcome10', value: 10 });

    expect(query.insert).toHaveBeenCalledWith({
      code: 'WELCOME10',
      value: 10,
      tenant_id: 'tenant-1',
      usage_count: 0,
    });
  });

  it('rejects a coupon already used by the resolved customer', async () => {
    const discountQuery = createQuery({
      data: {
        id: 'discount-1',
        code: 'WELCOME10',
        is_active: true,
        usage_count: 1,
        usage_limit: 10,
      },
      error: null,
    });
    const usageQuery = createQuery({
      data: [{ id: 'usage-1', customer_id: 'customer-1' }],
      error: null,
    });
    from
      .mockReturnValueOnce(createQuery({ data: { id: 'customer-1' }, error: null }))
      .mockReturnValueOnce(discountQuery)
      .mockReturnValueOnce(usageQuery);

    await expect(service.validateCode('welcome10', 'customer-1')).resolves.toBeNull();
    expect(discountQuery.eq).toHaveBeenCalledWith('code', 'WELCOME10');
    expect(usageQuery.eq).toHaveBeenCalledWith('customer_id', 'customer-1');
  });
});
