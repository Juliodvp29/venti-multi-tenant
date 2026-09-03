import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppNotification } from '@core/models/notification';
import { NotificationsService } from './notifications';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { ToastService } from './toast';

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'notif-1',
    tenant_id: 'tenant-1',
    type: 'general',
    title: 'Título',
    message: 'Mensaje',
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function createQuery(result: unknown) {
  const query: any = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)),
  };
  return query;
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let tenantId: WritableSignal<string | null>;
  let fromMock: ReturnType<typeof vi.fn>;
  let channelMock: ReturnType<typeof vi.fn>;
  let onMock: ReturnType<typeof vi.fn>;
  let subscribeMock: ReturnType<typeof vi.fn>;
  let removeChannelMock: ReturnType<typeof vi.fn>;
  let toastSuccess: ReturnType<typeof vi.fn>;
  let toastInfo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tenantId = signal<string | null>(null);

    fromMock = vi.fn(() => createQuery({ data: [], error: null }));
    subscribeMock = vi.fn(() => ({}));
    onMock = vi.fn(() => ({ subscribe: subscribeMock }));
    channelMock = vi.fn(() => ({ on: onMock }));
    removeChannelMock = vi.fn();
    toastSuccess = vi.fn();
    toastInfo = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [
        NotificationsService,
        {
          provide: Supabase,
          useValue: {
            client: { from: fromMock, channel: channelMock, removeChannel: removeChannelMock },
          },
        },
        { provide: TenantService, useValue: { tenantId } },
        { provide: ToastService, useValue: { success: toastSuccess, info: toastInfo } },
      ],
    });
    service = TestBed.inject(NotificationsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create with empty initial state', () => {
    expect(service).toBeTruthy();
    expect(service.notifications()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.unreadCount()).toBe(0);
  });

  it('computes unreadCount from unread notifications', () => {
    service.notifications.set([
      makeNotification({ id: '1', is_read: false }),
      makeNotification({ id: '2', is_read: true }),
      makeNotification({ id: '3', is_read: false }),
    ]);

    expect(service.unreadCount()).toBe(2);
  });

  describe('loadNotifications', () => {
    it('returns early without querying when no tenant is selected', async () => {
      tenantId.set(null);

      await service.loadNotifications();

      expect(fromMock).not.toHaveBeenCalled();
      expect(service.isLoading()).toBe(false);
    });

    it('loads notifications ordered by created_at desc with given limit', async () => {
      tenantId.set('tenant-1');
      const data = [makeNotification({ id: 'a' }), makeNotification({ id: 'b' })];
      const query = createQuery({ data, error: null });
      fromMock.mockReturnValueOnce(query);

      await service.loadNotifications(10);

      expect(fromMock).toHaveBeenCalledWith('notifications');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(query.limit).toHaveBeenCalledWith(10);
      expect(service.notifications()).toEqual(data);
      expect(service.isLoading()).toBe(false);
    });

    it('uses default limit of 30', async () => {
      tenantId.set('tenant-1');
      const query = createQuery({ data: [], error: null });
      fromMock.mockReturnValueOnce(query);

      await service.loadNotifications();

      expect(query.limit).toHaveBeenCalledWith(30);
    });

    it('keeps previous state and stops loading when supabase returns error', async () => {
      tenantId.set('tenant-1');
      const previous = [makeNotification({ id: 'keep' })];
      service.notifications.set(previous);
      fromMock.mockReturnValueOnce(createQuery({ data: null, error: new Error('db down') }));

      await service.loadNotifications();

      expect(console.error).toHaveBeenCalled();
      expect(service.notifications()).toEqual(previous);
      expect(service.isLoading()).toBe(false);
    });

    it('stops loading when the query throws', async () => {
      tenantId.set('tenant-1');
      const query: any = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        order: vi.fn(() => query),
        limit: vi.fn(() => {
          throw new Error('network failure');
        }),
      };
      fromMock.mockReturnValueOnce(query);

      await service.loadNotifications();

      expect(console.error).toHaveBeenCalled();
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('returns early without querying when no tenant is selected', async () => {
      tenantId.set(null);
      service.notifications.set([makeNotification({ id: '1', is_read: false })]);

      await service.markAsRead('1');

      expect(fromMock).not.toHaveBeenCalled();
      expect(service.notifications()[0].is_read).toBe(false);
    });

    it('applies optimistic update and persists is_read', async () => {
      tenantId.set('tenant-1');
      service.notifications.set([
        makeNotification({ id: '1', is_read: false }),
        makeNotification({ id: '2', is_read: false }),
      ]);
      const query = createQuery({ error: null });
      fromMock.mockReturnValueOnce(query);

      await service.markAsRead('1');

      expect(service.notifications().find((n) => n.id === '1')?.is_read).toBe(true);
      expect(service.notifications().find((n) => n.id === '2')?.is_read).toBe(false);
      expect(fromMock).toHaveBeenCalledWith('notifications');
      expect(query.update).toHaveBeenCalledWith({ is_read: true });
      expect(query.eq).toHaveBeenCalledWith('id', '1');
      expect(query.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
    });

    it('logs error when persistence fails but keeps optimistic update', async () => {
      tenantId.set('tenant-1');
      service.notifications.set([makeNotification({ id: '1', is_read: false })]);
      fromMock.mockReturnValueOnce(createQuery({ error: new Error('update failed') }));

      await service.markAsRead('1');

      expect(console.error).toHaveBeenCalled();
      expect(service.notifications()[0].is_read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('returns early without querying when no tenant is selected', async () => {
      tenantId.set(null);

      await service.markAllAsRead();

      expect(fromMock).not.toHaveBeenCalled();
    });

    it('returns early when there are no unread notifications', async () => {
      tenantId.set('tenant-1');
      service.notifications.set([makeNotification({ id: '1', is_read: true })]);

      await service.markAllAsRead();

      expect(fromMock).not.toHaveBeenCalled();
      expect(toastSuccess).not.toHaveBeenCalled();
    });

    it('marks all as read optimistically and shows success toast', async () => {
      tenantId.set('tenant-1');
      service.notifications.set([
        makeNotification({ id: '1', is_read: false }),
        makeNotification({ id: '2', is_read: false }),
      ]);
      const query = createQuery({ error: null });
      fromMock.mockReturnValueOnce(query);

      await service.markAllAsRead();

      expect(service.notifications().every((n) => n.is_read)).toBe(true);
      expect(query.update).toHaveBeenCalledWith({ is_read: true });
      expect(query.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
      expect(query.eq).toHaveBeenCalledWith('is_read', false);
      expect(toastSuccess).toHaveBeenCalledWith(
        'Notificaciones al día',
        'Todas las notificaciones fueron marcadas como leídas',
      );
    });

    it('does not toast on persistence error', async () => {
      tenantId.set('tenant-1');
      service.notifications.set([makeNotification({ id: '1', is_read: false })]);
      fromMock.mockReturnValueOnce(createQuery({ error: new Error('update failed') }));

      await service.markAllAsRead();

      expect(console.error).toHaveBeenCalled();
      expect(toastSuccess).not.toHaveBeenCalled();
    });
  });

  describe('deleteNotification', () => {
    it('returns early without querying when no tenant is selected', async () => {
      tenantId.set(null);
      service.notifications.set([makeNotification({ id: '1' })]);

      await service.deleteNotification('1');

      expect(fromMock).not.toHaveBeenCalled();
      expect(service.notifications()).toHaveLength(1);
    });

    it('removes the notification locally and deletes it in supabase', async () => {
      tenantId.set('tenant-1');
      service.notifications.set([makeNotification({ id: '1' }), makeNotification({ id: '2' })]);
      const query = createQuery({ error: null });
      fromMock.mockReturnValueOnce(query);

      await service.deleteNotification('1');

      expect(service.notifications().map((n) => n.id)).toEqual(['2']);
      expect(query.delete).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('id', '1');
      expect(query.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
    });
  });

  describe('createNotification', () => {
    it('returns early without querying when no tenant is selected', async () => {
      tenantId.set(null);

      await service.createNotification({
        tenant_id: 'tenant-1',
        type: 'general',
        title: 'Hola',
        message: 'Mundo',
      });

      expect(fromMock).not.toHaveBeenCalled();
    });

    it('inserts the notification with tenant_id and is_read false', async () => {
      tenantId.set('tenant-1');
      const query = createQuery({ error: null });
      fromMock.mockReturnValueOnce(query);

      await service.createNotification({
        tenant_id: 'ignored',
        type: 'order_created',
        title: 'Nuevo pedido',
        message: 'Tienes un pedido nuevo',
      });

      expect(fromMock).toHaveBeenCalledWith('notifications');
      expect(query.insert).toHaveBeenCalledWith({
        tenant_id: 'tenant-1',
        type: 'order_created',
        title: 'Nuevo pedido',
        message: 'Tienes un pedido nuevo',
        is_read: false,
      });
    });

    it('logs error when insert fails', async () => {
      tenantId.set('tenant-1');
      fromMock.mockReturnValueOnce(createQuery({ error: new Error('insert failed') }));

      await service.createNotification({
        tenant_id: 'tenant-1',
        type: 'general',
        title: 'T',
        message: 'M',
      });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('realtime subscription', () => {
    it('subscribes to tenant channel when tenantId changes and handles INSERT', async () => {
      const initial = [makeNotification({ id: 'old' })];
      fromMock.mockReturnValue(createQuery({ data: initial, error: null }));

      tenantId.set('tenant-1');
      TestBed.flushEffects();
      await vi.waitFor(() => expect(service.notifications()).toEqual(initial));

      expect(channelMock).toHaveBeenCalledWith('tenant_notifications:tenant-1');
      expect(onMock).toHaveBeenCalled();

      const callback = onMock.mock.calls[0][2] as (payload: unknown) => void;
      const incoming = makeNotification({ id: 'new', title: 'Pedido', message: 'Nuevo pedido' });
      callback({ new: incoming });

      expect(service.notifications()[0]).toEqual(incoming);
      expect(service.notifications()).toHaveLength(initial.length + 1);
      expect(toastInfo).toHaveBeenCalledWith('Pedido', 'Nuevo pedido');
    });

    it('clears notifications when tenant is removed', async () => {
      fromMock.mockReturnValue(createQuery({ data: [], error: null }));
      tenantId.set('tenant-1');
      TestBed.flushEffects();
      await vi.waitFor(() => expect(channelMock).toHaveBeenCalled());

      tenantId.set(null);
      TestBed.flushEffects();

      expect(service.notifications()).toEqual([]);
      expect(removeChannelMock).toHaveBeenCalled();
    });

    it('removes the realtime channel on destroy', async () => {
      fromMock.mockReturnValue(createQuery({ data: [], error: null }));
      tenantId.set('tenant-1');
      TestBed.flushEffects();
      await vi.waitFor(() => expect(channelMock).toHaveBeenCalled());

      service.ngOnDestroy();

      expect(removeChannelMock).toHaveBeenCalled();
    });
  });
});
