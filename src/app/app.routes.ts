import { Routes } from '@angular/router';
import { guestGuard } from '@core/guards/guest.guard';
import { authGuard } from '@core/guards/auth.guard';
import { MainLayoutComponent } from '@core/layouts/main-layout/main-layout.component';
import { storeGuard } from '@core/guards/store.guard';
import { roleGuard } from '@core/guards/role.guard';

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
    path: 'select-store',
    canActivate: [authGuard],
    loadComponent: () => import('@features/store-selection/select-store').then((m) => m.SelectStoreComponent),
  },
  {
    path: 'accept-invite',
    canActivate: [authGuard],
    loadComponent: () => import('@features/store-selection/accept-invite').then((m) => m.AcceptInviteComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['viewer', 'editor'] },
        loadComponent: () => import('@features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'products',
        canActivate: [roleGuard],
        data: { roles: ['viewer', 'editor'] },
        loadComponent: () => import('@features/products-catalog/products-catalog').then((m) => m.ProductsCatalog),
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: [] },
        loadComponent: () => import('@features/settings/settings').then((m) => m.Settings),
      },
      {
        path: 'members',
        canActivate: [roleGuard],
        data: { roles: [] },
        loadComponent: () => import('@features/members/members').then((m) => m.Members),
      },
      {
        path: 'coupons',
        canActivate: [roleGuard],
        data: { roles: ['editor'] },
        loadComponent: () => import('@features/coupons/coupons').then((m) => m.Coupons),
      },
      {
        path: 'subscription',
        canActivate: [roleGuard],
        data: { roles: ['owner'] },
        loadComponent: () => import('@features/subscription/subscription').then((m) => m.Subscription),
      },
      {
        path: 'orders',
        canActivate: [roleGuard],
        data: { roles: ['viewer', 'editor', 'delivery'] },
        loadChildren: () => import('@features/orders/orders.routes').then((m) => m.ordersRoutes),
      },
      {
        path: 'customers',
        canActivate: [roleGuard],
        data: { roles: ['editor'] },
        loadChildren: () => import('@features/customers/customers.routes').then((m) => m.customersRoutes),
      },
      {
        path: 'inventory-history',
        canActivate: [roleGuard],
        data: { roles: ['editor'] },
        loadComponent: () => import('@features/inventory-history/inventory-history').then((m) => m.InventoryHistory),
      },
      {
        path: 'reviews',
        canActivate: [roleGuard],
        data: { roles: ['editor'] },
        loadChildren: () => import('@features/reviews/reviews.routes').then((m) => m.REVIEWS_ROUTES),
      },
      {
        path: 'abandoned-carts',
        canActivate: [roleGuard],
        data: { roles: ['editor'] },
        loadComponent: () => import('@features/abandoned-carts/abandoned-carts').then((m) => m.AbandonedCarts),
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['editor'] },
        loadComponent: () => import('@features/reports/reports').then((m) => m.Reports),
      },
    ],
  },
  {
    path: 'store',
    canActivate: [storeGuard],
    loadChildren: () => import('./features/store/store.routes').then((m) => m.STORE_ROUTES),
  },
  {
    path: '**',
    loadComponent: () =>
      import('@shared/components/not-found/not-found').then((m) => m.NotFound),
  },
];
