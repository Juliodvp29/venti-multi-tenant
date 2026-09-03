import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SelectStoreComponent } from './select-store';
import { TenantService } from '@core/services/tenant';
import { AuthService } from '@core/services/auth';
import { Router } from '@angular/router';

describe('SelectStoreComponent', () => {
  let component: SelectStoreComponent;
  let fixture: ComponentFixture<SelectStoreComponent>;
  const stores = signal<any[]>([
    { id: 'store-1', business_name: 'Tienda Uno', slug: 'tienda-uno' },
    { id: 'store-2', business_name: 'Tienda Dos', slug: 'tienda-dos' },
  ]);
  const tenantService = {
    initialized: vi.fn(() => true),
    tenants: vi.fn(() => stores()),
    loadUserTenants: vi.fn(),
    setCurrentTenant: vi.fn(),
  };
  const authService = {
    signOut: vi.fn(async () => undefined),
  };
  const router = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    stores.set([
      { id: 'store-1', business_name: 'Tienda Uno', slug: 'tienda-uno' },
      { id: 'store-2', business_name: 'Tienda Dos', slug: 'tienda-dos' },
    ]);

    await TestBed.configureTestingModule({
      imports: [SelectStoreComponent],
      providers: [
        { provide: TenantService, useValue: tenantService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectStoreComponent);
    component = fixture.componentInstance;
  });

  it('loads the available stores without auto-selecting when there are several', async () => {
    await component.ngOnInit();

    expect(component.stores()).toHaveLength(2);
    expect(component.isLoading()).toBe(false);
    expect(tenantService.setCurrentTenant).not.toHaveBeenCalled();
  });

  it('persists the selected store and navigates to the dashboard', () => {
    component.selectStore('store-2');

    expect(tenantService.setCurrentTenant).toHaveBeenCalledWith('store-2');
    expect(localStorage.getItem('venti_last_tenant')).toBe('store-2');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
