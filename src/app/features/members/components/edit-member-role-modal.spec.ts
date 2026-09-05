import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TenantRole } from '@core/enums';
import { TenantMember } from '@core/models';
import { EditMemberRoleModalComponent } from './edit-member-role-modal';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('EditMemberRoleModalComponent', () => {
  let component: EditMemberRoleModalComponent;
  let fixture: ComponentFixture<EditMemberRoleModalComponent>;

  const member: TenantMember = {
    id: 'm2',
    tenant_id: 't1',
    user_id: 'u2',
    role: TenantRole.Admin,
    permissions: [],
    is_active: true,
    email: 'admin@test.com',
    created_at: new Date().toISOString(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMemberRoleModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditMemberRoleModalComponent);
    fixture.componentRef.setInput('member', member);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create with the current role preselected', () => {
    expect(component).toBeTruthy();
    expect(component.roleForm.controls.role.value).toBe(TenantRole.Admin);
  });

  it('should emit save with the chosen role', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.roleForm.controls.role.setValue(TenantRole.Editor);
    component.onSubmit();

    expect(saveSpy).toHaveBeenCalledWith({ member, role: TenantRole.Editor });
  });

  it('should not emit save when the form is invalid', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.roleForm.controls.role.setValue('' as TenantRole);
    component.onSubmit();

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
