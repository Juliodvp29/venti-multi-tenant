import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';
import { Supabase } from '@core/services/supabase';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-singup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './singup.html',
  styleUrl: './singup.css',
})
export class Singup implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly supabase = inject(Supabase);

  // ── State ────────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isSuccess = signal(false);

  /** Token from query param when invited as a new user */
  inviteToken = signal<string | null>(null);
  /** True when this registration is triggered by an invitation */
  isInviteFlow = signal(false);

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

  // ── Lifecycle ────────────────────────────────────────────
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['invite_token'];
      const email = params['email'];

      if (token) {
        this.inviteToken.set(token);
        this.isInviteFlow.set(true);

        // When invited, they're joining an existing store, not creating a new one
        // so businessName is not required — use a placeholder
        this.signupForm.controls.businessName.clearValidators();
        this.signupForm.controls.businessName.setValue('invited-user');
        this.signupForm.controls.businessName.updateValueAndValidity();
      } else {
        // Enforce invite-only registration: redirect to login if no token is provided
        this.toast.warning('Registro restringido', 'El registro de nuevas cuentas está disponible únicamente mediante invitación.');
        this.router.navigate(['/auth/login']);
        return;
      }

      if (email) {
        this.signupForm.controls.email.setValue(email);
      }
    });
  }

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
    const token = this.inviteToken();

    const { error } = await this.authService.signUp(email, password, {
      business_name: this.isInviteFlow() ? null : businessName
    });

    if (error) {
      this.isLoading.set(false);
      this.errorMessage.set(error.message);
      this.toast.error('Error al registrarse', error.message);
      return;
    }

    // If this is an invite flow, accept the invitation automatically after sign-up
    if (token) {
      try {
        // Small delay to ensure the auth session propagates before calling RPC
        await new Promise(resolve => setTimeout(resolve, 1500));

        const { error: acceptError } = await (this.supabase.client.rpc as any)('accept_tenant_invitation', {
          invitation_token: token
        });

        if (acceptError) {
          // Invitation acceptance failed but the account was created
          // Show a warning but still let the user in
          console.warn('Could not auto-accept invitation:', acceptError);
          this.toast.warning(
            'Cuenta creada',
            'Tu cuenta fue creada pero ocurrió un problema al unirte a la tienda. Intenta abrir el link de invitación nuevamente.'
          );
        } else {
          this.toast.success('¡Bienvenido!', 'Tu cuenta fue creada y te has unido a la tienda exitosamente.');
        }

        this.isLoading.set(false);
        this.isSuccess.set(true);
        setTimeout(() => this.router.navigate(['/select-store']), 1500);
      } catch (err: any) {
        console.warn('Invite acceptance error:', err);
        this.isLoading.set(false);
        this.toast.success('¡Registro exitoso!', 'Revisa tu correo para confirmar tu cuenta.');
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      }
    } else {
      // Normal sign-up flow
      this.isLoading.set(false);
      this.isSuccess.set(true);
      this.toast.success('¡Registro exitoso!', 'Revisa tu correo para confirmar tu cuenta');
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);
    }
  }
}


