import { computed, effect, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { ToastService } from './toast';
import { AppNotification } from '@core/models/notification';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService implements OnDestroy {
  private readonly supabase = inject(Supabase);
  private readonly tenantService = inject(TenantService);
  private readonly toast = inject(ToastService);

  readonly notifications = signal<AppNotification[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly unreadCount = computed(() =>
    this.notifications().filter((n) => !n.is_read).length
  );

  private realtimeChannel: RealtimeChannel | null = null;
  private currentTenantId: string | null = null;

  constructor() {
    effect(() => {
      const tenantId = this.tenantService.tenantId();
      if (tenantId && tenantId !== this.currentTenantId) {
        this.currentTenantId = tenantId;
        this.loadNotifications();
        this.setupRealtimeSubscription(tenantId);
      } else if (!tenantId) {
        this.cleanupSubscription();
        this.notifications.set([]);
        this.currentTenantId = null;
      }
    });
  }

  async loadNotifications(limit: number = 30): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return;

    this.isLoading.set(true);
    try {
      const { data, error } = await (this.supabase.client.from as any)('notifications')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      this.notifications.set((data as AppNotification[]) || []);
    } catch (err) {
      console.error('Unexpected error loading notifications:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return;

    // Actualización optimista
    this.notifications.update((list) =>
      list.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );

    try {
      const { error } = await (this.supabase.client.from as any)('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (err) {
      console.error('Unexpected error marking notification as read:', err);
    }
  }

  async markAllAsRead(): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return;

    const unreadIds = this.notifications()
      .filter((n) => !n.is_read)
      .map((n) => n.id);

    if (unreadIds.length === 0) return;

    // Actualización optimista
    this.notifications.update((list) =>
      list.map((n) => ({ ...n, is_read: true }))
    );

    try {
      const { error } = await (this.supabase.client.from as any)('notifications')
        .update({ is_read: true })
        .eq('tenant_id', tenantId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      } else {
        this.toast.success('Notificaciones al día', 'Todas las notificaciones fueron marcadas como leídas');
      }
    } catch (err) {
      console.error('Unexpected error marking all notifications as read:', err);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return;

    this.notifications.update((list) => list.filter((n) => n.id !== notificationId));

    try {
      const { error } = await (this.supabase.client.from as any)('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Error deleting notification:', error);
      }
    } catch (err) {
      console.error('Unexpected error deleting notification:', err);
    }
  }

  async createNotification(notification: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>): Promise<void> {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) return;

    try {
      const { error } = await (this.supabase.client.from as any)('notifications').insert({
        ...notification,
        tenant_id: tenantId,
        is_read: false,
      });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (err) {
      console.error('Unexpected error creating notification:', err);
    }
  }

  private setupRealtimeSubscription(tenantId: string): void {
    this.cleanupSubscription();

    this.realtimeChannel = this.supabase.client
      .channel(`tenant_notifications:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          if (newNotification) {
            this.notifications.update((current) => [newNotification, ...current]);
            this.toast.info(newNotification.title, newNotification.message);
          }
        }
      )
      .subscribe();
  }

  private cleanupSubscription(): void {
    if (this.realtimeChannel) {
      this.supabase.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  ngOnDestroy(): void {
    this.cleanupSubscription();
  }
}
