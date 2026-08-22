import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '@core/services/tenant';
import { StorefrontSection } from '@core/models';

@Component({
    selector: 'app-store-about',
    imports: [CommonModule],
    templateUrl: './store-about.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreAbout {
    private readonly tenantService = inject(TenantService);

    readonly branding = this.tenantService.branding;
    readonly pageConfig = computed(() => this.tenantService.getPageLayout('about'));
    readonly sections = computed<StorefrontSection[]>(() => this.pageConfig()?.sections || []);

    asAny(val: any): any {
        return val;
    }
}
