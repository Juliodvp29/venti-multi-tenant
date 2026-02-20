import { Routes } from '@angular/router';

export const ordersRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/orders-list/orders-list').then(m => m.OrdersList),
    },
    {
        path: ':id',
        loadComponent: () => import('./components/order-detail/order-detail').then(m => m.OrderDetail),
    },
];
