import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Members } from './members';
import { TenantService } from '@core/services/tenant';
import { SubscriptionService } from '@core/services/subscription';
import { ToastService } from '@core/services/toast';
import { TenantRole } from '@core/enums';
import { TenantMember, TenantInvitation } from '@core/models';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('Members', () => {
  let component: Members;
  let fixture: ComponentFixture<Members>;

  const mockMembers: TenantMember[] = [
    {
      id: 'm1',
      tenant_id: 't1',
      user_id: 'u1',
      role: TenantRole.Owner,
      permissions: [],
      is_active: true,
      email: 'owner@test.com',
      created_at: new Date().toISOString(),
    },
    {
      id: 'm2',
      tenant_id: 't1',
      user_id: 'u2',
      role: TenantRole.Admin,
      permissions: [],
      is_active: true,
      email: 'admin@test.com',
      created_at: new Date().toISOString(),
    },
    {
      id: 'm3',
      tenant_id: 't1',
      user_id: 'u3',
      role: TenantRole.Editor,
      permissions: [],
      is_active: true,
      email: 'editor@test.com',
      created_at: new Date().toISOString(),
    },
  ];

  const mockInvitations: TenantInvitation[] = [
    {
      id: 'inv1',
      tenant_id: 't1',
      email: 'pending@test.com',
      role: TenantRole.Viewer,
      token: 'tok-123',
      status: 'pending',
      invited_by: 'u1',
      expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  const tenantServiceMock = {
    tenantId: signal('tenant-123'),
    getMembers: vi.fn().mockResolvedValue(mockMembers),
    getInvitations: vi.fn().mockResolvedValue(mockInvitations),
    inviteMember: vi.fn().mockResolvedValue({}),
    removeMember: vi.fn().mockResolvedValue({}),
    updateMemberRole: vi.fn().mockResolvedValue({}),
  };

  const subscriptionServiceMock = {
    canAddResource: vi.fn().mockResolvedValue(true),
  };

  const toastServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    tenantServiceMock.getMembers.mockResolvedValue(mockMembers);
    tenantServiceMock.getInvitations.mockResolvedValue(mockInvitations);
    subscriptionServiceMock.canAddResource.mockResolvedValue(true);
    toastServiceMock.confirm.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [Members],
      providers: [
        { provide: TenantService, useValue: tenantServiceMock },
        { provide: SubscriptionService, useValue: subscriptionServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Members);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and load members and invitations', async () => {
    expect(component).toBeTruthy();
    await component.loadMembers();

    expect(component.members().length).toBe(4); // 3 members + 1 invite
    expect(component.totalMembers()).toBe(3);
    expect(component.adminCount()).toBe(2); // 1 Owner + 1 Admin
    expect(component.pendingInvites()).toBe(1);
  });

  it('should open invite modal when resource limit allows it', async () => {
    subscriptionServiceMock.canAddResource.mockResolvedValue(true);
    await component.openInviteModal();

    expect(component.showInviteModal()).toBe(true);
  });

  it('should show error when resource limit is reached', async () => {
    subscriptionServiceMock.canAddResource.mockResolvedValue(false);
    await component.openInviteModal();

    expect(component.showInviteModal()).toBe(false);
    expect(toastServiceMock.error).toHaveBeenCalledWith(
      expect.stringContaining('límite de miembros'),
    );
  });

  it('should invite a new member and refresh the list', async () => {
    await component.onInviteSubmit({ email: 'new@test.com', role: TenantRole.Editor });

    expect(tenantServiceMock.inviteMember).toHaveBeenCalledWith('new@test.com', TenantRole.Editor);
    expect(toastServiceMock.success).toHaveBeenCalledWith('Invitación enviada con éxito');
    expect(component.showInviteModal()).toBe(false);
  });

  it('should remove a member after confirmation', async () => {
    toastServiceMock.confirm.mockResolvedValue(true);
    await component.onMemberRemove(mockMembers[2]);

    expect(tenantServiceMock.removeMember).toHaveBeenCalledWith('m3');
    expect(toastServiceMock.success).toHaveBeenCalledWith('Miembro eliminado');
  });

  it('should update member role when role is valid', async () => {
    const memberToUpdate = { ...mockMembers[2], role: TenantRole.Admin };
    await component.onMemberRoleUpdate(memberToUpdate);

    expect(tenantServiceMock.updateMemberRole).toHaveBeenCalledWith('m3', TenantRole.Admin);
    expect(toastServiceMock.success).toHaveBeenCalledWith('Rol actualizado');
  });
});
