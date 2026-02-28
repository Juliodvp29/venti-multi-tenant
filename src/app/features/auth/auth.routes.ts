import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        title: 'Iniciar Sesión | Venti Shop',
        loadComponent: () =>
          import('./login/login').then((m) => m.Login),
      },
      {
        path: 'forgot-password',
        title: 'Recuperar Contraseña | Venti Shop',
        loadComponent: () =>
          import('./forgot-password/forgot-password').then((m) => m.ForgotPassword),
      },
      {
        path: 'reset-password',
        title: 'Nueva Contraseña | Venti Shop',
        loadComponent: () =>
          import('./reset-password/reset-password').then((m) => m.ResetPassword),
      },
    ],
  },
  {
    path: 'purchase',
    loadComponent: () =>
      import('./purchase/purchase').then((m) => m.Purchase),
  },
  {
    path: 'register',
    title: 'Crear Cuenta | Venti Shop',
    loadComponent: () =>
      import('./singup/singup').then((m) => m.Singup),
  },
];
