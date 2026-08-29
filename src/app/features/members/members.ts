import { Component, inject, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '@core/services/tenant';
import { SubscriptionService } from '@core/services/subscription';
import { ToastService } from '@core/services/toast';
import { TenantMember, TenantInvitation } from '@core/models';
import { TenantRole } from '@core/enums';
import { MembersStatsComponent } from './components/members-stats';
import { MembersListComponent } from './components/members-list';
import { InviteMemberModalComponent } from './components/invite-member-modal';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-members',
  imports: [
    CommonModule,
    MembersStatsComponent,
    MembersListComponent,
    InviteMemberModalComponent
  ],
  templateUrl: './members.html',
  styleUrl: './members.css',
})
export class Members {
  private readonly tenantService = inject(TenantService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toast = inject(ToastService);

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
  isLoading = signal(false);

  totalMembers = computed(() => this.members().filter(m => !m['is_invite']).length);
  adminCount = computed(() => this.members().filter(m => !m['is_invite'] && (m.role === TenantRole.Admin || m.role === TenantRole.Owner)).length);
  pendingInvites = signal(0);

  async openInviteModal() {
    const canAdd = await this.subscriptionService.canAddResource('members');
    if (!canAdd) {
      this.toast.error('Has alcanzado el límite de miembros para tu plan. Por favor, actualiza tu plan para invitar a más personas.');
      return;
    }
    this.showInviteModal.set(true);
  }

  async loadMembers() {
    this.isLoading.set(true);
    try {
      const [membersResult, invitesResult] = await Promise.allSettled([
        this.tenantService.getMembers(),
        this.tenantService.getInvitations()
      ]);

      const membersData: TenantMember[] =
        membersResult.status === 'fulfilled' ? membersResult.value : this.members().filter(m => !m['is_invite']);

      const invitesData: TenantInvitation[] =
        invitesResult.status === 'fulfilled' ? invitesResult.value : [];

      const formattedInvites: TenantMember[] = invitesData.map(invite => ({
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
        updated_at: invite.created_at
      } as any));

      this.members.set([...membersData, ...formattedInvites]);
      this.pendingInvites.set(invitesData.length);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      this.isLoading.set(false);
    }
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
    const confirmed = await this.toast.confirm(
      '¿Estás seguro de que quieres eliminar a este miembro?',
      'Eliminar miembro'
    );
    if (confirmed) {
      try {
        await this.tenantService.removeMember(member.id);
        this.toast.success('Miembro eliminado');
        await this.loadMembers();
      } catch (error) {
        this.toast.error('Error al eliminar el miembro');
      }
    }
  }

  async onMemberRoleUpdate(member: TenantMember) {
    // El cambio de rol se gestiona desde la UI del componente MembersListComponent.
    // Si se llama directamente, se valida el rol recibido.
    if (member.role && Object.values(TenantRole).includes(member.role as TenantRole)) {
      try {
        await this.tenantService.updateMemberRole(member.id, member.role as TenantRole);
        this.toast.success('Rol actualizado');
        await this.loadMembers();
      } catch (error) {
        this.toast.error('Error al actualizar el rol');
      }
    } else {
      this.toast.error('Rol inválido. Los roles disponibles son: viewer, editor, admin');
    }
  }
}
