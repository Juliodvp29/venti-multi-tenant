import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  // ── State ────────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isSuccess = signal(false);

  // ── Form ─────────────────────────────────────────────────
  readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // ── Computed ─────────────────────────────────────────────
  readonly emailError = computed(() => {
    const control = this.forgotPasswordForm.controls.email;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'El correo es requerido';
      if (control.errors['email']) return 'Correo inválido';
    }
    return null;
  });

  // ── Methods ──────────────────────────────────────────────
  async onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email } = this.forgotPasswordForm.getRawValue();

    const { error } = await this.authService.resetPassword(email);

    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(error.message);
      this.toast.error('Error', error.message);
    } else {
      this.isSuccess.set(true);
      this.toast.success('Correo enviado', 'Revisa tu bandeja de entrada para restablecer tu contraseña');
    }
  }
}
