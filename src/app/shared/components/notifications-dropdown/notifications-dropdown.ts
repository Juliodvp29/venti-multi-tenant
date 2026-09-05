import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsService } from '@core/services/notifications';
import { AppNotification, NotificationType } from '@core/models/notification';

@Component({
  selector: 'app-notifications-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './notifications-dropdown.html',
  styleUrl: './notifications-dropdown.css',
})
export class NotificationsDropdown {
  private readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly isOpen = signal(false);
  readonly activeTab = signal<'all' | 'unread'>('all');

  readonly notifications = this.notificationsService.notifications;
  readonly unreadCount = this.notificationsService.unreadCount;
  readonly isLoading = this.notificationsService.isLoading;

  readonly filteredNotifications = computed(() => {
    const list = this.notifications();
    if (this.activeTab() === 'unread') {
      return list.filter((n) => !n.is_read);
    }
    return list;
  });

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  setTab(tab: 'all' | 'unread'): void {
    this.activeTab.set(tab);
  }

  async onNotificationClick(notification: AppNotification): Promise<void> {
    if (!notification.is_read) {
      await this.notificationsService.markAsRead(notification.id);
    }

    if (notification.link) {
      this.close();
      this.router.navigateByUrl(notification.link);
    }
  }

  async markAsRead(event: Event, notificationId: string): Promise<void> {
    event.stopPropagation();
    await this.notificationsService.markAsRead(notificationId);
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationsService.markAllAsRead();
  }

  async deleteNotification(event: Event, notificationId: string): Promise<void> {
    event.stopPropagation();
    await this.notificationsService.deleteNotification(notificationId);
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  }

  getNotificationBadgeClasses(type: NotificationType): string {
    switch (type) {
      case 'order_created':
        return 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400';
      case 'low_stock':
      case 'out_of_stock':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      case 'new_review':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
      case 'commission_paid':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'member_joined':
        return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400';
      case 'cart_abandoned':
      case 'cart_digest':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400';
      case 'morning_briefing':
        return 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400';
      case 'stock_velocity':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      case 'review_digest':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
      case 'sales_record':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'coupon_expiring':
        return 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400';
      case 'subscription_expiring':
        return 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
