import { Injectable, computed, signal, inject, effect } from '@angular/core';
import { CartItem } from '@core/models/cart';
import { Product, ProductVariant } from '@core/models/product';
import { DiscountCode } from '@core/models/discount.model';
import { TaxRate } from '@core/models';
import { DiscountsService } from './discounts';
import { ShippingService } from './shipping';
import { TenantService } from './tenant';
import { ToastService } from './toast';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private readonly discountsService = inject(DiscountsService);
    private readonly shippingService = inject(ShippingService);
    private readonly tenantService = inject(TenantService);
    private readonly toast = inject(ToastService);

    private readonly _items = signal<CartItem[]>(this.loadCart());
    private readonly _appliedCoupon = signal<DiscountCode | null>(null);
    private readonly _taxRates = signal<TaxRate[]>([]);
    private readonly _shippingCountry = signal<string | null>(null);
    private readonly _shippingState = signal<string | null>(null);

    // Computed properties
    readonly items = computed(() => this._items());
    readonly count = computed(() => this._items().reduce((acc, item) => acc + item.quantity, 0));
    readonly subtotal = computed(() => this._items().reduce((acc, item) => acc + (item.price * item.quantity), 0));

    readonly activeTaxRates = computed(() => this._taxRates().filter(t => t.is_active));

    readonly taxRate = computed(() => {
        const rates = this.activeTaxRates();
        if (rates.length === 0) return 0;

        const country = this._shippingCountry();
        const state = this._shippingState();

        if (country) {
            const exactMatch = rates.find(r => r.country === country && r.state === state);
            if (exactMatch) return exactMatch.rate;

            const countryMatch = rates.find(r => r.country === country && !r.state);
            if (countryMatch) return countryMatch.rate;
        }

        // If no country selected or no match, use the first available rule as an estimate
        return rates[0].rate;
    });

    readonly discountAmount = computed(() => {
        const coupon = this._appliedCoupon();
        if (!coupon) return 0;

        if (coupon.type === 'percentage') {
            return this.subtotal() * (coupon.value / 100);
        } else if (coupon.type === 'fixed_amount') {
            return Math.min(coupon.value, this.subtotal());
        }
        return 0;
    });

    readonly tax = computed(() => (this.subtotal() - this.discountAmount()) * this.taxRate());
    readonly total = computed(() => this.subtotal() - this.discountAmount() + this.tax());
    readonly appliedCoupon = computed(() => this._appliedCoupon());

    constructor() {
        // Sync to localStorage whenever items change. We can't do exact effect for this without creating loop, so saveCart is manually called.

        // Load tax rates automatically when a tenant is loaded
        effect(() => {
            const tenantId = this.tenantService.tenantId();
            if (tenantId) {
                this.loadTaxRates();
            }
        });
    }

    private async loadTaxRates() {
        try {
            const rates = await this.shippingService.getTaxRates();
            this._taxRates.set(rates);
        } catch (e) {
            console.error('Error loading tax rates:', e);
        }
    }

    setShippingLocation(country: string, state?: string) {
        this._shippingCountry.set(country);
        this._shippingState.set(state || null);
    }

    async applyCoupon(code: string): Promise<boolean> {
        try {
            const coupon = await this.discountsService.validateCode(code);

            if (!coupon) {
                this.toast.error('Cupón inválido o expirado');
                return false;
            }

            if (coupon.minimum_purchase_amount && this.subtotal() < coupon.minimum_purchase_amount) {
                this.toast.error(`El pedido mínimo para este cupón es de $${coupon.minimum_purchase_amount}`);
                return false;
            }

            this._appliedCoupon.set(coupon);
            this.toast.success('Cupón aplicado con éxito');
            return true;
        } catch (error) {
            console.error('Error applying coupon:', error);
            this.toast.error('Error al aplicar el cupón');
            return false;
        }
    }

    removeCoupon(): void {
        this._appliedCoupon.set(null);
        this.toast.info('Cupón removido');
    }

    addToCart(product: Product, quantity: number = 1, variant?: ProductVariant): void {
        this._items.update(items => {
            const variantId = variant?.id;
            const itemId = variantId ? `${product.id}_${variantId}` : product.id;

            const existingItem = items.find(i => i.id === itemId);

            if (existingItem) {
                return items.map(item =>
                    item.id === itemId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            const newItem: CartItem = {
                id: itemId,
                productId: product.id,
                variantId: variantId,
                name: variant ? `${product.name} - ${variant.name}` : product.name,
                price: variant?.price ?? product.price,
                quantity: quantity,
                imageUrl: variant?.image_url || product.primary_image_url || null,
                product: product
            };

            return [...items, newItem];
        });
        this.saveCart();
    }

    removeFromCart(itemId: string): void {
        this._items.update(items => items.filter(i => i.id !== itemId));
        this.saveCart();
    }

    updateQuantity(itemId: string, quantity: number): void {
        if (quantity <= 0) {
            this.removeFromCart(itemId);
            return;
        }

        this._items.update(items =>
            items.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            )
        );
        this.saveCart();
    }

    clearCart(): void {
        this._items.set([]);
        this._appliedCoupon.set(null);
        this.saveCart();
    }

    private saveCart(): void {
        localStorage.setItem('venti_cart', JSON.stringify(this._items()));
    }

    private loadCart(): CartItem[] {
        const saved = localStorage.getItem('venti_cart');
        return saved ? JSON.parse(saved) : [];
    }
}
