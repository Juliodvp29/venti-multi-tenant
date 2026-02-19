import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { TenantMember } from '@core/models';
import { TenantRole } from '@core/enums';
import { MembersStatsComponent } from './components/members-stats';
import { MembersListComponent } from './components/members-list';
import { InviteMemberModalComponent } from './components/invite-member-modal';

@Component({
  selector: 'app-members',
  standalone: true,
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
  private readonly toast = inject(ToastService);

  // State
  members = signal<TenantMember[]>([]);
  showInviteModal = signal(false);
  isLoading = signal(false);

  // Computed Stats
  totalMembers = computed(() => this.members().length);
  adminCount = computed(() => this.members().filter(m => m.role === TenantRole.Admin || m.role === TenantRole.Owner).length);
  pendingInvites = signal(1); // Demo value for now

  ngOnInit() {
    this.loadMembers();
  }

  async loadMembers() {
    this.isLoading.set(true);
    try {
      const data = await this.tenantService.getMembers();
      this.members.set(data);
    } catch (error) {
      this.toast.error('Failed to load members');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onInviteSubmit(event: { email: string; role: TenantRole }) {
    try {
      await this.tenantService.inviteMember(event.email, event.role);
      this.toast.success('Invitation sent successfully');
      this.showInviteModal.set(false);
      await this.loadMembers();
    } catch (error: any) {
      this.toast.error(error.message || 'Failed to send invitation');
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
