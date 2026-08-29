import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ForgotPassword } from './forgot-password';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';

const mockAuthService = {
  resetPassword: vi.fn().mockResolvedValue({ error: null }),
};

const mockToastService = {
  success: vi.fn(),
  error: vi.fn(),
};

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
