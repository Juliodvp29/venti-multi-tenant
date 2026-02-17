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
        title: 'Iniciar Sesión | Venti',
        loadComponent: () =>
          import('./login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        title: 'Crear Cuenta | Venti',
        loadComponent: () =>
          import('./singup/singup').then((m) => m.Singup),
      },
      {
        path: 'forgot-password',
        title: 'Recuperar Contraseña | Venti',
        loadComponent: () =>
          import('./forgot-password/forgot-password').then((m) => m.ForgotPassword),
      },
      {
        path: 'reset-password',
        title: 'Nueva Contraseña | Venti',
        loadComponent: () =>
          import('./reset-password/reset-password').then((m) => m.ResetPassword),
      },
    ],
  },
];
