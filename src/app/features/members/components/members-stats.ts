import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-members-stats',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <!-- Total Members -->
      <div class="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <dt>
          <div class="absolute rounded-xl bg-indigo-50 p-3 dark:bg-indigo-900/30">
            <svg class="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.162a7.334 7.334 0 0 1-4.59 6.953 4.117 4.117 0 0 1-7.838-1.511 2.25 2.25 0 0 1 2.25-2.25h2.25" />
            </svg>
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Members</p>
        </dt>
        <dd class="ml-16 flex items-baseline">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ total() }}</p>
          <p class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
            <svg class="h-5 w-5 flex-shrink-0 self-center text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.25a.75.75 0 0 1 1.08 0l5.25 5.25a.75.75 0 1 1-1.08 1.04l-3.96-3.908V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" />
            </svg>
            <span class="sr-only"> Increased by </span>
            2
          </p>
        </dd>
      </div>

      <!-- Admin Users -->
      <div class="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <dt>
          <div class="absolute rounded-xl bg-purple-50 p-3 dark:bg-purple-900/30">
            <svg class="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin Users</p>
        </dt>
        <dd class="ml-16 flex items-baseline">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ admins() }}</p>
        </dd>
      </div>

      <!-- Pending Invites -->
      <div class="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <dt>
          <div class="absolute rounded-xl bg-amber-50 p-3 dark:bg-amber-900/30">
            <svg class="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Invites</p>
        </dt>
        <dd class="ml-16 flex items-baseline">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ pending() }}</p>
        </dd>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersStatsComponent {
    total = input<number>(0);
    admins = input<number>(0);
    pending = input<number>(0);
}
