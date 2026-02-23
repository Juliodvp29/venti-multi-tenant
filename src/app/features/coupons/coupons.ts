import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { DiscountsService } from '@core/services/discounts';
import { DiscountCode } from '@core/models/discount.model';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { ColumnDef, TableAction } from '@core/types/table';
import { ToastService } from '@core/services/toast';
import { CouponModalComponent } from './components/coupon-modal/coupon-modal.component';

@Component({
   changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-coupons',
  imports: [CommonModule, DynamicTable, CouponModalComponent, DecimalPipe, CurrencyPipe],
  templateUrl: './coupons.html',
  styleUrl: './coupons.css',
})
export class Coupons implements OnInit {
  private readonly discountsService = inject(DiscountsService);
  private readonly toast = inject(ToastService);

  coupons = signal<DiscountCode[]>([]);
  isLoading = signal(false);

  isModalOpen = signal(false);
  selectedCoupon = signal<DiscountCode | null>(null);

  // Stats
  activeCount = signal(24); // Placeholder for now or calculate from data
  totalRedemptions = signal(1402);
  totalDiscounted = signal(12450);

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
      formatter: (val, item) => `${val} / ${item.usage_limit || '∞'}`
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
    { id: 'edit', label: 'Edit', icon: 'edit', callback: (item) => this.openCouponModal(item) },
    { id: 'delete', label: 'Delete', icon: 'delete', className: 'text-red-600', callback: (item) => this.deleteCoupon(item.id) }
  ];

  ngOnInit() {
    this.loadCoupons();
  }

  async loadCoupons() {
    this.isLoading.set(true);
    try {
      const { data } = await this.discountsService.getDiscountCodes();
      this.coupons.set(data);
      // Update stats based on loaded data
      this.activeCount.set(data.filter(c => c.is_active).length);
      // Other stats would ideally come from a separate aggregate query or be calculated
    } catch (error) {
      this.toast.error('Error al cargar cupones');
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

  async deleteCoupon(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este cupón?')) return;

    try {
      await this.discountsService.deleteDiscountCode(id);
      this.toast.success('Cupón eliminado');
      this.loadCoupons();
    } catch (error) {
      this.toast.error('Error al eliminar cupón');
    }
  }
}
