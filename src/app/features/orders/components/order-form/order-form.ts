import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    output,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Order, OrderItem } from '@core/models/order';
import { Product, ProductVariant } from '@core/models/product';
import { Customer } from '@core/models/customer';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrdersService } from '@core/services/orders';
import { ProductsService } from '@core/services/products';
import { CustomersService } from '@core/services/customers';
import { ToastService } from '@core/services/toast';
import { OrderStatus, PaymentStatus } from '@core/enums';
import { Dropdown } from '@shared/components/dropdown/dropdown';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-order-form',
    imports: [CommonModule, ReactiveFormsModule, Dropdown],
    templateUrl: './order-form.html',
    styleUrl: './order-form.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly ordersService = inject(OrdersService);
    private readonly productsService = inject(ProductsService);
    private readonly customersService = inject(CustomersService);
    private readonly toast = inject(ToastService);
    private readonly currencyPipe = inject(CurrencyPipe);

    saved = output<Order>();
    cancelled = output<void>();

    readonly isSaving = signal(false);
    readonly isNewCustomer = signal(false);
    readonly customers = signal<Customer[]>([]);
    readonly products = signal<Product[]>([]);
    readonly selectedCustomer = signal<Customer | null>(null);
    readonly itemProductData = signal<Product[]>([]); // To store variants for each row

    readonly customerOptions = computed(() =>
        this.customers().map(c => ({
            label: `${c.first_name} ${c.last_name || ''} (${c.email})`,
            value: c.id
        }))
    );

    readonly productOptions = computed(() =>
        this.products().map(p => ({
            label: `${p.name} - ${this.currencyPipe.transform(p.price)}`,
            value: p.id
        }))
    );

    readonly statusOptions = [
        { value: OrderStatus.Pending, label: 'Pending' },
        { value: OrderStatus.Processing, label: 'Processing' },
        { value: OrderStatus.Paid, label: 'Paid' },
        { value: OrderStatus.Shipped, label: 'Shipped' },
        { value: OrderStatus.Delivered, label: 'Delivered' },
    ];

    readonly paymentStatusOptions = [
        { value: PaymentStatus.Pending, label: 'Pending' },
        { value: PaymentStatus.Completed, label: 'Completed' },
        { value: PaymentStatus.Failed, label: 'Failed' },
    ];

    readonly form = this.fb.group({
        customer_id: [''],
        status: [OrderStatus.Pending, Validators.required],
        payment_status: [PaymentStatus.Pending, Validators.required],
        internal_note: [''],
        shipping_amount: [0],
        tax_amount: [0],
        discount_amount: [0],
        items: this.fb.array([], Validators.required),
        // New Customer Fields
        new_customer: this.fb.group({
            first_name: [''],
            last_name: [''],
            email: ['', Validators.email],
            phone: [''],
        })
    });

    private readonly formValue = toSignal(this.form.valueChanges);

    get items() {
        return this.form.get('items') as FormArray;
    }

    readonly totals = computed(() => {
        this.formValue(); // Track changes
        const items = this.items.getRawValue();
        const subtotal = items.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0);
        const shipping = this.form.get('shipping_amount')?.value || 0;
        const tax = this.form.get('tax_amount')?.value || 0;
        const discount = this.form.get('discount_amount')?.value || 0;

        return {
            subtotal,
            total: subtotal + shipping + tax - discount
        };
    });

    ngOnInit() {
        this.loadInitialData();
    }

    async loadInitialData() {
        try {
            const [custRes, prodRes] = await Promise.all([
                this.customersService.getCustomers(1, 100),
                this.productsService.getProducts(1, 100, { status: 'active' })
            ]);
            this.customers.set(custRes.data);
            this.products.set(prodRes.data);
        } catch (error) {
            console.error('Error loading form data:', error);
        }
    }

    toggleNewCustomer() {
        const newValue = !this.isNewCustomer();
        this.isNewCustomer.set(newValue);

        if (newValue) {
            this.form.get('customer_id')?.clearValidators();
            this.form.get('new_customer.first_name')?.setValidators(Validators.required);
            this.form.get('new_customer.email')?.setValidators([Validators.required, Validators.email]);
            this.selectedCustomer.set(null);
        } else {
            this.form.get('customer_id')?.setValidators(Validators.required);
            this.form.get('new_customer.first_name')?.clearValidators();
            this.form.get('new_customer.email')?.clearValidators();
        }

        this.form.get('customer_id')?.updateValueAndValidity();
        this.form.get('new_customer.first_name')?.updateValueAndValidity();
        this.form.get('new_customer.email')?.updateValueAndValidity();
    }

    getProductForIndex(index: number): Product | undefined {
        return this.itemProductData()[index];
    }

    getVariantOptions(index: number) {
        const product = this.getProductForIndex(index);
        if (!product?.variants) return [];
        return product.variants.map(v => ({
            label: `${v.name}${v.price && v.price !== product.price ? ' (' + (this.currencyPipe.transform(v.price) || '') + ')' : ''}`,
            value: v.id
        }));
    }

    onVariantChange(index: number, variantId: string) {
        const product = this.getProductForIndex(index);
        const variant = product?.variants?.find(v => v.id === variantId);
        if (variant) {
            const item = this.items.at(index);
            item.patchValue({
                variant_id: variant.id,
                variant_name: variant.name,
                product_sku: variant.sku || product?.sku,
                unit_price: variant.price ?? product?.price,
            });
        }
    }

    onCustomerChange(customerId: string) {
        const customer = this.customers().find(c => c.id === customerId);
        if (customer) {
            this.selectedCustomer.set(customer);
            this.form.patchValue({ customer_id: customerId });
        }
    }

    async onProductChange(productId: string) {
        if (!productId) return;

        try {
            // Check if we already have it to avoid redundant fetch
            let product = this.products().find(p => p.id === productId);

            // Fetch full details if variants are missing OR if they don't have details (like 'name')
            // The initial products list only fetches variants with stock_quantity for optimization
            const needsFullFetch = !product?.variants || (product.variants.length > 0 && !product.variants[0].name);

            if (needsFullFetch) {
                product = await this.productsService.getProduct(productId) as Product;
            }

            if (product) {
                if (product.variants && product.variants.length > 0) {
                    this.addItem(product, product.variants[0]);
                } else {
                    this.addItem(product);
                }
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
            this.toast.error('Could not fetch product details.');
        }
    }

    addItem(product: Product, variant?: ProductVariant) {
        const itemForm = this.fb.group({
            product_id: [product.id, Validators.required],
            variant_id: [variant?.id || null],
            product_name: [product.name, Validators.required],
            variant_name: [variant ? variant.name : null],
            product_sku: [variant?.sku || product.sku],
            quantity: [1, [Validators.required, Validators.min(1)]],
            unit_price: [variant?.price ?? product.price, [Validators.required, Validators.min(0)]],
            total_amount: [variant?.price ?? product.price],
        });

        // Store metadata for this row
        const currentData = this.itemProductData();
        this.itemProductData.set([...currentData, product]);

        // Update total_amount when quantity or unit_price changes
        itemForm.valueChanges.subscribe(() => {
            const qty = itemForm.get('quantity')?.value || 0;
            const price = itemForm.get('unit_price')?.value || 0;
            itemForm.get('total_amount')?.setValue(qty * price, { emitEvent: false });
        });

        this.items.push(itemForm);
    }

    removeItem(index: number) {
        this.items.removeAt(index);
        const currentData = this.itemProductData();
        const newData = [...currentData];
        newData.splice(index, 1);
        this.itemProductData.set(newData);
    }

    async submit() {
        if (this.form.invalid || this.items.length === 0) {
            this.form.markAllAsTouched();
            this.toast.error('Please complete the form and add at least one item.');
            return;
        }

        this.isSaving.set(true);
        try {
            const raw = this.form.getRawValue();
            let customer = this.selectedCustomer();

            // Create customer if needed
            if (this.isNewCustomer()) {
                const newCustomerData = raw.new_customer;
                try {
                    customer = await this.customersService.createCustomer({
                        first_name: newCustomerData.first_name!,
                        last_name: newCustomerData.last_name || undefined,
                        email: newCustomerData.email!,
                        phone: newCustomerData.phone || undefined,
                    });
                } catch (err: any) {
                    // Handle duplicate email (unique_violation)
                    if (err.code === '23505' && err.message?.includes('customers_tenant_id_email_key')) {
                        const existing = await this.customersService.getCustomers(1, 1, { search: newCustomerData.email });
                        if (existing.data.length > 0) {
                            customer = existing.data[0];
                        } else {
                            throw err;
                        }
                    } else {
                        throw err;
                    }
                }
                this.selectedCustomer.set(customer);
                this.form.patchValue({ customer_id: customer.id });
            }

            if (!customer) throw new Error('Customer data not found');

            const orderData: Partial<Order> = {
                customer_id: customer.id,
                status: raw.status as OrderStatus,
                payment_status: raw.payment_status as PaymentStatus,
                subtotal: this.totals().subtotal,
                total_amount: this.totals().total,
                shipping_amount: raw.shipping_amount || 0,
                tax_amount: raw.tax_amount || 0,
                discount_amount: raw.discount_amount || 0,
                internal_note: raw.internal_note || undefined,
                currency: 'USD',
                customer_email: customer.email,
                customer_first_name: customer.first_name,
                customer_last_name: customer.last_name,
                customer_phone: customer.phone,
            };

            const itemsData: Partial<OrderItem>[] = raw.items.map((item: any) => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                product_name: item.product_name,
                variant_name: item.variant_name,
                product_sku: item.product_sku,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_amount: item.total_amount,
                discount_amount: 0,
                tax_amount: 0,
            }));

            const result = await this.ordersService.createOrder(orderData, itemsData);
            this.toast.success(`Order #${result.order_number} created successfully.`);
            this.saved.emit(result);
        } catch (error: any) {
            console.error('Error creating order:', error);
            this.toast.error(error?.message ?? 'Error creating order.');
        } finally {
            this.isSaving.set(false);
        }
    }

    cancel() {
        this.cancelled.emit();
    }
}
