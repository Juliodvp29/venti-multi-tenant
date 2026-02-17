import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';

@Component({
   changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <!-- Mobile sidebar backdrop -->
      @if (isSidebarOpen()) {
        <div 
          class="fixed inset-0 z-40 bg-gray-600 dark:bg-gray-900 bg-opacity-75 transition-opacity md:hidden"
          (click)="closeSidebar()"
        ></div>
      }

      <!-- Sidebar -->
      <app-sidebar [isOpen]="isSidebarOpen()" />

      <!-- Content area -->
      <div class="flex-1 flex flex-col overflow-hidden w-full">
        <app-header (toggleSidebar)="toggleSidebar()" />

        <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  readonly isSidebarOpen = signal(false);

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }
}
