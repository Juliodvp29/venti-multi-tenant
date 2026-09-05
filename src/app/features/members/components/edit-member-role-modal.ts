import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TenantRole } from '@core/enums';
import { TenantMember } from '@core/models';

@Component({
  selector: 'app-edit-member-role-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200"
      >
        <!-- Header -->
        <div
          class="px-6 py-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between"
        >
          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">Editar rol</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate max-w-70">
              {{ member().email || 'Miembro del equipo' }}
              @if (isInvite()) {
                <span
                  class="ml-1 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300"
                >
                  Invitación pendiente
                </span>
              }
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            (click)="close.emit()"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <form class="px-6 py-6 space-y-6" [formGroup]="roleForm" (ngSubmit)="onSubmit()">
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >Rol</label
            >
            <select
              formControlName="role"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold text-slate-700 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer appearance-none transition-all"
            >
              @for (role of roleOptions; track role.value) {
                <option [value]="role.value">{{ role.label }}</option>
              }
            </select>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              @if (isInvite()) {
                Se aplicará cuando la persona acepte la invitación.
              } @else {
                El cambio de rol aplica de inmediato.
              }
            </p>
          </div>

          <!-- Actions -->
          <div
            class="flex items-center justify-end gap-3 pt-4 border-t border-gray-50 dark:border-gray-800"
          >
            <button
              type="button"
              class="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              (click)="close.emit()"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-6 py-2.5 bg-sky-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-200 dark:shadow-none hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2 transition-all"
              [disabled]="roleForm.invalid"
            >
              Guardar rol
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditMemberRoleModalComponent {
  member = input.required<TenantMember>();
  close = output<void>();
  save = output<{ member: TenantMember; role: TenantRole }>();

  private readonly fb = inject(FormBuilder);

  readonly isInvite = computed(() => !!this.member()['is_invite']);

  readonly roleForm = this.fb.nonNullable.group({
    role: [TenantRole.Viewer as TenantRole, [Validators.required]],
  });

  readonly roleOptions = [
    { label: 'Propietario (Owner)', value: TenantRole.Owner },
    { label: 'Administrador (Admin)', value: TenantRole.Admin },
    { label: 'Editor', value: TenantRole.Editor },
    { label: 'Espectador (Viewer)', value: TenantRole.Viewer },
    { label: 'Repartidor (Delivery)', value: TenantRole.Delivery },
  ];

  constructor() {
    effect(() => {
      this.roleForm.controls.role.setValue(this.member().role as TenantRole);
    });
  }

  onSubmit() {
    if (this.roleForm.invalid) return;
    this.save.emit({ member: this.member(), role: this.roleForm.getRawValue().role });
  }
}
