import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-accept-invite',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
            <!-- Vcart Logo -->
            <svg viewBox="0 0 500 150" class="h-16 w-auto drop-shadow-md animate-fade-in" style="font-family: 'Outfit', sans-serif;">
              <defs>
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&display=swap');
                </style>
              </defs>
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
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Únete al equipo de la tienda
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Acepta tu invitación para colaborar.
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-700">
          
          @if (isLoading()) {
            <div class="flex justify-center py-8">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          } @else if (errorMsg()) {
            <div class="text-center py-6">
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <svg class="h-8 w-8 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 class="mt-4 text-lg font-bold text-gray-900 dark:text-white">Invitación inválida</h3>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ errorMsg() }}</p>
                <div class="mt-6">
                  <button
                    (click)="goToDashboard()"
                    class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Volver
                  </button>
                </div>
            </div>
          } @else {
            <div class="text-center py-4 space-y-6">
                <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                  <svg class="h-10 w-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                
                <div>
                   <h3 class="text-xl font-bold text-gray-900 dark:text-white">¡Has sido invitado!</h3>
                   <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                     Has sido invitado a unirte a una tienda Venti como <span class="font-bold capitalize">{{ inviteDetails()?.role }}</span>.
                   </p>
                </div>

                <div class="pt-4 flex gap-3">
                   <button
                    (click)="decline()"
                    [disabled]="isSubmitting()"
                    class="flex-1 flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    (click)="accept()"
                    [disabled]="isSubmitting()"
                    class="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {{ isSubmitting() ? 'Accepting...' : 'Accept Invite' }}
                  </button>
                </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AcceptInviteComponent implements OnInit {
  private readonly tenantService = inject(TenantService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMsg = signal('');
  inviteDetails = signal<any>(null);
  token = signal('');

  async ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      const token = params['token'];
      if (!token) {
        this.errorMsg.set('No invitation token found in the URL. Please make sure you copied the entire link.');
        this.isLoading.set(false);
        return;
      }

      this.token.set(token);
      await this.verifyToken(token);
    });
  }

  async verifyToken(token: string) {
    try {
      const { data, error } = await (this.tenantService['supabase'].client.from as any)('tenant_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        this.errorMsg.set('This invitation is invalid, expired, or has already been accepted.');
      } else {
        this.inviteDetails.set(data);
      }
    } catch {
      this.errorMsg.set('There was a problem verifying your invitation.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async accept() {
    this.isSubmitting.set(true);
    try {
      // Create user member & update token status
      const { error } = await (this.tenantService['supabase'].client.rpc as any)('accept_tenant_invitation', {
        invitation_token: this.token()
      });

      if (error) {
        this.toast.error(error.message || 'No se pudo aceptar la invitación');
      } else {
        this.toast.success('¡Has sido agregado a la tienda!');
        this.router.navigate(['/select-store']);
      }
    } catch (err: any) {
      this.toast.error(err.message || 'Algo salió mal');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async decline() {
    this.isSubmitting.set(true);
    try {
      // Optionally update status to declined
      await (this.tenantService['supabase'].client.from as any)('tenant_invitations')
        .update({ status: 'declined' })
        .eq('token', this.token());

      this.toast.info('Invitación rechazada');
      this.router.navigate(['/auth/login']);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goToDashboard() {
    this.router.navigate(['/auth/login']);
  }
}
