import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPlan } from '@core/enums';
import { TenantService } from '@core/services/tenant';

@Component({
    selector: 'app-settings-commissions',
    imports: [CommonModule],
    templateUrl: './settings-commissions.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCommissions implements OnInit {
    private readonly tenantService = inject(TenantService);

    readonly currentPlan = this.tenantService.currentTenant;
    readonly currentPlanCommission = computed(() => this.getCommissionRate(this.currentPlan()?.plan as SubscriptionPlan));

    readonly plansInfo: { plan: SubscriptionPlan; label: string; commissionRate: number; description: string }[] = [
        { plan: SubscriptionPlan.Free, label: 'Free', commissionRate: 2.0, description: 'Ideal para empezar' },
        { plan: SubscriptionPlan.Basic, label: 'Basic', commissionRate: 1.5, description: 'Para tiendas en crecimiento' },
        { plan: SubscriptionPlan.Professional, label: 'Professional', commissionRate: 1.0, description: 'Para tiendas establecidas' },
        { plan: SubscriptionPlan.Enterprise, label: 'Enterprise', commissionRate: 0.5, description: 'Para alto volumen' },
    ];

    constructor() {
        effect(() => {
            // React to plan changes
            this.currentPlan();
        });

    }

    ngOnInit(): void {
    }

    private getCommissionRate(plan?: SubscriptionPlan): number {
        const rates: Record<SubscriptionPlan, number> = {
            [SubscriptionPlan.Free]: 2.0,
            [SubscriptionPlan.Basic]: 1.5,
            [SubscriptionPlan.Professional]: 1.0,
            [SubscriptionPlan.Enterprise]: 0.5,
        };
        return rates[plan ?? SubscriptionPlan.Free];
    }
}