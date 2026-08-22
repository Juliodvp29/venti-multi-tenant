import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '@core/services/cart';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { StorefrontSection } from '@core/models';

@Component({
    selector: 'app-store-cart',
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './store-cart.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreCart {
    readonly cartService = inject(CartService);
    private readonly tenantService = inject(TenantService);
    private readonly toast = inject(ToastService);

    readonly items = this.cartService.items;
    readonly subtotal = this.cartService.subtotal;
    readonly total = this.cartService.total;
    readonly discount = this.cartService.discountAmount;
    readonly coupon = this.cartService.appliedCoupon;
    readonly currency = computed(() => {
        const settings = this.tenantService.settings() as Record<string, unknown>;
        return (settings?.['currency'] as string) || 'USD';
    });

    readonly pageConfig = computed(() => this.tenantService.getPageLayout('cart'));
    readonly sections = computed<StorefrontSection[]>(() => this.pageConfig()?.sections || []);

    readonly couponCode = signal('');
    readonly isApplyingCoupon = signal(false);

    asAny(val: any): any {
        return val;
    }

    async applyCoupon() {
        const code = this.couponCode().trim();
        if (!code) return;

        this.isApplyingCoupon.set(true);
        try {
            const success = await this.cartService.applyCoupon(code);
            if (success) {
                this.toast.success('¡Cupón aplicado correctamente!');
                this.couponCode.set('');
            } else {
                this.toast.error('Cupón no válido o expirado.');
            }
        } finally {
            this.isApplyingCoupon.set(false);
        }
    }

    removeCoupon() {
        this.cartService.removeCoupon();
        this.toast.info('Cupón removido');
    }
}
