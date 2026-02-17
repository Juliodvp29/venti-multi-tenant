import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // ── State ────────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  // ── Form ─────────────────────────────────────────────────
  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // ── Computed ─────────────────────────────────────────────
  readonly isFormValid = computed(() => this.loginForm.valid);
  readonly emailError = computed(() => {
    const control = this.loginForm.controls.email;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'El correo es requerido';
      if (control.errors['email']) return 'Correo inválido';
    }
    return null;
  });
  readonly passwordError = computed(() => {
    const control = this.loginForm.controls.password;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'La contraseña es requerida';
      if (control.errors['minlength']) return 'Mínimo 6 caracteres';
    }
    return null;
  });

  // ── Methods ──────────────────────────────────────────────
  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    const { error } = await this.authService.signInWithEmail(email, password);

    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(error.message);
      this.toast.error('Error al iniciar sesión', error.message);
    } else {
      this.toast.success('¡Bienvenido!', 'Has iniciado sesión correctamente');
      this.router.navigate(['/']);
    }
  }
}
