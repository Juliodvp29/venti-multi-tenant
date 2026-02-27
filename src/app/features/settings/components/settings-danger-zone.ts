import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';

@Component({
    selector: 'app-settings-danger-zone',
    imports: [],
    templateUrl: './settings-danger-zone.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDangerZone {
    private readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);
    readonly isDeleting = signal(false);

    async deleteStore() {
        const confirmed = await this.toastService.confirm(
            'Are you sure you want to delete this store? This action cannot be undone.',
            'Delete Store'
        );

        if (!confirmed) {
            return;
        }

        const tenantId = this.tenantService.tenantId();
        if (!tenantId) return;

        this.isDeleting.set(true);

        try {
            const result = await this.tenantService.deleteTenant(tenantId);
            if (result.success) {
                this.toastService.success('Store deleted successfully');
                // Redirect or handle post-deletion state
                window.location.href = '/';
            } else {
                this.toastService.error(result.error || 'Error deleting store');
            }
        } catch (error) {
            console.error('Error deleting store:', error);
            this.toastService.error('Error deleting store');
        } finally {
            this.isDeleting.set(false);
        }
    }
}
