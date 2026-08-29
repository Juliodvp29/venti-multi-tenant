import { Routes } from '@angular/router';

export const REVIEWS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./reviews').then((m) => m.Reviews),
  },
];
