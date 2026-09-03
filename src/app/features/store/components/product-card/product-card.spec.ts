import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProductCard } from './product-card';
import { CartService } from '@core/services/cart';
import { AnalyticsService } from '@core/services/analytics';
import { TenantService } from '@core/services/tenant';
import { provideRouter } from '@angular/router';

const product = {
  id: 'product-1',
  slug: 'camiseta-basica',
  name: 'Camiseta Básica',
  price: 50000,
  stock_quantity: 5,
  track_inventory: true,
  images: [],
} as any;

function createCartService(items: any[] = []) {
  return {
    items: signal(items),
    addToCart: vi.fn(),
  };
}

describe('ProductCard', () => {
  let cartService: ReturnType<typeof createCartService>;
  let component: ProductCard;

  beforeEach(() => {
    cartService = createCartService();
    TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartService },
        { provide: AnalyticsService, useValue: { trackAddToCart: vi.fn() } },
        {
          provide: TenantService,
          useValue: { currency: signal('COP'), themeTokens: signal({}) },
        },
      ],
    });
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    component = fixture.componentInstance;
  });

  it('reflects the quantity of the product in the cart', () => {
    expect(component.added()).toBe(false);

    cartService.items.set([
      { id: 'product-1', quantity: 2, product },
      { id: 'product-1_variant-1', quantity: 1, product },
    ]);

    expect(component.added()).toBe(true);
    expect(component.cartQuantity()).toBe(3);
  });

  it('adds the product and tracks the action', () => {
    const event = new MouseEvent('click', { cancelable: true });
    const analytics = TestBed.inject(AnalyticsService);

    component.addToCart(event);

    expect(cartService.addToCart).toHaveBeenCalledWith(product, 1);
    expect(analytics.trackAddToCart).toHaveBeenCalledWith('product-1', 1);
    expect(event.defaultPrevented).toBe(true);
  });
});
