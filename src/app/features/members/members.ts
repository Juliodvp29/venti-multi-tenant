import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '@core/services/tenant';
import { SubscriptionService } from '@core/services/subscription';
import { ToastService } from '@core/services/toast';
import { AuditLog, TenantMember, TenantInvitation } from '@core/models';
import { AuditAction, TenantRole } from '@core/enums';
import { AuditLogsService } from '@core/services/audit-logs';
import { MembersStatsComponent } from './components/members-stats';
import { MembersListComponent } from './components/members-list';
import { InviteMemberModalComponent } from './components/invite-member-modal';
import { EditMemberRoleModalComponent } from './components/edit-member-role-modal';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-members',
  imports: [
    CommonModule,
    MembersStatsComponent,
    MembersListComponent,
    InviteMemberModalComponent,
    EditMemberRoleModalComponent,
  ],
  templateUrl: './members.html',
  styleUrl: './members.css',
})
export class Members {
  private readonly tenantService = inject(TenantService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toast = inject(ToastService);
  private readonly auditLogsService = inject(AuditLogsService);

  private initialized = false;

  constructor() {
    effect(() => {
      const tenantId = this.tenantService.tenantId();
      if (tenantId && !this.initialized) {
        this.initialized = true;
        this.loadMembers();
      }
    });
  }

  members = signal<TenantMember[]>([]);
  showInviteModal = signal(false);
  selectedMember = signal<TenantMember | null>(null);
  showEditModal = signal(false);
  isLoading = signal(false);
  auditLogs = signal<AuditLog[]>([]);
  isAuditLoading = signal(false);

  totalMembers = computed(() => this.members().filter((m) => !m['is_invite']).length);
  adminCount = computed(
    () =>
      this.members().filter(
        (m) => !m['is_invite'] && (m.role === TenantRole.Admin || m.role === TenantRole.Owner),
      ).length,
  );
  pendingInvites = signal(0);

  async openInviteModal() {
    const canAdd = await this.subscriptionService.canAddResource('members');
    if (!canAdd) {
      this.toast.error(
        'Has alcanzado el límite de miembros para tu plan. Por favor, actualiza tu plan para invitar a más personas.',
      );
      return;
    }
    this.showInviteModal.set(true);
  }

  async loadMembers() {
    this.isLoading.set(true);
    try {
      const [membersResult, invitesResult] = await Promise.allSettled([
        this.tenantService.getMembers(),
        this.tenantService.getInvitations(),
        this.loadRecentActivity(),
      ]);

      const membersData: TenantMember[] =
        membersResult.status === 'fulfilled'
          ? membersResult.value
          : this.members().filter((m) => !m['is_invite']);

      const invitesData: TenantInvitation[] =
        invitesResult.status === 'fulfilled' ? invitesResult.value : [];

      // Una invitación cuyo correo ya es miembro (aceptada pero con la fila
      // en pendiente, o invitada por error) generaba un duplicado activo/inactivo.
      const memberEmails = new Set(membersData.map((m) => (m.email ?? '').toLowerCase()));
      const visibleInvites = invitesData.filter(
        (invite) => !memberEmails.has((invite.email ?? '').toLowerCase()),
      );

      const formattedInvites: TenantMember[] = visibleInvites.map(
        (invite) =>
          ({
            id: invite.id,
            tenant_id: invite.tenant_id,
            user_id: `invite_${invite.id}`,
            email: invite.email,
            role: invite.role,
            permissions: [],
            is_active: false,
            is_invite: true,
            invited_by: invite.invited_by,
            invited_at: invite.created_at,
            created_at: invite.created_at,
            updated_at: invite.created_at,
          }) as any,
      );

      this.members.set([...membersData, ...formattedInvites]);
      this.pendingInvites.set(visibleInvites.length);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadRecentActivity(): Promise<void> {
    this.isAuditLoading.set(true);
    try {
      this.auditLogs.set(await this.auditLogsService.getRecent());
    } catch (error) {
      console.error('Error loading recent team activity:', error);
      this.auditLogs.set([]);
    } finally {
      this.isAuditLoading.set(false);
    }
  }

  getAuditActionLabel(action: AuditAction | string): string {
    const labels: Partial<Record<AuditAction, string>> = {
      [AuditAction.Create]: 'creó',
      [AuditAction.Update]: 'actualizó',
      [AuditAction.Delete]: 'eliminó',
      [AuditAction.Login]: 'inició sesión',
      [AuditAction.Logout]: 'cerró sesión',
      [AuditAction.Payment]: 'registró un pago',
      [AuditAction.Refund]: 'procesó un reembolso',
      [AuditAction.StatusChange]: 'cambió el estado de',
    };
    return labels[action as AuditAction] ?? action.replace(/_/g, ' ');
  }

  getAuditResourceLabel(resourceType: string): string {
    const labels: Record<string, string> = {
      products: 'producto',
      product_variants: 'variante',
      orders: 'orden',
      customers: 'cliente',
      members: 'miembro',
      coupons: 'cupón',
      commissions: 'comisión',
      payments: 'pago',
    };
    return labels[resourceType] ?? resourceType.replace(/_/g, ' ');
  }

  getAuditMessage(log: AuditLog): string {
    const resource = this.getAuditResourceLabel(log.resource_type);
    const identifier = this.getAuditIdentifier(log);
    const action = this.getAuditActionLabel(log.action);
    return `${action} ${resource}${identifier ? ` ${identifier}` : ''}`;
  }

  getAuditDetail(log: AuditLog): string {
    if (log.action === AuditAction.Update && log.old_values && log.new_values) {
      const changes = this.getAuditChanges(log.old_values, log.new_values);
      if (changes) return changes;
    }

    if (log.description && !/^\s*(INSERT|UPDATE|DELETE)\b/i.test(log.description)) {
      return log.description;
    }

    return this.getAuditOperationLabel(log);
  }

  private getAuditIdentifier(log: AuditLog): string {
    const values = (log.new_values ?? log.old_values) as Record<string, unknown> | undefined;
    if (!values) return log.resource_id ? `#${log.resource_id.slice(0, 8)}` : '';

    const identifier = [
      ['order_number', values['order_number']],
      ['name', values['name']],
      ['product_name', values['product_name']],
      ['email', values['email']],
      ['sku', values['sku']],
      ['code', values['code']],
    ].find(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');

    if (!identifier) return log.resource_id ? `#${log.resource_id.slice(0, 8)}` : '';
    const value = String(identifier[1]);
    return log.resource_type === 'orders' || identifier[0] === 'sku' || identifier[0] === 'code'
      ? `#${value.replace(/^#/, '')}`
      : `“${value}”`;
  }

  private getAuditChanges(
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
  ): string {
    const labels: Record<string, string> = {
      name: 'nombre',
      status: 'estado',
      payment_status: 'estado de pago',
      price: 'precio',
      compare_at_price: 'precio anterior',
      cost_price: 'costo',
      stock_quantity: 'inventario',
      quantity: 'cantidad',
      subtotal: 'subtotal',
      total_amount: 'total',
      total: 'total',
      tax_amount: 'impuestos',
      shipping_amount: 'envío',
      discount_amount: 'descuento',
      currency: 'moneda',
      email: 'correo',
      customer_email: 'correo del cliente',
      order_number: 'número de orden',
      order_id: 'orden relacionada',
      product_id: 'producto relacionado',
      variant_id: 'variante relacionada',
      role: 'rol',
      is_active: 'estado activo',
      is_verified: 'verificación',
    };
    const ignored = new Set(['updated_at', 'created_at']);
    const changed = Object.keys(newValues)
      .filter(
        (key) =>
          !ignored.has(key) && JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key]),
      )
      .slice(0, 3)
      .map(
        (key) =>
          `${labels[key] ?? this.humanizeAuditKey(key)}: ${this.formatAuditValue(newValues[key], key)}`,
      );

    return changed.length ? `Cambios: ${changed.join(' · ')}` : '';
  }

  private formatAuditValue(value: unknown, key?: string): string {
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (value === null || value === undefined || value === '') return 'vacío';
    if (key === 'status') {
      return (
        {
          pending: 'Pendiente',
          processing: 'En proceso',
          paid: 'Pagado',
          shipped: 'Enviado',
          delivered: 'Entregado',
          cancelled: 'Cancelado',
          refunded: 'Reembolsado',
        }[String(value)] ?? String(value)
      );
    }
    if (key === 'payment_status') {
      return (
        {
          pending: 'Pendiente',
          completed: 'Pagado',
          failed: 'Fallido',
          refunded: 'Reembolsado',
          partially_refunded: 'Reembolso parcial',
        }[String(value)] ?? String(value)
      );
    }
    if (key === 'role') {
      return (
        {
          owner: 'Propietario',
          admin: 'Administrador',
          editor: 'Editor',
          viewer: 'Visualizador',
          delivery: 'Despacho',
        }[String(value)] ?? String(value)
      );
    }
    return String(value);
  }

  private getAuditOperationLabel(log: AuditLog): string {
    const source = log as AuditLog & { source?: string };
    const sourceLabels: Record<string, string> = {
      checkout_sale: 'venta desde el checkout',
      admin_panel: 'panel administrativo',
      customer_portal: 'portal del cliente',
    };
    return source.source
      ? (sourceLabels[source.source] ?? this.humanizeAuditKey(source.source))
      : `Registro de ${this.getAuditResourceLabel(log.resource_type)}`;
  }

  private humanizeAuditKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }

  getAuditActor(log: AuditLog): string {
    return log.user_email || 'Sistema';
  }

  getAuditTime(createdAt: string): string {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  }

  async onInviteSubmit(event: { email: string; role: TenantRole }) {
    const email = (event.email ?? '').trim();
    try {
      await this.tenantService.inviteMember(email, event.role);
      this.toast.success('Invitación enviada con éxito');
      this.showInviteModal.set(false);
      await this.loadMembers();
    } catch (error: any) {
      this.toast.error(error.message || 'Error al enviar la invitación');
    }
  }

  async onMemberRemove(member: TenantMember) {
    const isInvite = !!member['is_invite'];
    const confirmed = await this.toast.confirm(
      isInvite
        ? `¿Quieres cancelar la invitación pendiente para ${member.email}?`
        : '¿Estás seguro de que quieres eliminar a este miembro?',
      isInvite ? 'Cancelar invitación' : 'Eliminar miembro',
    );
    if (confirmed) {
      try {
        if (isInvite) {
          await this.tenantService.cancelInvitation(member.id);
          this.toast.success('Invitación cancelada');
        } else {
          await this.tenantService.removeMember(member.id);
          this.toast.success('Miembro eliminado');
        }
        await this.loadMembers();
      } catch (error) {
        this.toast.error(
          isInvite ? 'Error al cancelar la invitación' : 'Error al eliminar el miembro',
        );
      }
    }
  }

  openEditModal(member: TenantMember) {
    this.selectedMember.set(member);
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedMember.set(null);
  }

  async onEditRoleSave(event: { member: TenantMember; role: TenantRole }) {
    const { member, role } = event;
    if (!role || !Object.values(TenantRole).includes(role)) {
      this.toast.error('Rol inválido. Los roles disponibles son: viewer, editor, admin');
      return;
    }
    const isInvite = !!member['is_invite'];
    try {
      if (isInvite) {
        await this.tenantService.updateInvitationRole(member.id, role);
        this.toast.success('Rol de la invitación actualizado');
      } else {
        await this.tenantService.updateMemberRole(member.id, role);
        this.toast.success('Rol actualizado');
      }
      this.closeEditModal();
      await this.loadMembers();
    } catch (error) {
      this.toast.error('Error al actualizar el rol');
    }
  }
}
