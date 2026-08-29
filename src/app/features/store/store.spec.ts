import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { signal } from '@angular/core';
import { StoreComponent } from './store';
import { TenantService } from '@core/services/tenant';
import { SeoService } from '@core/services/seo';
import { CartService } from '@core/services/cart';

const mockTenantService = {
  branding: signal(null),
  publishedThemeTokens: signal(null),
  currency: signal('COP'),
  tenant: signal({ id: 't1', business_name: 'Store Test' }),
  getPageLayout: vi.fn().mockReturnValue(null),
  storefrontLayout: signal({ header: {}, footer: {}, pages: {} }),
  publishedStorefrontLayout: signal({ header: {}, footer: {}, pages: {} }),
  customStorePages: signal([]),
};

const mockSeoService = {
  updateMetaTags: vi.fn(),
};

const mockCartService = {
  isCartOpen: signal(false),
  count: signal(0),
  items: signal([]),
  openCart: vi.fn(),
  closeCart: vi.fn(),
  toggleCart: vi.fn(),
};

describe('StoreComponent', () => {
  let component: StoreComponent;
  let fixture: ComponentFixture<StoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreComponent],
      providers: [
        provideRouter([]),
        CurrencyPipe,
        { provide: TenantService, useValue: mockTenantService },
        { provide: SeoService, useValue: mockSeoService },
        { provide: CartService, useValue: mockCartService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StoreComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
