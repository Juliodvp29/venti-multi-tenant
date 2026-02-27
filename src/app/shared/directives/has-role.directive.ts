import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { TenantService } from '@core/services/tenant';
import { TenantRole } from '@core/enums';

@Directive({
    selector: '[appHasRole]',
    standalone: true
})
export class HasRoleDirective {
    private readonly templateRef = inject(TemplateRef);
    private readonly viewContainer = inject(ViewContainerRef);
    private readonly tenantService = inject(TenantService);

    private allowedRoles: TenantRole[] = [];
    private hasView = false;

    constructor() {
        // Re-evaluate visibility whenever the user's role in the current tenant changes
        effect(() => {
            // Temporarily use a static admin role until we read from TenantService
            const currentRole = (this.tenantService as any).currentRole ? (this.tenantService as any).currentRole() : TenantRole.Admin;
            this.updateView(currentRole);
        });
    }

    @Input() set appHasRole(roles: string | string[]) {
        const stringRoles = Array.isArray(roles) ? roles : [roles];
        this.allowedRoles = stringRoles as TenantRole[];
        // We update eagerly in case the effect hasn't run yet but the input changed
        const currentRole = (this.tenantService as any).currentRole ? (this.tenantService as any).currentRole() : TenantRole.Admin;
        this.updateView(currentRole);
    }

    private updateView(currentRole: TenantRole | null) {
        if (!currentRole) {
            this.clearView();
            return;
        }

        // Owner and Admin always have access unless strictly excluded (which we rarely do)
        const isAdminOrOwner = currentRole === TenantRole.Owner || currentRole === TenantRole.Admin;
        const hasRequiredRole = this.allowedRoles.includes(currentRole);

        if (isAdminOrOwner || hasRequiredRole) {
            this.createView();
        } else {
            this.clearView();
        }
    }

    private createView() {
        if (!this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        }
    }

    private clearView() {
        if (this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }
    }
}
