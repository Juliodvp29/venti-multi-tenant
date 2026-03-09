import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { ProductGrid } from '../product-grid/product-grid';
import { StorefrontSection } from '@core/models';

@Component({
    selector: 'app-store-home',
    imports: [RouterModule, ProductGrid],
    templateUrl: './store-home.html',
    styleUrl: './store-home.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreHome {
    private readonly tenantService = inject(TenantService);

    readonly layout = this.tenantService.storefrontLayout;
    readonly activeSections = computed(() =>
        this.layout().sections.filter((s: StorefrontSection) => s.isActive)
    );

    readonly hasFeaturedProducts = signal(true);

    onProductsLoaded(hasProducts: boolean) {
        this.hasFeaturedProducts.set(hasProducts);
    }

    asAny(val: any): any { return val; }
}
