import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout min-h-screen flex items-center justify-center p-6 bg-white dark:bg-gray-900">
      <!-- Content Container -->
      <div class="auth-container">
        <!-- Logo -->
        <div class="auth-logo">
          <div class="flex items-center justify-center mb-4">
            <!-- Agregamos text-gray-900 para modo claro y dark:text-white para modo oscuro -->
            <svg viewBox="0 0 520 150" class="h-10 w-auto text-gray-900 dark:text-white" style="font-family: 'Plus Jakarta Sans', sans-serif;">
              <defs>
                <linearGradient id="authVentiGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#0284c7" />
                  <stop offset="100%" stop-color="#38bdf8" />
                </linearGradient>
              </defs>

              <!-- Icono: V tipo checkmark con trazos redondeados -->
              <g transform="translate(15, 10)">
                <path
                  d="M 12 45 L 45 100 L 90 15"
                  stroke="url(#authVentiGrad)"
                  stroke-width="30"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                />
              </g>

              <text x="150" y="100">
                <!-- Cambiamos fill="white" por fill="currentColor" -->
                <tspan
                  fill="currentColor"
                  font-weight="800"
                  font-size="58px"
                  font-style="italic"
                >
                  Venti Shop
                </tspan>
              </text>
            </svg>
          </div>
          <p class="text-center text-[11px] font-semibold tracking-[0.3em] uppercase text-gray-700 dark:text-gray-400">
            Plataforma Multi-Tenant
          </p>
        </div>

        <!-- Page Content -->
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .auth-layout {
      min-height: 100vh;
    }

    .auth-container {
      width: 100%;
      max-width: 460px;
      position: relative;
    }

    .auth-logo {
      text-align: center;
      margin-bottom: 2rem;
    }
  `,
})
export class AuthLayout { }