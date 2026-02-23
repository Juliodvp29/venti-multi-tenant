import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '@core/models/cart';
import { Product } from '@core/models/product';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private readonly _items = signal<CartItem[]>(this.loadCart());

    // Computed properties
    readonly items = computed(() => this._items());
    readonly count = computed(() => this._items().reduce((acc, item) => acc + item.quantity, 0));
    readonly subtotal = computed(() => this._items().reduce((acc, item) => acc + (item.price * item.quantity), 0));
    readonly tax = computed(() => this.subtotal() * 0.15); // Example 15% tax
    readonly total = computed(() => this.subtotal() + this.tax());

    constructor() {
        // Sync to localStorage whenever items change
        // Note: effect() could be used here but signals updated from effects should be avoided.
        // We'll manualy update localStorage in state-changing methods.
    }

    addToCart(product: Product, quantity: number = 1): void {
        this._items.update(items => {
            const existingItem = items.find(i => i.productId === product.id);

            if (existingItem) {
                return items.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            const newItem: CartItem = {
                id: product.id,
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                imageUrl: product.primary_image_url || null,
                product: product
            };

            return [...items, newItem];
        });
        this.saveCart();
    }

    removeFromCart(productId: string): void {
        this._items.update(items => items.filter(i => i.productId !== productId));
        this.saveCart();
    }

    updateQuantity(productId: string, quantity: number): void {
        if (quantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        this._items.update(items =>
            items.map(item =>
                item.productId === productId ? { ...item, quantity } : item
            )
        );
        this.saveCart();
    }

    clearCart(): void {
        this._items.set([]);
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
