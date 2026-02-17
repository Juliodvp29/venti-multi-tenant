import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-singup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './singup.html',
  styleUrl: './singup.css',
})
export class Singup {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // ── State ────────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isSuccess = signal(false);

  // ── Form ─────────────────────────────────────────────────
  readonly signupForm = this.fb.nonNullable.group({
    businessName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  // ── Computed ─────────────────────────────────────────────
  readonly isFormValid = computed(() => this.signupForm.valid && this.passwordsMatch());

  readonly businessNameError = computed(() => {
    const control = this.signupForm.controls.businessName;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'El nombre del negocio es requerido';
      if (control.errors['minlength']) return 'Mínimo 2 caracteres';
    }
    return null;
  });

  readonly emailError = computed(() => {
    const control = this.signupForm.controls.email;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'El correo es requerido';
      if (control.errors['email']) return 'Correo inválido';
    }
    return null;
  });

  readonly passwordError = computed(() => {
    const control = this.signupForm.controls.password;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'La contraseña es requerida';
      if (control.errors['minlength']) return 'Mínimo 8 caracteres';
    }
    return null;
  });

  readonly confirmPasswordError = computed(() => {
    const control = this.signupForm.controls.confirmPassword;
    if (control.touched) {
      if (control.errors?.['required']) return 'Confirma tu contraseña';
      if (!this.passwordsMatch()) return 'Las contraseñas no coinciden';
    }
    return null;
  });

  readonly passwordStrength = computed(() => {
    const password = this.signupForm.controls.password.value;
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

  // ── Methods ──────────────────────────────────────────────
  passwordsMatch(): boolean {
    const password = this.signupForm.controls.password.value;
    const confirmPassword = this.signupForm.controls.confirmPassword.value;
    return password === confirmPassword;
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.signupForm.invalid || !this.passwordsMatch()) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { businessName, email, password } = this.signupForm.getRawValue();

    const { error } = await this.authService.signUp(email, password, businessName);

    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(error.message);
      this.toast.error('Error al registrarse', error.message);
    } else {
      this.isSuccess.set(true);
      this.toast.success('¡Registro exitoso!', 'Revisa tu correo para confirmar tu cuenta');
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);
    }
  }
}
