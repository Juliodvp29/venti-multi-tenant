import { ChangeDetectionStrategy, Component, effect, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { SubscriptionPlan } from '@core/enums';
import { CommissionRule } from '@core/models/commission';
import { CommissionsService } from '@core/services/commissions';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';

@Component({
    selector: 'app-settings-commissions',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './settings-commissions.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCommissions implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly commissionsService = inject(CommissionsService);
    private readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);

    readonly isLoading = signal(true);
    readonly isSaving = signal(false);
    readonly commissionRules = signal<CommissionRule[]>([]);
    readonly canEdit = this.tenantService.canEdit;

    readonly plans: { value: SubscriptionPlan; label: string }[] = [
        { value: SubscriptionPlan.Free, label: 'Free' },
        { value: SubscriptionPlan.Basic, label: 'Basic' },
        { value: SubscriptionPlan.Professional, label: 'Professional' },
        { value: SubscriptionPlan.Enterprise, label: 'Enterprise' },
    ];

    readonly activeModal = signal<'create' | 'edit' | null>(null);
    readonly editingRule = signal<CommissionRule | null>(null);

    readonly ruleForm = this.fb.nonNullable.group({
        plan: [SubscriptionPlan.Professional as SubscriptionPlan, Validators.required],
        commission_rate: [0, [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
        effective_from: ['', Validators.required],
        effective_until: [''],
        is_active: [true],
    });

    async ngOnInit() {
        await this.loadRules();
    }

    constructor() {
        effect(() => {
            if (this.tenantService.tenantId()) {
                this.loadRules();
            }
        });
    }

    async loadRules() {
        this.isLoading.set(true);
        try {
            const rules = await this.commissionsService.getCommissionRules();
            this.commissionRules.set(rules);
        } catch (error) {
            console.error('Error loading commission rules:', error);
            this.toastService.error('Error al cargar las reglas de comisión');
        } finally {
            this.isLoading.set(false);
        }
    }

    getCurrentRuleForPlan(plan: SubscriptionPlan): CommissionRule | undefined {
        return this.commissionRules().find(r => r.plan === plan);
    }

    openCreateModal() {
        this.editingRule.set(null);
        this.ruleForm.reset({
            plan: SubscriptionPlan.Professional,
            commission_rate: 0,
            effective_from: new Date().toISOString().split('T')[0],
            effective_until: '',
            is_active: true,
        });
        this.activeModal.set('create');
    }

    openEditModal(rule: CommissionRule) {
        this.editingRule.set(rule);
        this.ruleForm.patchValue({
            plan: rule.plan,
            commission_rate: rule.commission_rate,
            effective_from: rule.effective_from.split('T')[0],
            effective_until: rule.effective_until ? rule.effective_until.split('T')[0] : '',
            is_active: rule.is_active,
        });
        this.ruleForm.get('plan')?.disable();
        this.activeModal.set('edit');
    }

    closeModal() {
        this.activeModal.set(null);
        this.editingRule.set(null);
        this.ruleForm.get('plan')?.enable();
    }

    async saveRule() {
        if (this.ruleForm.invalid) {
            this.ruleForm.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);
        try {
            const val = this.ruleForm.getRawValue();
            const payload: Partial<CommissionRule> = {
                plan: val.plan,
                commission_rate: val.commission_rate,
                effective_from: new Date(val.effective_from + 'T00:00:00').toISOString(),
                effective_until: val.effective_until ? new Date(val.effective_until + 'T23:59:59').toISOString() : null,
                is_active: val.is_active,
            };

            await this.commissionsService.upsertCommissionRule(payload);
            this.toastService.success('Regla de comisión guardada exitosamente');
            await this.loadRules();
            this.closeModal();
        } catch (error) {
            console.error('Error saving commission rule:', error);
            this.toastService.error('Error al guardar la regla de comisión');
        } finally {
            this.isSaving.set(false);
        }
    }

    async deleteRule(rule: CommissionRule) {
        if (!confirm(`¿Eliminar la regla de comisión para el plan ${rule.plan}?`)) return;

        try {
            await this.commissionsService.deleteCommissionRule(rule.id);
            this.toastService.success('Regla eliminada');
            await this.loadRules();
        } catch (error) {
            console.error('Error deleting commission rule:', error);
            this.toastService.error('Error al eliminar la regla');
        }
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('es-ES');
    }

    getPlanLabel(plan: SubscriptionPlan): string {
        return this.plans.find(p => p.value === plan)?.label || plan;
    }
}