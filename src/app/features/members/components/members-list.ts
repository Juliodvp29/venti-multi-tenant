import { ChangeDetectionStrategy, Component, computed, input, output, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { TenantMember } from '@core/models';
import { ColumnDef, TableAction } from '@core/types/table';

@Component({
    selector: 'app-members-list',
    standalone: true,
    imports: [CommonModule, DynamicTable],
    template: `
    <app-dynamic-table
      [title]="'Store Members'"
      [description]="'Manage your team members and their account permissions.'"
      [data]="members()"
      [columns]="columns()"
      [actions]="actions"
      (actionClick)="onAction($event)"
    >
      <!-- Custom Template for Name with Avatar -->
      <ng-template #nameTemplate let-value let-item="item">
        <div class="flex items-center">
            <div class="h-10 w-10 flex-shrink-0">
                <img class="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800" 
                     [src]="'https://ui-avatars.com/api/?name=' + item.user_id + '&background=random'" 
                     alt="">
            </div>
            <div class="ml-4">
                <div class="font-semibold text-gray-900 dark:text-white">Alex Rivera</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">alex.r&#64;venti.com</div>
            </div>
        </div>
      </ng-template>

      <!-- Custom Template for Status -->
      <ng-template #statusTemplate let-value let-item="item">
        <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              [ngClass]="item.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'">
            <span class="h-1.5 w-1.5 rounded-full" [ngClass]="item.is_active ? 'bg-green-500' : 'bg-gray-400'"></span>
            {{ item.is_active ? 'Active' : 'Inactive' }}
        </span>
      </ng-template>
    </app-dynamic-table>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersListComponent {
    members = input.required<TenantMember[]>();
    invite = output<void>();
    edit = output<TenantMember>();
    remove = output<TenantMember>();

    nameTemplate = viewChild.required<TemplateRef<any>>('nameTemplate');
    statusTemplate = viewChild.required<TemplateRef<any>>('statusTemplate');

    columns = computed<ColumnDef<TenantMember>[]>(() => [
        {
            key: 'user_id',
            label: 'Name',
            template: this.nameTemplate()
        },
        {
            key: 'role',
            label: 'Role',
            formatter: (val: string) => val.charAt(0).toUpperCase() + val.slice(1)
        },
        {
            key: 'is_active',
            label: 'Status',
            template: this.statusTemplate()
        },
        {
            key: 'created_at',
            label: 'Date Joined',
            type: 'date'
        }
    ]);

    actions: TableAction<TenantMember>[] = [
        {
            id: 'edit',
            label: 'Edit',
            icon: 'edit',
            callback: (item) => this.edit.emit(item)
        },
        {
            id: 'remove',
            label: 'Remove',
            className: 'text-red-600 hover:text-red-900',
            callback: (item) => this.remove.emit(item)
        }
    ];

    onAction(event: { actionId: string; item: TenantMember }) {
        if (event.actionId === 'edit') this.edit.emit(event.item);
        if (event.actionId === 'remove') this.remove.emit(event.item);
    }
}
