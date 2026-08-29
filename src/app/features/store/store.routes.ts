import { Routes } from '@angular/router';

export const STORE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./store').then(m => m.StoreComponent),
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
                path: 'carrito',
                loadComponent: () => import('./pages/store-cart/store-cart').then(m => m.StoreCart)
            },
            {
                path: 'contacto',
                loadComponent: () => import('./pages/store-contact/store-contact').then(m => m.StoreContact)
            },
            {
                path: 'nosotros',
                loadComponent: () => import('./pages/store-about/store-about').then(m => m.StoreAbout)
            },
            {
                path: 'checkout',
                loadComponent: () => import('./components/checkout/checkout').then(m => m.Checkout)
            },
            {
                path: 'success',
                loadComponent: () => import('./components/order-success/order-success').then(m => m.OrderSuccess)
            },
            {
                path: 'account',
                loadComponent: () => import('./components/account/account').then(m => m.Account),
                children: [
                    {
                        path: '',
                        redirectTo: 'direcciones',
                        pathMatch: 'full'
                    },
                    {
                        path: 'direcciones',
                        loadComponent: () => import('./components/account/addresses/addresses').then(m => m.Addresses)
                    }
                ]
            }
        ]
    }
];
