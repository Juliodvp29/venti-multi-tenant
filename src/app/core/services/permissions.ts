import { computed, inject, Injectable } from '@angular/core';
import { TenantRole } from '@core/enums';
import { TenantService } from './tenant';

/**
 * Application modules — each key maps to a route or feature area.
 */
export type AppModule =
    | 'dashboard'
    | 'products'
    | 'inventory-history'
    | 'orders'
    | 'customers'
    | 'members'
    | 'coupons'
    | 'abandoned-carts'
    | 'reports'
    | 'reviews'
    | 'subscription'
    | 'settings';

/**
 * Permission matrix — defines which roles can access each module.
 * Order matters: more permissive roles first.
 */
const ROLE_PERMISSIONS: Record<AppModule, TenantRole[]> = {
    dashboard: [TenantRole.Owner, TenantRole.Admin, TenantRole.Viewer],
    products: [TenantRole.Owner, TenantRole.Admin, TenantRole.Editor, TenantRole.Viewer],
    'inventory-history': [TenantRole.Owner, TenantRole.Admin, TenantRole.Editor],
    orders: [TenantRole.Owner, TenantRole.Admin, TenantRole.Editor, TenantRole.Viewer, TenantRole.Delivery],
    customers: [TenantRole.Owner, TenantRole.Admin, TenantRole.Editor],
    members: [TenantRole.Owner, TenantRole.Admin],
    coupons: [TenantRole.Owner, TenantRole.Admin, TenantRole.Editor],
    'abandoned-carts': [TenantRole.Owner, TenantRole.Admin, TenantRole.Editor],
    reports: [TenantRole.Owner, TenantRole.Admin],
    reviews: [TenantRole.Owner, TenantRole.Admin, TenantRole.Editor],
    subscription: [TenantRole.Owner, TenantRole.Admin],
    settings: [TenantRole.Owner, TenantRole.Admin],
};

@Injectable({
    providedIn: 'root',
})
export class PermissionsService {
    private readonly tenantService = inject(TenantService);

    /** Current role of the active member (null if not loaded yet). */
    private readonly role = computed(() => this.tenantService.memberRole() as TenantRole | null);

    /**
     * Returns true if the current user has access to the given module.
     * Use this for template `@if` checks in the sidebar.
     */
    canAccess(module: AppModule): boolean {
        const role = this.role();
        if (!role) return false;
        return ROLE_PERMISSIONS[module]?.includes(role) ?? false;
    }

    /**
     * Signal-based version of canAccess — useful with Angular signals in templates.
     * Example: `permissionsService.canAccessSignal('orders')()`
     */
    canAccessSignal(module: AppModule) {
        return computed(() => {
            const role = this.role();
            if (!role) return false;
            return ROLE_PERMISSIONS[module]?.includes(role) ?? false;
        });
    }

    /**
     * List of all modules the current user can access.
     * Computed signal — updates automatically when role changes.
     */
    readonly allowedModules = computed<AppModule[]>(() => {
        const role = this.role();
        if (!role) return [];
        return (Object.keys(ROLE_PERMISSIONS) as AppModule[]).filter(
            (module) => ROLE_PERMISSIONS[module].includes(role)
        );
    });

    /**
     * True when the current user is a Delivery agent.
     * Used to apply the strict lock-down UI in the sidebar.
     */
    readonly isDeliveryUser = computed(() => this.role() === TenantRole.Delivery);

    /**
     * True when the current user can only read data (Viewer role).
     */
    readonly isViewerOnly = computed(() => this.role() === TenantRole.Viewer);

    /**
     * True when the current user has full management rights (Owner or Admin).
     */
    readonly isManager = computed(
        () => this.role() === TenantRole.Owner || this.role() === TenantRole.Admin
    );

    /**
     * Returns the allowed roles for a given module.
     * Useful for displaying descriptive access hints in the UI.
     */
    getAllowedRoles(module: AppModule): TenantRole[] {
        return ROLE_PERMISSIONS[module] ?? [];
    }
}
