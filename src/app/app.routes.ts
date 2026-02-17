import { Routes } from '@angular/router';
import { guestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
 {
    path: 'auth',
     canActivate: [guestGuard],
     loadChildren: () => import('@features/auth/auth.routes').then((m) => m.authRoutes),
},
  {
    path: '**',
    loadComponent: () =>
      import('@shared/components/not-found/not-found').then((m) => m.NotFound),
  },
];

