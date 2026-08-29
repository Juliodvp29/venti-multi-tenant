import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ProductsCatalog } from './products-catalog';
import { ProductsList } from './components/products-list/products-list';
import { ProductsService } from '@core/services/products';
import { CategoriesService } from '@core/services/categories';
import { TenantService } from '@core/services/tenant';
import { SubscriptionService } from '@core/services/subscription';
import { ToastService } from '@core/services/toast';
import { ProductStatus } from '@core/enums';
import { Product } from '@core/models/product';
import { Category } from '@core/models/category';
import { vi, describe, beforeEach, it, expect } from 'vitest';

registerLocaleData(localeEs, 'es');

describe('Products Catalog Feature', () => {
  describe('ProductsCatalog Component', () => {
    let component: ProductsCatalog;
    let fixture: ComponentFixture<ProductsCatalog>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProductsCatalog],
        providers: [
          {
            provide: TenantService,
            useValue: {
              tenantId: signal('tenant-123'),
              currency: signal('COP'),
              timezone: signal('America/Bogota'),
            },
          },
          {
            provide: ProductsService,
            useValue: {
              getProducts: vi.fn().mockResolvedValue({ data: [], count: 0 }),
            },
          },
          {
            provide: CategoriesService,
            useValue: {
              getCategories: vi.fn().mockResolvedValue([]),
            },
          },
          {
            provide: SubscriptionService,
            useValue: {
              canAddResource: vi.fn().mockResolvedValue(true),
            },
          },
          {
            provide: ToastService,
            useValue: {
              success: vi.fn(),
              error: vi.fn(),
              confirm: vi.fn().mockResolvedValue(true),
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ProductsCatalog);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    it('should create and default to products tab', () => {
      expect(component).toBeTruthy();
      expect(component.activeTab()).toBe('products');
    });

    it('should switch tabs between products and categories', () => {
      component.setTab('categories');
      expect(component.activeTab()).toBe('categories');

      component.setTab('products');
      expect(component.activeTab()).toBe('products');
    });
  });

  describe('ProductsList Component', () => {
    let component: ProductsList;
    let fixture: ComponentFixture<ProductsList>;

    const mockCategories: Category[] = [
      {
        id: 'cat-1',
        tenant_id: 'tenant-123',
        name: 'Ropa',
        slug: 'ropa',
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
      },
    ] as unknown as Category[];

    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        tenant_id: 'tenant-123',
        name: 'Camisa Oxford',
        slug: 'camisa-oxford',
        status: ProductStatus.Active,
        price: 89000,
        track_inventory: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'prod-2',
        tenant_id: 'tenant-123',
        name: 'Pantalón Chino',
        slug: 'pantalon-chino',
        status: ProductStatus.Draft,
        price: 120000,
        track_inventory: false,
        created_at: new Date().toISOString(),
      },
    ] as unknown as Product[];

    const productsServiceMock = {
      getProducts: vi.fn().mockResolvedValue({ data: mockProducts, count: 2 }),
      getProduct: vi.fn().mockResolvedValue(mockProducts[0]),
      deleteProduct: vi.fn().mockResolvedValue({}),
      createProduct: vi.fn().mockResolvedValue({ data: mockProducts[0] }),
    };

    const categoriesServiceMock = {
      getCategories: vi.fn().mockResolvedValue(mockCategories),
    };

    const tenantServiceMock = {
      tenantId: signal('tenant-123'),
      currency: signal('COP'),
      timezone: signal('America/Bogota'),
    };

    const subscriptionServiceMock = {
      canAddResource: vi.fn().mockResolvedValue(true),
    };

    const toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
      confirm: vi.fn().mockResolvedValue(true),
    };

    beforeEach(async () => {
      vi.clearAllMocks();
      productsServiceMock.getProducts.mockResolvedValue({ data: mockProducts, count: 2 });
      productsServiceMock.getProduct.mockResolvedValue(mockProducts[0]);
      categoriesServiceMock.getCategories.mockResolvedValue(mockCategories);
      subscriptionServiceMock.canAddResource.mockResolvedValue(true);
      toastServiceMock.confirm.mockResolvedValue(true);

      await TestBed.configureTestingModule({
        imports: [ProductsList],
        providers: [
          { provide: ProductsService, useValue: productsServiceMock },
          { provide: CategoriesService, useValue: categoriesServiceMock },
          { provide: TenantService, useValue: tenantServiceMock },
          { provide: SubscriptionService, useValue: subscriptionServiceMock },
          { provide: ToastService, useValue: toastServiceMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ProductsList);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    it('should create and calculate stats', async () => {
      expect(component).toBeTruthy();
      await component.loadProducts();
      await component.loadCategories();

      expect(component.products().length).toBe(2);
      expect(component.categories().length).toBe(1);
      expect(component.activeProducts()).toBe(1);
      expect(component.draftProducts()).toBe(1);
    });

    it('should open create drawer when plan allows adding products', async () => {
      subscriptionServiceMock.canAddResource.mockResolvedValue(true);
      await component.openCreate();

      expect(component.showDrawer()).toBe(true);
      expect(component.editingProduct()).toBeNull();
    });

    it('should show error toast when plan product limit reached', async () => {
      subscriptionServiceMock.canAddResource.mockResolvedValue(false);
      await component.openCreate();

      expect(component.showDrawer()).toBe(false);
      expect(toastServiceMock.error).toHaveBeenCalledWith(
        expect.stringContaining('límite de productos'),
      );
    });

    it('should open edit drawer with product details', async () => {
      await component.openEdit(mockProducts[0]);

      expect(productsServiceMock.getProduct).toHaveBeenCalledWith('prod-1');
      expect(component.showDrawer()).toBe(true);
      expect(component.editingProduct()).toEqual(mockProducts[0]);
    });

    it('should close drawer on closeDrawer()', () => {
      component.showDrawer.set(true);
      component.closeDrawer();

      expect(component.showDrawer()).toBe(false);
      expect(component.editingProduct()).toBeNull();
    });

    it('should delete product when confirmed', async () => {
      toastServiceMock.confirm.mockResolvedValue(true);
      await component.deleteProduct(mockProducts[0]);

      expect(productsServiceMock.deleteProduct).toHaveBeenCalledWith('prod-1');
      expect(toastServiceMock.success).toHaveBeenCalledWith(
        expect.stringContaining('eliminado'),
      );
    });
  });
});
