import { inject, Injectable } from '@angular/core';
import { TenantService } from './tenant';
import { InventoryMovement, InventoryMovementType } from '@models/inventory';
import { AuditLog } from '@models/index';
import { Supabase } from './supabase';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private readonly supabase = inject(Supabase);
    private readonly tenantService = inject(TenantService);

    async getMovements(page: number = 1, pageSize: number = 20): Promise<{ data: InventoryMovement[], count: number }> {
        const tenantId = this.tenantService.tenantId();
        if (!tenantId) throw new Error('Tenant not selected');

        // We fetch from audit_logs where resource_type is products or orders
        // Actually, manual adjustments are 'products' resource updates
        // Sales are 'orders' (but it's better to track order_items or similar)
        // For now, let's look for resource_type = 'products' (manual) and 'orders' (sales)

        const { data, error, count } = await this.supabase.client
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .in('resource_type', ['products', 'orders'])
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) throw error;

        const movements: InventoryMovement[] = (data || []).map((log: any) => this.mapAuditToMovement(log as AuditLog))
            .filter((m: InventoryMovement | null): m is InventoryMovement => m !== null);

        return {
            data: movements,
            count: count ?? 0
        };
    }

    private mapAuditToMovement(log: AuditLog): InventoryMovement | null {
        const oldVal = log.old_values as any;
        const newVal = log.new_values as any;

        if (!newVal) return null;

        let type: InventoryMovementType = 'other';
        let qtyChange = 0;
        let newQty = 0;
        let productName = '';
        let variantName = '';
        let referenceId = log.resource_id;

        if (log.resource_type === 'products') {
            // Manual adjustment or creation
            if (log.action === 'create') {
                type = 'manual';
                qtyChange = newVal.stock_quantity || 0;
                newQty = qtyChange;
            } else if (log.action === 'update') {
                const oldStock = oldVal?.stock_quantity ?? 0;
                const newStock = newVal?.stock_quantity ?? 0;
                if (oldStock === newStock) return null; // No stock change

                type = 'adjustment';
                qtyChange = newStock - oldStock;
                newQty = newStock;
            }
            productName = newVal.name || oldVal?.name || 'Producto Desconocido';
        } else if (log.resource_type === 'orders') {
            // Sales (on update to paid or on creation?)
            // In this schema, stock_quantity is updated via trigger when order_items are inserted.
            // But the audit_log trigger on products will fire when the stock_quantity column changes.
            // So we might already have 'adjustment' logs for sales.
            // Let's check if the description says something.

            if (log.description?.includes('order') || log.description?.includes('sale')) {
                type = 'sale';
            } else {
                // If it's an update to a product's stock_quantity triggered by a sale, 
                // RLS or session user might be different.
                return null; // For now, let's avoid duplicates if products trigger fires.
            }
        }

        // If it's a product update that changed stock, we want it.
        // If it's a manual update, we show it.

        return {
            id: log.id,
            created_at: log.created_at,
            tenant_id: log.tenant_id!,
            product_id: log.resource_id!,
            product_name: productName,
            type: type,
            quantity_change: qtyChange,
            new_quantity: newQty,
            user_email: log.user_email,
            reference_id: referenceId,
            description: log.description
        };
    }
}
