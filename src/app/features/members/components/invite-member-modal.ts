import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TenantRole } from '@core/enums';

@Component({
    selector: 'app-invite-member-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
        <!-- Header -->
        <div class="px-6 py-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Invite New Member</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a person to your Venti store to help manage your business.</p>
            </div>
            <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <!-- Body -->
        <form [formGroup]="inviteForm" (ngSubmit)="onSubmit()" class="px-6 py-6 space-y-6">
            <!-- Email Address -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <input type="email" formControlName="email" 
                       class="block w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                       placeholder="name@example.com">
            </div>

            <!-- Role Selection -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Role</label>
                <select formControlName="role" 
                        class="block w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <option [value]="TenantRole.Viewer">Viewer</option>
                    <option [value]="TenantRole.Editor">Editor</option>
                    <option [value]="TenantRole.Admin">Admin</option>
                </select>
            </div>

            <!-- Permissions (Simulated as per design) -->
            <div class="space-y-4 pt-2">
                <div class="flex items-center gap-2 mb-4">
                    <div class="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                        <svg class="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <span class="text-sm font-bold text-gray-900 dark:text-white">Permissions</span>
                </div>

                <div class="flex items-start justify-between">
                    <div>
                        <div class="text-sm font-semibold text-gray-900 dark:text-white">Manage Products</div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Create, edit, and delete store products</p>
                    </div>
                    <label class="inline-flex relative items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" checked>
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <div class="flex items-start justify-between">
                    <div>
                        <div class="text-sm font-semibold text-gray-900 dark:text-white">View Orders</div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Access customer order history and details</p>
                    </div>
                    <label class="inline-flex relative items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" checked>
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <div class="flex items-start justify-between">
                    <div>
                        <div class="text-sm font-semibold text-gray-900 dark:text-white">Edit Store Settings</div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Modify payment methods and branding</p>
                    </div>
                    <label class="inline-flex relative items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                <button type="button" (click)="close.emit()" 
                        class="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                    Cancel
                </button>
                <button type="submit" [disabled]="inviteForm.invalid || loading()"
                        class="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all">
                    {{ loading() ? 'Sending...' : 'Send Invitation' }}
                    <svg *ngIf="!loading()" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </div>
        </form>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteMemberModalComponent {
    submit = output<{ email: string; role: TenantRole }>();
    close = output<void>();
    private readonly fb = inject(FormBuilder);

    loading = signal(false);

    TenantRole = TenantRole;
    inviteForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        role: [TenantRole.Viewer, [Validators.required]],
    });

    constructor() { }

    onSubmit() {
        if (this.inviteForm.valid) {
            this.submit.emit(this.inviteForm.value as { email: string; role: TenantRole });
        }
    }
}
