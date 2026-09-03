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
    <div
      class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
    >
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
          <!-- Vcart Logo -->
          <svg
            viewBox="0 0 520 150"
            class="h-12 w-auto drop-shadow-sm animate-fade-in"
            style="font-family: 'Plus Jakarta Sans', sans-serif;"
          >
            <defs>
              <linearGradient id="acceptInviteGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0284c7" />
                <stop offset="100%" stop-color="#38bdf8" />
              </linearGradient>
            </defs>

            <!-- Icono: V tipo checkmark con trazos redondeados -->
            <g transform="translate(15, 10)">
              <path
                d="M 12 45 L 45 100 L 90 15"
                stroke="url(#acceptInviteGrad)"
                stroke-width="30"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              />
            </g>

            <text x="150" y="100">
              <tspan
                class="fill-gray-900 dark:fill-white italic"
                font-weight="800"
                font-size="58px"
              >
                Venti Shop
              </tspan>
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
        <div
          class="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-700"
        >
          @if (isLoading()) {
            <div class="flex justify-center py-8">
              <div
                class="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"
              ></div>
            </div>
          } @else if (errorMsg()) {
            <div class="text-center py-6">
              <div
                class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
              >
                <svg
                  class="h-8 w-8 text-red-600 dark:text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 class="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                Invitación inválida
              </h3>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ errorMsg() }}</p>
              <div class="mt-6">
                <button
                  class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                  (click)="goToDashboard()"
                >
                  Volver
                </button>
              </div>
            </div>
          } @else {
            <div class="text-center py-4 space-y-6">
              <div
                class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-900/30"
              >
                <svg
                  class="h-10 w-10 text-sky-600 dark:text-sky-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>

              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">¡Has sido invitado!</h3>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Has sido invitado a unirte a una tienda Venti como
                  <span class="font-bold capitalize">{{ inviteDetails()?.role }}</span
                  >.
                </p>
              </div>

              <div class="pt-4 flex gap-3">
                <button
                  class="flex-1 flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  [disabled]="isSubmitting()"
                  (click)="decline()"
                >
                  Rechazar
                </button>
                <button
                  class="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
                  [disabled]="isSubmitting()"
                  (click)="accept()"
                >
                  {{ isSubmitting() ? 'Accepting...' : 'Accept Invite' }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
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
    this.route.queryParams.subscribe(async (params) => {
      const token = params['token'];
      if (!token) {
        this.errorMsg.set(
          'No invitation token found in the URL. Please make sure you copied the entire link.',
        );
        this.isLoading.set(false);
        return;
      }

      this.token.set(token);
      await this.verifyToken(token);
    });
  }

  async verifyToken(token: string) {
    try {
      const { data, error } = await (this.tenantService['supabase'].client.from as any)(
        'tenant_invitations',
      )
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
      const { error } = await (this.tenantService['supabase'].client.rpc as any)(
        'accept_tenant_invitation',
        {
          invitation_token: this.token(),
        },
      );

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
