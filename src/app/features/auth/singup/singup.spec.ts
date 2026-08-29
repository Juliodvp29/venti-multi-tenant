import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component, signal } from '@angular/core';
import { Singup } from './singup';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';
import { Supabase } from '@core/services/supabase';

@Component({ template: '' })
class DummyComponent {}

const mockAuthService = {
  signUp: vi.fn().mockResolvedValue({ error: null }),
  isAuthenticated: signal(false),
};

const mockToastService = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

const mockSupabase = {
  client: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
};

describe('Singup', () => {
  let component: Singup;
  let fixture: ComponentFixture<Singup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Singup],
      providers: [
        provideRouter([
          { path: 'auth/login', component: DummyComponent },
          { path: 'dashboard', component: DummyComponent },
        ]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Supabase, useValue: mockSupabase },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Singup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
