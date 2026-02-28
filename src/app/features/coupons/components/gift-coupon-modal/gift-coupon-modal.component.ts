import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '@core/services/customers';
import { EmailService } from '@core/services/email';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';
import { DiscountCode } from '@core/models/discount.model';
import { Customer } from '@core/models/customer';

@Component({
    selector: 'app-gift-coupon-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gift-coupon-modal.component.html',
})
export class GiftCouponModalComponent {
    private readonly customersService = inject(CustomersService);
    private readonly emailService = inject(EmailService);
    private readonly toast = inject(ToastService);
    private readonly tenantService = inject(TenantService);

    // Inputs
    isOpen = input.required<boolean>();
    coupon = input.required<DiscountCode | null>();

    // Outputs
    close = output<void>();

    // State
    searchQuery = signal('');
    customers = signal<Customer[]>([]);
    isLoading = signal(false);
    selectedCustomerId = signal<string | null>(null);
    isSending = signal(false);

    async onSearch() {
        const query = this.searchQuery().trim();
        if (query.length < 2) {
            this.customers.set([]);
            return;
        }

        try {
            this.isLoading.set(true);
            const { data } = await this.customersService.getCustomers(1, 10, { search: query });
            this.customers.set(data || []);
        } catch (error) {
            console.error('Error searching customers:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    selectCustomer(customer: Customer) {
        this.selectedCustomerId.set(customer.id);
    }

    async sendGift() {
        const coupon = this.coupon();
        const customerId = this.selectedCustomerId();
        const customer = this.customers().find(c => c.id === customerId);

        if (!coupon || !customer) return;

        try {
            this.isSending.set(true);

            // 1. Get Template
            const template = await this.emailService.getTemplate('gift_coupon');
            if (!template) {
                throw new Error('Email template "gift_coupon" not found');
            }

            // 2. Prepare variables
            const variables = {
                customer_name: `${customer.first_name} ${customer.last_name}`.trim() || 'Friend',
                store_name: 'Our Store', // This could come from tenant settings if available
                coupon_code: coupon.code,
                coupon_description: coupon.type === 'percentage' ? `${coupon.value}% off` : `$${coupon.value} off`,
                shop_url: window.location.origin
            };

            // 3. Process placeholders
            const subject = this.emailService.replacePlaceholders(template.subject, variables);
            const bodyHtml = this.emailService.replacePlaceholders(template.body_html, variables);
            const bodyText = template.body_text ? this.emailService.replacePlaceholders(template.body_text, variables) : undefined;

            // 4. Send
            const result = await this.emailService.sendEmail({
                to: customer.email,
                subject,
                bodyHtml,
                bodyText,
                templateKey: 'gift_coupon',
                customerId: customer.id
            });

            if (result.success) {
                this.toast.success(`Coupon sent to ${customer.email}`);
                this.close.emit();
                // Reset state
                this.selectedCustomerId.set(null);
                this.searchQuery.set('');
                this.customers.set([]);
            } else {
                this.toast.error('Error sending email');
            }

        } catch (error: any) {
            console.error('Error sending gift coupon:', error);
            this.toast.error(error?.message || 'Error processing the shipment');
        } finally {
            this.isSending.set(false);
        }
    }
}
