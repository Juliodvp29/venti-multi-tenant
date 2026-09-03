import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CartDrawer } from './cart-drawer';
import { CartService } from '@core/services/cart';
import { TenantService } from '@core/services/tenant';
import { provideRouter } from '@angular/router';

const product = {
  id: 'product-1',
  name: 'Camiseta Básica',
  primary_image_url: 'https://example.com/product.jpg',
  images: [],
} as any;

function createCartService() {
  return {
    items: signal<any[]>([]),
    appliedCoupon: signal(null),
    applyCoupon: vi.fn(async () => true),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    removeCoupon: vi.fn(),
    subtotal: signal(0),
    discountAmount: signal(0),
    tax: signal(0),
    total: signal(0),
  };
}

describe('CartDrawer', () => {
  let component: CartDrawer;
  let cartService: ReturnType<typeof createCartService>;

  beforeEach(() => {
    cartService = createCartService();
    TestBed.configureTestingModule({
      imports: [CartDrawer],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartService },
        { provide: TenantService, useValue: { currency: signal('COP') } },
      ],
    });
    component = TestBed.createComponent(CartDrawer).componentInstance;
  });

  it('prefers the explicit cart image and falls back to product images', () => {
    const explicitImage = component.getItemImage({ imageUrl: 'cart.jpg', product } as any);
    const productImage = component.getItemImage({ imageUrl: null, product } as any);

    expect(explicitImage).toBe('cart.jpg');
    expect(productImage).toBe('https://example.com/product.jpg');
  });

  it('clears the coupon code after a successful application', async () => {
    component.couponCode.set('WELCOME10');

    await component.applyCoupon();

    expect(cartService.applyCoupon).toHaveBeenCalledWith('WELCOME10');
    expect(component.couponCode()).toBe('');
  });
});
