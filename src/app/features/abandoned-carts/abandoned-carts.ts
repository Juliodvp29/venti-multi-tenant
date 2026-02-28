import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbandonedCartService, AbandonedCart } from '@core/services/abandoned-cart';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-abandoned-carts',
  imports: [CommonModule, FormsModule],
  templateUrl: './abandoned-carts.html',
  styleUrl: './abandoned-carts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbandonedCarts implements OnInit {
  private readonly cartService = inject(AbandonedCartService);
  private readonly toast = inject(ToastService);

  readonly carts = signal<AbandonedCart[]>([]);
  readonly isLoading = signal(false);

  readonly totalPotential = computed(() =>
    this.carts().reduce((acc, cat) => acc + cat.total_amount, 0)
  );

  ngOnInit() {
    this.loadCarts();
  }

  async loadCarts() {
    this.isLoading.set(true);
    try {
      const data = await this.cartService.getAbandonedCarts();
      this.carts.set(data);
    } catch (error) {
      console.error('Error loading abandoned carts:', error);
      this.toast.error('Error loading abandoned carts');
    } finally {
      this.isLoading.set(false);
    }
  }

  async sendRecovery(cart: AbandonedCart) {
    // In a real scenario, this would open a modal to select a coupon code
    const result = await this.cartService.sendRecoveryEmail(cart);
    if (result.success) {
      this.toast.success(`Recovery email sent to ${cart.customer_name}`);
    } else {
      this.toast.error(result.error || 'Error sending email');
    }
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHrs < 1) return 'Less than an hour ago';
    if (diffHrs === 1) return '1 hour ago';
    return `${diffHrs} hours ago`;
  }
}
