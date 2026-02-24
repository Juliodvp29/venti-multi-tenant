import { Routes } from '@angular/router';
import { StoreComponent } from './store';

export const STORE_ROUTES: Routes = [
    {
        path: '',
        component: StoreComponent,
        children: [
            {
                path: '',
                loadComponent: () => import('./components/store-home/store-home').then(m => m.StoreHome)
            },
            {
                path: 'productos',
                loadComponent: () => import('./components/product-grid/product-grid').then(m => m.ProductGrid)
            },
            {
                path: 'product/:id',
                loadComponent: () => import('./components/product-details/product-details').then(m => m.ProductDetails)
            },
            {
                path: 'checkout',
                loadComponent: () => import('./components/checkout/checkout').then(m => m.Checkout)
            },
            {
                path: 'success',
                loadComponent: () => import('./components/order-success/order-success').then(m => m.OrderSuccess)
            }
        ]
    }
];
