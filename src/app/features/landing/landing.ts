import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BILLING_PLANS } from '@core/models/billing.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30">
      <!-- Navbar -->
      <nav class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span class="text-white font-bold text-xl italic">V</span>
              </div>
              <span class="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                Venti
              </span>
            </div>
            <div class="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600 dark:text-gray-400">
              <a href="#features" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
              <a href="#pricing" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</a>
              <a href="#contact" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</a>
            </div>
            <div class="flex items-center gap-4">
              <a routerLink="/auth/login" class="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors">Log in</a>
              <a href="#pricing" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-full shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="relative pt-20 pb-32 overflow-hidden">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent rounded-full blur-3xl -z-10"></div>
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in opacity-0" style="animation-delay: 0.1s; animation-fill-mode: forwards;">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            New: Multi-tenant Support
          </div>
          
          <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 leading-tight animate-slide-up opacity-0" style="animation-delay: 0.2s; animation-fill-mode: forwards;">
            Launch your SaaS <br class="hidden md:block"> in minutes, not months.
          </h1>
          
          <p class="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed animate-slide-up opacity-0" style="animation-delay: 0.3s; animation-fill-mode: forwards;">
            The ultimate multi-tenant platform for shops. Manage products, members, and subscriptions with a beautiful, unified interface.
          </p>
          
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-slide-up opacity-0" style="animation-delay: 0.4s; animation-fill-mode: forwards;">
            <a href="#pricing" class="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1 active:scale-95">
              Start your free trial
            </a>
            <a href="#features" class="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold rounded-2xl shadow-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-1 active:scale-95">
              View features
            </a>
          </div>

          <!-- Feature Image Placeholder -->
          <div class="relative max-w-5xl mx-auto animate-float opacity-0" style="animation-delay: 0.6s; animation-fill-mode: forwards;">
            <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2.5rem] blur opacity-20 dark:opacity-40"></div>
            <div class="relative bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden aspect-video group">
              <!-- [PLACEMENT: Main Dashboard Screenshot] -->
              <div class="absolute inset-0 bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
                 <svg class="w-20 h-20 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
                 <span class="ml-4 text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest text-sm">Main Dashboard Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-32 bg-white dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-20">
            <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-4">Everything you need</h2>
            <p class="text-3xl md:text-5xl font-bold dark:text-white">Built for modern businesses</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
            <!-- Feature 1 -->
            <div class="group p-8 rounded-3xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105">
              <div class="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 transition-transform group-hover:rotate-6">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-4 dark:text-white">Multi-tenant Architecture</h3>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed">
                Separate stores/tenants with their own data, branding, and members. Scalable by design.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="group p-8 rounded-3xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105">
              <div class="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 transition-transform group-hover:rotate-6">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-4 dark:text-white">Advanced Analytics</h3>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed">
                Track sales, inventory, and resource usage across all your tenants from a single dashboard.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="group p-8 rounded-3xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105">
              <div class="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 transition-transform group-hover:rotate-6">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-4 dark:text-white">Team Management</h3>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed">
                Invite members with granular roles (Admin, Editor, Delivery) to help manage your operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section id="pricing" class="py-32">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-20 animate-fade-in">
            <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-4">Pricing</h2>
            <p class="text-3xl md:text-5xl font-bold dark:text-white">Simple, transparent pricing</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div *ngFor="let plan of plans; let i = index" 
                 class="relative p-8 bg-white dark:bg-gray-900 rounded-3xl border transition-all duration-300 hover:shadow-2xl group flex flex-col hover:-translate-y-2 animate-slide-up opacity-0"
                 [ngStyle]="{'animation-delay': (0.1 * i) + 's', 'animation-fill-mode': 'forwards'}"
                 [ngClass]="plan.isRecommended ? 'border-indigo-500 lg:scale-105 shadow-xl z-10' : 'border-gray-100 dark:border-gray-800'">
              
              <div *ngIf="plan.isRecommended" class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                Most Popular
              </div>

              <div class="mb-8">
                <h3 class="text-lg font-bold mb-2 dark:text-white">{{ plan.name }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 min-h-[40px]">{{ plan.description }}</p>
              </div>

              <div class="mb-8 font-black">
                <div class="flex items-baseline gap-1">
                  <span class="text-4xl dark:text-white">{{ plan.price | currency:'USD':'symbol':'1.0-2' }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">/{{ plan.interval }}</span>
                </div>
              </div>

              <ul class="space-y-4 mb-10 flex-1">
                <li *ngFor="let feature of plan.features" class="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ feature }}
                </li>
              </ul>

              <a [routerLink]="['/auth/purchase']" [queryParams]="{ plan: plan.id }"
                 class="w-full py-4 rounded-2xl font-bold text-center transition-all active:scale-95"
                 [ngClass]="plan.isRecommended ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700' : 'bg-slate-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'">
                 Get Started
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer id="contact" class="py-20 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div class="md:col-span-1">
              <div class="flex items-center gap-2 mb-6">
                <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-xl italic">V</span>
                </div>
                <span class="text-xl font-bold tracking-tight dark:text-white">Venti</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                The modern way to build and scale your multi-tenant SaaS application.
              </p>
            </div>
            
            <div *ngFor="let group of footerLinks">
              <h4 class="text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white mb-6">{{ group.title }}</h4>
              <ul class="space-y-4">
                <li *ngFor="let link of group.links">
                  <a href="#" class="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors">{{ link }}</a>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p class="text-xs text-gray-400 dark:text-gray-500">© 2024 Venti Commerce Inc. All rights reserved.</p>
            <div class="flex gap-8">
              <a href="#" class="text-xs text-gray-400 hover:text-indigo-600">Privacy Policy</a>
              <a href="#" class="text-xs text-gray-400 hover:text-indigo-600">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.8s ease-out forwards;
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .animate-float {
      animation: float 5s ease-in-out infinite, fade-in 1.2s ease-out forwards;
    }
    .animate-bounce-slow {
      animation: bounce 3s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
      50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  readonly plans = BILLING_PLANS;

  readonly footerLinks = [
    {
      title: 'Product',
      links: ['Features', 'Pricing', 'Documentation', 'Changelog']
    },
    {
      title: 'Company',
      links: ['About Us', 'Blog', 'Careers', 'Contact']
    },
    {
      title: 'Legal',
      links: ['Privacy', 'Terms', 'Cookie Policy', 'SLA']
    }
  ];
}
