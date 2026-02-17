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
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 3.129 3h17.742a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          </div>
          <h1 class="logo-text">Venti</h1>
          <p class="logo-subtitle">Plataforma Multi-Tenant</p>
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

    .logo-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto var(--spacing-4);
      background: linear-gradient(135deg, var(--auth-gradient-from), var(--auth-gradient-to));
      border-radius: var(--radius-2xl);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-2xl);
      animation: logoFloat 3s ease-in-out infinite;
    }

    @keyframes logoFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    .logo-icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }

    .logo-text {
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-extrabold);
      margin: 0 0 var(--spacing-2);
      background: linear-gradient(135deg, var(--auth-gradient-from), var(--auth-gradient-to));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
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
