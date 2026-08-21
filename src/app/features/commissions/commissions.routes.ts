import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/role.guard';

export const COMMISSIONS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./commissions').then(m => m.Commissions),
        canActivate: [adminGuard],
    },
];