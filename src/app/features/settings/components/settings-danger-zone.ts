import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';

@Component({
    selector: 'app-settings-danger-zone',
    imports: [FormsModule],
    templateUrl: './settings-danger-zone.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDangerZone {
    private readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);
    readonly isDeleting = signal(false);
    readonly showDeleteModal = signal(false);
    readonly confirmationName = signal('');
    readonly tenant = this.tenantService.currentTenant;

    openDeleteModal() {
        this.confirmationName.set('');
        this.showDeleteModal.set(true);
    }

    closeDeleteModal() {
        if (!this.isDeleting()) this.showDeleteModal.set(false);
    }

    async deleteStore() {
        const currentTenant = this.tenant();
        if (!currentTenant || this.confirmationName().trim() !== currentTenant.business_name.trim()) return;

        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return;

        this.isDeleting.set(true);

        try {
            const result = await this.tenantService.deleteTenant(tenantId);
            if (result.success) {
                this.toastService.success('Tienda eliminada exitosamente');
                this.showDeleteModal.set(false);
                // Redirect or handle post-deletion state
                window.location.href = '/';
            } else {
                this.toastService.error(result.error || 'Error al eliminar la tienda');
            }
        } catch (error) {
            console.error('Error deleting store:', error);
            this.toastService.error('Error al eliminar la tienda');
        } finally {
            this.isDeleting.set(false);
        }
    }
}
