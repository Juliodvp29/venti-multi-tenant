import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TenantService } from '@core/services/tenant';
import { AuthService } from '@core/services/auth';

@Component({
  selector: 'app-select-store',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
            <!-- Vcart Logo -->
            <svg viewBox="0 0 500 150" class="h-16 w-auto drop-shadow-md animate-fade-in" style="font-family: 'Outfit', sans-serif;">
              <defs>
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&display=swap');
                </style>
              </defs>
              <g transform="translate(10, 5)">
                <path d="M 35 45 L 65 92 L 95 45 L 145 45" class="stroke-indigo-600 dark:stroke-white" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                <circle cx="50" cy="112" r="7.5" class="fill-indigo-600 dark:fill-white" />
                <circle cx="80" cy="112" r="7.5" class="fill-indigo-600 dark:fill-white" />
              </g>

              <text x="105" y="100">
                <tspan class="fill-gray-900 dark:fill-white" font-weight="700" font-size="64px">enti </tspan>
                <tspan class="fill-indigo-600 dark:fill-indigo-400" opacity="0.9" font-weight="800" font-size="64px">Shop</tspan>
              </text>
            </svg>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Select a Store
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          You have access to multiple stores. Please pick one to continue.
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white dark:bg-slate-800/50 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-slate-800 backdrop-blur-sm">
          
          @if (isLoading()) {
            <div class="flex justify-center py-8">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          } @else {
            <div class="space-y-4">
              @for (store of stores(); track store.id) {
                <button
                  (click)="selectStore(store.id)"
                  class="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all flex items-center justify-between group"
                >
                  <div class="flex items-center space-x-4">
                    <div class="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-xl uppercase">
                      {{ store.business_name.charAt(0) }}
                    </div>
                    <div>
                      <h3 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {{ store.business_name }}
                      </h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400">{{ store.slug }}.venti.shop</p>
                    </div>
                  </div>
                  <svg class="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              }

              @if (stores().length === 0) {
                 <div class="text-center py-6">
                    <p class="text-gray-500 dark:text-gray-400 mb-4">You do not have any active store memberships.</p>
                 </div>
              }
            </div>

            <div class="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
              <button
                (click)="logout()"
                class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign out
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class SelectStoreComponent implements OnInit {
  private readonly tenantService = inject(TenantService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  stores = signal<any[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    try {
      const stores = await this.getAllUserStores();
      this.stores.set(stores);

      if (stores.length === 1) {
        this.selectStore(stores[0].id);
      }
    } catch {
      console.error('Failed to load stores');
    } finally {
      this.isLoading.set(false);
    }
  }

  async getAllUserStores() {
    const { data, error } = await this.tenantService['supabase'].client
      .from('tenants')
      .select('id, business_name, slug');

    if (error) throw error;
    return data || [];
  }

  selectStore(tenantId: string) {
    this.tenantService.setCurrentTenant(tenantId);
    localStorage.setItem('venti_last_tenant', tenantId);
    this.router.navigate(['/dashboard']);
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/auth/login']);
  }
}
