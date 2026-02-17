import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Venti</h1>
          <p class="text-gray-500 mt-1">Plataforma de comercio multi-tenant</p>
        </div>
        <!-- Page content -->
        <router-outlet />
      </div>
    </div>
  `,
})
export class AuthLayout {}
