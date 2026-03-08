import { Component, inject, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';

@Component({
  selector: 'app-customer-auth-modal',
  templateUrl: './customer-auth-modal.html',
  styleUrl: './customer-auth-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class CustomerAuthModal {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly tenant = inject(TenantService);
  private readonly toast = inject(ToastService);

  readonly tab = signal<'login' | 'signup'>('login');
  readonly loading = signal(false);
  readonly needsVerification = signal(false);
  readonly close = output<void>();
  readonly authenticated = output<void>();

  readonly authForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    firstName: [''],
    lastName: [''],
  });

  async onSubmit() {
    if (this.authForm.invalid || this.loading()) return;
    if (this.needsVerification()) {
      this.close.emit();
      return;
    }

    this.loading.set(true);
    try {
      const { email, password, firstName, lastName } = this.authForm.getRawValue();
      const tenantId = this.tenant.tenantId();

      if (!tenantId) throw new Error('Tenant missing');

      if (this.tab() === 'login') {
        const { error } = await this.auth.signInWithEmail(email!, password!);
        if (error) throw error;

        await this.auth.getOrCreateCustomer(tenantId);

        this.toast.success('¡Bienvenido de nuevo!');
        this.authenticated.emit();
        this.close.emit();
      } else {
        const redirectUrl = window.location.href;
        const { error } = await this.auth.signUp(email!, password!, {
          first_name: firstName,
          last_name: lastName
        }, redirectUrl);
        if (error) throw error;

        this.needsVerification.set(true);
        this.toast.success('¡Casi listo! Revisa tu correo electrónico.');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      this.toast.error(error.message || 'Error de autenticación');
    } finally {
      this.loading.set(false);
    }
  }
}
