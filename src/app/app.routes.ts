import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  // ── Auth (public) ────────────────────────────────────────
//   {
//     path: 'auth',
//     canActivate: [guestGuard],
//     loadChildren: () => import('@features/auth/auth.routes').then((m) => m.authRoutes),
//   },
  // ── Dashboard (protected) ────────────────────────────────
//   {
//     path: 'dashboard',
//     canActivate: [authGuard],
//     loadComponent: () =>
//       import('@features/dashboard/layouts/dashboard-layout/dashboard-layout').then(
//         (m) => m.DashboardLayout
//       ),
//     children: [
//       {
//         path: '',
//         loadComponent: () =>
//           import('@features/dashboard/pages/home/home').then((m) => m.HomePage),
//       },
//       {
//         path: 'products',
//         loadChildren: () =>
//           import('@features/products/products.routes').then((m) => m.productRoutes),
//       },
//       {
//         path: 'orders',
//         loadChildren: () =>
//           import('@features/orders/orders.routes').then((m) => m.orderRoutes),
//       },
//       {
//         path: 'customers',
//         loadChildren: () =>
//           import('@features/customers/customers.routes').then((m) => m.customerRoutes),
//       },
//       {
//         path: 'analytics',
//         loadChildren: () =>
//           import('@features/analytics/analytics.routes').then((m) => m.analyticsRoutes),
//       },
//       {
//         path: 'settings',
//         loadChildren: () =>
//           import('@features/settings/settings.routes').then((m) => m.settingRoutes),
//       },
//     ],
//   },
  // ── Fallback ─────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('@shared/components/not-found/not-found').then((m) => m.NotFound),
  },
];

