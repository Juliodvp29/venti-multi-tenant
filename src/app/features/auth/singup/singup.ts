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
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <!-- Background Orbs -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[250px] -left-[250px] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[80px]"></div>
        <div class="absolute -bottom-[200px] -right-[200px] w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[80px]"></div>
      </div>

      <!-- Logo -->
      <div class="relative z-10 mb-10 text-center">
        <div class="flex items-center justify-center mb-4">
          <svg viewBox="0 0 500 150" class="h-16 max-w-full drop-shadow-md" style="font-family: 'Outfit', sans-serif;">
            <g transform="translate(10, 5)">
              <path d="M 35 45 L 65 92 L 95 45 L 145 45" class="stroke-indigo-600 dark:stroke-white" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              <circle cx="50" cy="112" r="7.5" class="fill-indigo-600 dark:fill-white" />
              <circle cx="80" cy="112" r="7.5" class="fill-indigo-600 dark:fill-white" />
            </g>
            <text x="105" y="100">
              <tspan class="fill-gray-900 dark:fill-white" font-weight="700" font-size="64px">enti </tspan>
              <tspan class="fill-indigo-600 dark:fill-indigo-400" opacity="0.9" font-weight="800" font-size="64px">Shop</tspan>
            </text>
          </svg>
        </div>
        <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          Plataforma Multi-Tenant
        </p>
      </div>

      <div class="relative z-10 max-w-lg w-full bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-slide-up p-8 md:p-12">
        
        @if (isSuccess()) {
          <div class="flex flex-col items-center justify-center text-center py-8 animate-fade-in">
             <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mb-8 scale-up">
                <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
             </div>
             <h2 class="text-3xl font-black mb-4 dark:text-white tracking-tight">¡Revisa tu correo!</h2>
             <p class="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
               {{ isInviteFlow() ? 'Tu cuenta ha sido creada y te has unido a la tienda.' : 'Hemos enviado un enlace de verificación a tu correo. Por favor confírmalo para empezar.' }}
             </p>
          </div>
        } @else {
          <div class="mb-10 text-center">
            <h2 class="text-3xl font-black mb-3 dark:text-white tracking-tight">
              {{ isInviteFlow() ? 'Únete al equipo' : 'Creación de Tienda' }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {{ isInviteFlow() ? 'Completa tu registro para unirte a la tienda.' : 'Configura tu cuenta de administrador para tu nueva tienda.' }}
            </p>
          </div>

          @if (errorMessage()) {
            <div class="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-[11px] font-bold uppercase flex items-center gap-3">
               <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
               {{ errorMessage() }}
            </div>
          }

          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-6">
            @if (!isInviteFlow()) {
              <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 pl-1">Nombre del Negocio</label>
                <input type="text" formControlName="businessName" placeholder="Mi Tienda Increíble" class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                @if (businessNameError()) { <p class="text-[10px] text-red-500 font-bold px-1">{{ businessNameError() }}</p> }
              </div>
            }

            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 pl-1">Correo Electrónico</label>
              <input type="email" formControlName="email" placeholder="admin@venti.com" class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
              @if (emailError()) { <p class="text-[10px] text-red-500 font-bold px-1">{{ emailError() }}</p> }
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 pl-1">Contraseña</label>
                <div class="relative">
                  <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="••••••••" class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white pr-12">
                  <button type="button" (click)="togglePasswordVisibility()" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none focus:text-indigo-500">
                    @if (!showPassword()) {
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    }
                    @if (showPassword()) {
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    }
                  </button>
                </div>
                @if (passwordError()) { <p class="text-[10px] text-red-500 font-bold px-1">{{ passwordError() }}</p> }
              </div>
              <div class="space-y-2">
                <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 pl-1">Confirmar</label>
                <div class="relative">
                  <input [type]="showConfirmPassword() ? 'text' : 'password'" formControlName="confirmPassword" placeholder="••••••••" class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white pr-12">
                  <button type="button" (click)="toggleConfirmPasswordVisibility()" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none focus:text-indigo-500">
                    @if (!showConfirmPassword()) {
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    }
                    @if (showConfirmPassword()) {
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    }
                  </button>
                </div>
                 @if (confirmPasswordError()) { <p class="text-[10px] text-red-500 font-bold px-1">{{ confirmPasswordError() }}</p> }
              </div>
            </div>

            <div class="pt-6">
              <button 
                type="submit"
                [disabled]="isLoading()"
                class="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/30 transition-all hover:-translate-y-1 active:scale-[0.98] tracking-tight uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isLoading() ? 'Creando cuenta...' : 'Crear Mi Tienda' }}
              </button>
            </div>
          </form>

          <div class="mt-10 text-center">
             <p class="text-[11px] text-gray-400 dark:text-gray-500 font-medium tracking-tight">
               ¿Ya tienes una cuenta? 
               <a [routerLink]="['/auth/login']" class="text-indigo-600 dark:text-indigo-400 font-black hover:underline ml-1">Inicia sesión aquí</a>
             </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-fade-in {
      animation: fade-in 0.4s ease-out;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .scale-up {
      animation: scale-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes scale-up { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `],
})
export class Singup implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly supabase = inject(Supabase);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isSuccess = signal(false);

  /** Token from query param when invited as a new user */
  inviteToken = signal<string | null>(null);
  /** Selected plan from query param when registering a new store */
  selectedPlan = signal<string | null>(null);
  /** True when this registration is triggered by an invitation */
  isInviteFlow = signal(false);
  /** True when this registration is creating a new store/tenant */
  isNewStoreFlow = signal(false);

  // ── Form ─────────────────────────────────────────────────
  readonly signupForm = this.fb.nonNullable.group({
    businessName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly isFormValid = computed(() => this.signupForm.valid && this.passwordsMatch());

  readonly businessNameError = computed(() => {
    const control = this.signupForm.controls.businessName;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'El nombre del negocio es obligatorio';
      if (control.errors['minlength']) return 'Mínimo 2 caracteres';
    }
    return null;
  });

  readonly emailError = computed(() => {
    const control = this.signupForm.controls.email;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'El correo es obligatorio';
      if (control.errors['email']) return 'Correo inválido';
    }
    return null;
  });

  readonly passwordError = computed(() => {
    const control = this.signupForm.controls.password;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'La contraseña es obligatoria';
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

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['invite_token'];
      const planId = params['plan'];
      const email = params['email'];

      if (token) {
        this.inviteToken.set(token);
        this.isInviteFlow.set(true);

        // When invited, they're joining an existing store, not creating a new one
        // so businessName is not required — use a placeholder
        this.signupForm.controls.businessName.clearValidators();
        this.signupForm.controls.businessName.setValue('invited-user');
        this.signupForm.controls.businessName.updateValueAndValidity();
      } else if (planId) {
        this.selectedPlan.set(planId);
        this.isNewStoreFlow.set(true);

        // businessName is required for new stores (standard Validators already set in fb.group)
      } else {
        // Enforce restricted registration: redirect to login if no token or plan is provided
        this.toast.warning('Registro restringido', 'Para registrarte, debes ser invitado o seleccionar un plan de nuestra página de inicio.');
        this.router.navigate(['/auth/login']);
        return;
      }

      if (email) {
        this.signupForm.controls.email.setValue(email);
      }
    });
  }

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
    const plan = this.selectedPlan();

    const { error } = await this.authService.signUp(email, password, {
      business_name: this.isInviteFlow() ? null : businessName,
      plan: plan
    }, `${window.location.origin}/dashboard`);

    if (error) {
      this.isLoading.set(false);
      this.errorMessage.set(error.message);
      this.toast.error('Error en el registro', error.message);
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
          console.warn('Could not auto-accept invitation:', acceptError);
          this.toast.warning(
            'Cuenta creada',
            'Tu cuenta fue creada pero hubo un problema al unirte a la tienda. Por favor intenta abrir el enlace de invitación de nuevo.'
          );
        } else {
          this.toast.success('¡Bienvenido!', 'Tu cuenta fue creada y te has unido exitosamente a la tienda.');
        }

        this.isLoading.set(false);
        this.isSuccess.set(true);
        setTimeout(() => this.router.navigate(['/select-store']), 1500);
      } catch (err: any) {
        console.warn('Invite acceptance error:', err);
        this.isLoading.set(false);
        //this.toast.success('¡Registro exitoso!', 'Revisa tu correo para confirmar tu cuenta.');
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


