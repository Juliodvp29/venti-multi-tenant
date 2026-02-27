import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, effect } from '@angular/core';
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
export class Members implements OnInit {
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

  // State
  members = signal<TenantMember[]>([]);
  showInviteModal = signal(false);
  isLoading = signal(false);

  // Computed Stats — only count real active members, not pending invites
  totalMembers = computed(() => this.members().filter(m => !m['is_invite']).length);
  adminCount = computed(() => this.members().filter(m => !m['is_invite'] && (m.role === TenantRole.Admin || m.role === TenantRole.Owner)).length);
  pendingInvites = signal(0);

  ngOnInit() {
    // Data loading is handled by the constructor effect once tenant is ready
  }

  async openInviteModal() {
    const canAdd = await this.subscriptionService.canAddResource('members');
    if (!canAdd) {
      this.toast.error('Has alcanzado el límite de miembros de tu plan. Por favor, mejora tu plan para invitar a más personas.');
      return;
    }
    this.showInviteModal.set(true);
  }

  async loadMembers() {
    this.isLoading.set(true);
    try {
      // Fetch both independently so a failure in one doesn't blank the other
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
      // Don't show toast here — avoids confusing error message after a successful invite
    } finally {
      this.isLoading.set(false);
    }
  }

  async onInviteSubmit(event: { email: string; role: TenantRole }) {
    const email = (event.email ?? '').trim();
    try {
      await this.tenantService.inviteMember(email, event.role);
      this.toast.success('Invitación enviada exitosamente');
      this.showInviteModal.set(false);
      await this.loadMembers();
    } catch (error: any) {
      this.toast.error(error.message || 'No se pudo enviar la invitación');
    }
  }

  async onMemberRemove(member: TenantMember) {
    if (confirm(`Are you sure you want to remove this member?`)) {
      try {
        await this.tenantService.removeMember(member.id);
        this.toast.success('Member removed');
        await this.loadMembers();
      } catch (error) {
        this.toast.error('Failed to remove member');
      }
    }
  }

  async onMemberRoleUpdate(member: TenantMember) {
    // Logic for editing role could open another modal or a simple prompt for now
    const newRole = prompt('Enter new role (viewer, editor, admin):', member.role) as TenantRole;
    if (newRole && Object.values(TenantRole).includes(newRole)) {
      try {
        await this.tenantService.updateMemberRole(member.id, newRole);
        this.toast.success('Role updated');
        await this.loadMembers();
      } catch (error) {
        this.toast.error('Failed to update role');
      }
    }
  }
}
