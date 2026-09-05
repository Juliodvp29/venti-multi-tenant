import { TestBed } from '@angular/core/testing';
import { OrderStatus, PaymentStatus } from '@core/enums';
import { OrdersService } from './orders';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { AuthService } from './auth';
import { NotificationsService } from './notifications';
import { EmailService } from './email';

function createQuery(result: unknown) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    or: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
  };
  return query;
}

describe('OrdersService', () => {
  let service: OrdersService;
  let query: any;
  let from: ReturnType<typeof vi.fn>;
  const tenantService = {
    tenantId: vi.fn((): string | null => 'tenant-1'),
    tenant: vi.fn(() => ({ business_name: 'Test Store', slug: 'test-store' })),
    memberRole: vi.fn(() => 'admin'),
  };
  const authService = {
    user: vi.fn(() => ({ id: 'user-1' })),
  };

  beforeEach(() => {
    query = createQuery({ data: [{ id: 'order-1' }], error: null, count: 1 });
    from = vi.fn(() => query);

    TestBed.configureTestingModule({
      providers: [
        OrdersService,
        { provide: Supabase, useValue: { client: { from } } },
        { provide: TenantService, useValue: tenantService },
        { provide: AuthService, useValue: authService },
        { provide: NotificationsService, useValue: { createNotification: vi.fn() } },
        {
          provide: EmailService,
          useValue: {
            sendEmail: vi.fn().mockResolvedValue({ success: true }),
            sendOrderConfirmation: vi.fn().mockResolvedValue({ success: true }),
            sendShippingNotification: vi.fn().mockResolvedValue({ success: true }),
            sendCustomerWelcome: vi.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    });
    service = TestBed.inject(OrdersService);
  });

  it('returns an empty page without querying when no tenant is selected', async () => {
    tenantService.tenantId.mockReturnValueOnce(null);

    await expect(service.getOrders()).resolves.toEqual({ data: [], count: 0 });
    expect(from).not.toHaveBeenCalled();
  });

  it('applies tenant, delivery, filters, sorting and pagination to the orders query', async () => {
    tenantService.memberRole.mockReturnValueOnce('delivery');

    const result = await service.getOrders(2, 10, {
      status: OrderStatus.Paid,
      payment_status: PaymentStatus.Completed,
      customer_id: 'customer-1',
      search: 'ORD-12',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      sortField: 'total_amount',
      sortDirection: 'asc',
    });

    expect(result).toEqual({ data: [{ id: 'order-1' }], count: 1 });
    expect(from).toHaveBeenCalledWith('orders');
    expect(query.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
    expect(query.eq).toHaveBeenCalledWith('delivery_person_id', 'user-1');
    expect(query.eq).toHaveBeenCalledWith('status', OrderStatus.Paid);
    expect(query.eq).toHaveBeenCalledWith('payment_status', PaymentStatus.Completed);
    expect(query.eq).toHaveBeenCalledWith('customer_id', 'customer-1');
    expect(query.or).toHaveBeenCalledWith(
      'order_number.ilike.%ORD-12%,customer_email.ilike.%ORD-12%',
    );
    expect(query.order).toHaveBeenCalledWith('total_amount', { ascending: true });
    expect(query.range).toHaveBeenCalledWith(10, 19);
  });

  it('throws the database error instead of returning incomplete order data', async () => {
    query = createQuery({ data: null, error: new Error('database unavailable'), count: null });
    from.mockReturnValueOnce(query);

    await expect(service.getOrders()).rejects.toThrow('database unavailable');
  });
});
