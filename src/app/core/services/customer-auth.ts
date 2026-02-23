import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from './auth';
import { TenantService } from './tenant';

@Injectable({
    providedIn: 'root'
})
export class CustomerAuthService {
    private readonly auth = inject(AuthService);
    private readonly tenant = inject(TenantService);

    readonly showModal = signal(false);

    openLogin() {
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
    }

    async ensureCustomer() {
        const tenantId = this.tenant.tenantId();
        if (tenantId) {
            return this.auth.getOrCreateCustomer(tenantId);
        }
        return null;
    }
}
