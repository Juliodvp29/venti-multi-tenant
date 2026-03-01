import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BILLING_PLANS, BillingPlan } from '@core/models/billing.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-purchase',
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase.html',
  styleUrl: './purchase.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Purchase implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly plan = signal<BillingPlan | undefined>(undefined);
  readonly isProcessing = signal(false);
  readonly isSuccess = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const planId = params['plan'];
      if (!planId) {
        this.router.navigate(['/']);
        return;
      }
      const found = BILLING_PLANS.find(p => p.id === planId);
      if (!found) {
        this.router.navigate(['/']);
        return;
      }
      this.plan.set(found);
    });
  }

  onExpiryInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
  }

  onCvcInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').substring(0, 3);
  }

  onConfirm(event: Event) {
    event.preventDefault();
    this.isProcessing.set(true);

    setTimeout(() => {
      this.isSuccess.set(true);
      setTimeout(() => {
        this.router.navigate(['/auth/register'], {
          queryParams: { plan: this.plan()?.id }
        });
      }, 1500);
    }, 2000);
  }
}
