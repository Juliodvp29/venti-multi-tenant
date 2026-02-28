import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { DiscountsService } from '@core/services/discounts';
import { DiscountCode } from '@core/models/discount.model';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { ColumnDef, TableAction } from '@core/types/table';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';
import { CouponModalComponent } from './components/coupon-modal/coupon-modal.component';
import { GiftCouponModalComponent } from './components/gift-coupon-modal/gift-coupon-modal.component';

@Component({
  selector: 'app-coupons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DynamicTable, CouponModalComponent, GiftCouponModalComponent, DecimalPipe, CurrencyPipe],
  templateUrl: './coupons.html',
  styleUrl: './coupons.css',
})
export class Coupons implements OnInit {
  private readonly discountsService = inject(DiscountsService);
  private readonly toast = inject(ToastService);
  private readonly tenantService = inject(TenantService);

  constructor() {
    effect(() => {
      if (this.tenantService.tenantId()) {
        this.loadCoupons();
      }
    });
  }

  coupons = signal<DiscountCode[]>([]);
  isLoading = signal(false);

  isModalOpen = signal(false);
  selectedCoupon = signal<DiscountCode | null>(null);

  isGiftModalOpen = signal(false);
  currentCouponForGift = signal<DiscountCode | null>(null);

  // Stats - Dynamically calculated from data
  activeCount = computed(() => this.coupons().filter(c => c.is_active).length);
  totalRedemptions = computed(() => this.coupons().reduce((acc, c) => acc + (c.usage_count || 0), 0));
  totalDiscounted = computed(() => 12450); // This would ideally come from a real aggregated metric

  columns: ColumnDef<DiscountCode>[] = [
    {
      key: 'code',
      label: 'COUPON CODE',
      formatter: (val) => `<span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded font-medium">${val}</span>`
    },
    { key: 'type', label: 'TYPE' },
    {
      key: 'value',
      label: 'VALUE',
      formatter: (val, item) => item.type === 'percentage' ? `${val}% Off` : `$${val}`
    },
    {
      key: 'usage_count',
      label: 'USAGE COUNT',
      formatter: (val, item) => `${val} / ${item.usage_limit || 'Unlimited'}`
    },
    {
      key: 'is_active',
      label: 'STATUS',
      formatter: (val) => val
        ? '<span class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium"><span class="w-1.5 h-1.5 rounded-full bg-green-600"></span> Active</span>'
        : '<span class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 text-xs font-medium"><span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Inactive</span>'
    }
  ];

  actions: TableAction<DiscountCode>[] = [
    {
      id: 'gift',
      label: 'Gift',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0l4 4m-4-4l-4 4m4-4v13m-8-2h16" />
             </svg>`,
      callback: (item) => this.openGiftModal(item)
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
             </svg>`,
      callback: (item) => this.openCouponModal(item)
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>`,
      className: 'text-red-600',
      callback: (item) => this.deleteCoupon(item.id)
    }
  ];

  ngOnInit() {
    this.loadCoupons();
  }

  async loadCoupons() {
    try {
      this.isLoading.set(true);
      const { data } = await this.discountsService.getDiscountCodes();
      this.coupons.set(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      // Fail silently if it's just a missing tenant during init
      if (!(error instanceof Error && error.message.includes('Tenant'))) {
        this.toast.error('Error loading coupons');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  onAction(event: { actionId: string; item: DiscountCode }) {
    if (event.actionId === 'edit') {
      this.openCouponModal(event.item);
    } else if (event.actionId === 'delete') {
      this.deleteCoupon(event.item.id);
    }
  }

  openCouponModal(coupon?: DiscountCode) {
    this.selectedCoupon.set(coupon || null);
    this.isModalOpen.set(true);
  }

  onModalClose() {
    this.isModalOpen.set(false);
    this.selectedCoupon.set(null);
  }

  openGiftModal(coupon: DiscountCode) {
    this.currentCouponForGift.set(coupon);
    this.isGiftModalOpen.set(true);
  }

  onGiftModalClose() {
    this.isGiftModalOpen.set(false);
    this.currentCouponForGift.set(null);
  }

  async deleteCoupon(id: string) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await this.discountsService.deleteDiscountCode(id);
      this.toast.success('Coupon deleted');
      this.loadCoupons();
    } catch (error) {
      this.toast.error('Error deleting coupon');
    }
  }
}
