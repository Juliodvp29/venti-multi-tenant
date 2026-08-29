import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Login } from './login';
import { AuthService } from '@core/services/auth';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';

const mockAuthService = {
  login: vi.fn().mockResolvedValue({ error: null }),
  isAuthenticated: signal(false),
};

const mockTenantService = {
  tenant: signal(null),
  tenantId: signal(null),
  initialized: signal(true),
};

const mockToastService = {
  success: vi.fn(),
  error: vi.fn(),
};

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('should have a valid form with correct email and password', () => {
    component.loginForm.setValue({ email: 'user@test.com', password: 'password123' });
    expect(component.loginForm.valid).toBe(true);
  });
});
