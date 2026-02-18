import { Routes } from '@angular/router';
import { guestGuard } from '@core/guards/guest.guard';
import { authGuard } from '@core/guards/auth.guard';
import { MainLayoutComponent } from '@core/layouts/main-layout/main-layout.component';

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
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('@features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'products',
        loadComponent: () => import('@features/products-catalog/products-catalog').then((m) => m.ProductsCatalog),
      },
      {
        path: 'settings',
        loadComponent: () => import('@features/settings/settings').then((m) => m.Settings),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('@shared/components/not-found/not-found').then((m) => m.NotFound),
  },
];
