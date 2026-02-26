import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <!-- Background Gradient -->
      <div class="auth-background">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
      </div>

      <!-- Content Container -->
      <div class="auth-container">
        <!-- Logo -->
        <div class="auth-logo">
          <div class="flex items-center justify-center mb-6 logo-container">
            <svg viewBox="0 0 500 150" class="h-20 max-w-full drop-shadow-md" style="font-family: 'Outfit', sans-serif;">
              <defs>
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&display=swap');
                </style>
              </defs>
              <g transform="translate(10, 5)">
                <path d="M 35 45 L 65 92 L 95 45 L 145 45" class="stroke-white" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                <circle cx="50" cy="112" r="7.5" class="fill-white" />
                <circle cx="80" cy="112" r="7.5" class="fill-white" />
              </g>

              <text x="105" y="100">
                <tspan class="fill-white" font-weight="700" font-size="64px">enti </tspan>
                <tspan class="fill-white" opacity="0.9" font-weight="800" font-size="64px">Shop</tspan>
              </text>
            </svg>
          </div>
          <p class="logo-subtitle mt-2 text-center text-sm font-medium tracking-widest uppercase">
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
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-4);
      position: relative;
      overflow: hidden;
      background: var(--auth-bg);
    }

    .auth-background {
      position: absolute;
      inset: 0;
      overflow: hidden;
      z-index: 0;
    }

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.3;
      animation: float 20s ease-in-out infinite;
    }

    .orb-1 {
      width: 500px;
      height: 500px;
      background: linear-gradient(135deg, var(--auth-gradient-from), var(--auth-gradient-to));
      top: -250px;
      left: -250px;
      animation-delay: 0s;
    }

    .orb-2 {
      width: 400px;
      height: 400px;
      background: linear-gradient(225deg, var(--color-accent-500), var(--color-primary-500));
      bottom: -200px;
      right: -200px;
      animation-delay: 7s;
    }

    .orb-3 {
      width: 300px;
      height: 300px;
      background: linear-gradient(315deg, var(--color-secondary-500), var(--color-accent-500));
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: 14s;
    }

    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(30px, -30px) scale(1.1);
      }
      66% {
        transform: translate(-20px, 20px) scale(0.9);
      }
    }

    .auth-container {
      width: 100%;
      max-width: 480px;
      position: relative;
      z-index: 1;
    }

    .auth-logo {
      text-align: center;
      margin-bottom: var(--spacing-8);
    }

    .logo-container {
      animation: logoFloat 3s ease-in-out infinite;
    }

    @keyframes logoFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }

    .logo-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    @media (prefers-color-scheme: dark) {
      .logo-subtitle {
        color: var(--color-gray-400);
      }
    }
  `,
})
export class AuthLayout { }
