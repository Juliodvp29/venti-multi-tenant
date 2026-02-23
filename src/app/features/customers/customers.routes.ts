import { Routes } from '@angular/router';

export const customersRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./customers-list/customers-list').then((m) => m.CustomersList),
    },
    {
        path: ':id',
        loadComponent: () => import('./customer-details/customer-details').then((m) => m.CustomerDetails),
    },
];
