import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styles: [`
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scale-up {
      from { transform: scale(0.5); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes pulse-soft {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-fade-in { animation: fade-in 0.4s ease-out; }
    .animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
  `],
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isSuccess = signal(false);
  readonly isRecoveryFlow = signal(false);

  constructor() {
    // Detect if we're in a recovery flow (redirected from Supabase after password reset)
    // Supabase redirects with #access_token=...&type=recovery
    effect(() => {
      const hash = window.location.hash;
      if (hash.includes('type=recovery')) {
        this.isRecoveryFlow.set(true);
        this.isSuccess.set(true);
        // Clear the hash
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });
  }

  readonly resetPasswordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly passwordError = computed(() => {
    const control = this.resetPasswordForm.controls.password;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'La contraseña es obligatoria';
      if (control.errors['minlength']) return 'Mínimo 8 caracteres';
    }
    return null;
  });

  readonly confirmPasswordError = computed(() => {
    const control = this.resetPasswordForm.controls.confirmPassword;
    if (control.touched) {
      if (control.errors?.['required']) return 'Confirma tu contraseña';
      if (!this.passwordsMatch()) return 'Las contraseñas no coinciden';
    }
    return null;
  });

  readonly passwordStrength = computed(() => {
    const password = this.resetPasswordForm.controls.password.value;
    if (!password) return { level: 0, text: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 1, text: 'Débil', color: 'var(--color-error-500)' };
    if (strength <= 3) return { level: 2, text: 'Media', color: 'var(--color-warning-500)' };
    return { level: 3, text: 'Fuerte', color: 'var(--color-success-500)' };
  });

  passwordsMatch(): boolean {
    const password = this.resetPasswordForm.controls.password.value;
    const confirmPassword = this.resetPasswordForm.controls.confirmPassword.value;
    return password === confirmPassword;
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.resetPasswordForm.invalid || !this.passwordsMatch()) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { password } = this.resetPasswordForm.getRawValue();

    const { error } = await this.authService.updatePassword(password);

    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(error.message);
      this.toast.error('Error', error.message);
    } else {
      this.isSuccess.set(true);
      this.toast.success('¡Contraseña actualizada!', 'Tu contraseña ha sido restablecida exitosamente');
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
    }
  }
}