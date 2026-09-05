import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Members } from './members';
import { TenantService } from '@core/services/tenant';
import { SubscriptionService } from '@core/services/subscription';
import { ToastService } from '@core/services/toast';
import { AuditLogsService } from '@core/services/audit-logs';
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
    timezone: signal('America/Bogota'),
    getMembers: vi.fn().mockResolvedValue(mockMembers),
    getInvitations: vi.fn().mockResolvedValue(mockInvitations),
    inviteMember: vi.fn().mockResolvedValue({}),
    removeMember: vi.fn().mockResolvedValue({}),
    updateMemberRole: vi.fn().mockResolvedValue({}),
    cancelInvitation: vi.fn().mockResolvedValue({}),
    updateInvitationRole: vi.fn().mockResolvedValue({}),
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

  const auditLogsServiceMock = {
    getRecent: vi.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    tenantServiceMock.getMembers.mockResolvedValue(mockMembers);
    tenantServiceMock.getInvitations.mockResolvedValue(mockInvitations);
    subscriptionServiceMock.canAddResource.mockResolvedValue(true);
    toastServiceMock.confirm.mockResolvedValue(true);
    auditLogsServiceMock.getRecent.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [Members],
      providers: [
        { provide: TenantService, useValue: tenantServiceMock },
        { provide: SubscriptionService, useValue: subscriptionServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: AuditLogsService, useValue: auditLogsServiceMock },
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

  it('should open and close the edit role modal', () => {
    component.openEditModal(mockMembers[2]);

    expect(component.showEditModal()).toBe(true);
    expect(component.selectedMember()).toEqual(mockMembers[2]);

    component.closeEditModal();

    expect(component.showEditModal()).toBe(false);
    expect(component.selectedMember()).toBeNull();
  });

  it('should update member role when role is valid', async () => {
    await component.onEditRoleSave({ member: mockMembers[2], role: TenantRole.Admin });

    expect(tenantServiceMock.updateMemberRole).toHaveBeenCalledWith('m3', TenantRole.Admin);
    expect(toastServiceMock.success).toHaveBeenCalledWith('Rol actualizado');
    expect(component.showEditModal()).toBe(false);
  });

  it('should update invitation role instead of member role for invites', async () => {
    const inviteRow = {
      ...mockMembers[2],
      id: 'inv1',
      is_invite: true,
    } as TenantMember;
    await component.onEditRoleSave({ member: inviteRow, role: TenantRole.Editor });

    expect(tenantServiceMock.updateInvitationRole).toHaveBeenCalledWith('inv1', TenantRole.Editor);
    expect(tenantServiceMock.updateMemberRole).not.toHaveBeenCalled();
    expect(toastServiceMock.success).toHaveBeenCalledWith('Rol de la invitación actualizado');
  });

  it('should reject invalid roles', async () => {
    await component.onEditRoleSave({
      member: mockMembers[2],
      role: 'superadmin' as TenantRole,
    });

    expect(tenantServiceMock.updateMemberRole).not.toHaveBeenCalled();
    expect(toastServiceMock.error).toHaveBeenCalledWith(expect.stringContaining('Rol inválido'));
  });

  it('should cancel a pending invitation instead of removing a member', async () => {
    toastServiceMock.confirm.mockResolvedValue(true);
    const inviteRow = {
      ...mockMembers[2],
      id: 'inv1',
      is_invite: true,
      email: 'pending@test.com',
    } as TenantMember;
    await component.onMemberRemove(inviteRow);

    expect(tenantServiceMock.cancelInvitation).toHaveBeenCalledWith('inv1');
    expect(tenantServiceMock.removeMember).not.toHaveBeenCalled();
    expect(toastServiceMock.success).toHaveBeenCalledWith('Invitación cancelada');
  });

  it('should map resource types to Spanish', () => {
    expect(component.getAuditResourceLabel('tenants')).toBe('tienda');
    expect(component.getAuditResourceLabel('tenant_members')).toBe('miembro del equipo');
    expect(component.getAuditResourceLabel('orders')).toBe('orden');
  });

  it('should summarize object values in Spanish instead of [object Object]', () => {
    const log = {
      action: 'update',
      resource_type: 'tenants',
      resource_id: 'eec67d81-0000-0000-0000-000000000000',
      new_values: {
        settings: { theme_config: { a: 1 }, currency: 'COP', untouched: true },
      },
      old_values: {
        settings: { theme_config: { a: 0 }, currency: 'USD', untouched: true },
      },
    } as never;

    const detail = component.getAuditDetail(log);

    expect(detail).not.toContain('[object Object]');
    expect(detail).not.toContain('Settings');
    expect(detail).toContain('tema visual');
    expect(detail).toContain('moneda');
    expect(detail).not.toContain('untouched');
  });

  it('should show exact date and time instead of relative time', () => {
    const label = component.getAuditTime('2026-08-23T14:32:00.000Z');

    expect(label).not.toContain('Hace');
    expect(label).toContain('2026');
    expect(label).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should filter out invitations whose email is already a member', async () => {
    tenantServiceMock.getInvitations.mockResolvedValueOnce([
      ...mockInvitations,
      {
        id: 'inv2',
        tenant_id: 't1',
        email: 'ADMIN@test.com',
        role: TenantRole.Viewer,
        token: 'tok-456',
        status: 'pending',
        invited_by: 'u1',
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ] as TenantInvitation[]);
    await component.loadMembers();

    expect(component.members().length).toBe(4); // 3 members + 1 invite (duplicada fuera)
    expect(component.pendingInvites()).toBe(1);
  });
});
