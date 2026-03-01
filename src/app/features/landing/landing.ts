import { ChangeDetectionStrategy, Component, inject, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BILLING_PLANS } from '@core/models/billing.model';
import { SeoService } from '@core/services/seo';

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
              <a (click)="scrollToSection('features')" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Features</a>
              <a (click)="scrollToSection('pricing')" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Pricing</a>
              <a (click)="scrollToSection('contact')" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Contact</a>
            </div>
            <div class="flex items-center gap-4">
              <a routerLink="/auth/login" class="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors">Log in</a>
              <a (click)="scrollToSection('pricing')" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-full shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
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
            <a (click)="scrollToSection('pricing')" class="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1 active:scale-95 cursor-pointer text-center">
              Start your free trial
            </a>
            <a (click)="scrollToSection('features')" class="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold rounded-2xl shadow-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-1 active:scale-95 cursor-pointer text-center">
              View features
            </a>
          </div>

          <!-- Feature Image Placeholder -->
          <div class="relative max-w-5xl mx-auto animate-float opacity-0" style="animation-delay: 0.6s; animation-fill-mode: forwards;">
            <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2.5rem] blur opacity-20 dark:opacity-40"></div>
            <div class="relative bg-slate-50 dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden group transition-all duration-500 hover:shadow-indigo-500/20 hover:border-indigo-500/30">
              <img 
                src="dashboard.png" 
                alt="Venti Dashboard Light" 
                class="w-full h-full object-contain transition-all duration-700 group-hover:scale-[1.02] dark:hidden"
              />
              <img 
                src="dashboard-black.png" 
                alt="Venti Dashboard Dark" 
                class="w-full h-full object-contain transition-all duration-700 group-hover:scale-[1.02] hidden dark:block"
              />
              <!-- Subtle glass overlay -->
              <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-40 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Premium Scroll Reveal Features -->
      <section class="py-32 space-y-40 overflow-hidden bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Feature 1: Powerful Analytics -->
          <div class="reveal-item flex flex-col md:flex-row items-center gap-12 lg:gap-24 opacity-0 translate-y-20 transition-all duration-1000 ease-out">
            <div class="flex-1 space-y-6">
              <div class="inline-flex p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 class="text-4xl md:text-5xl font-black tracking-tight dark:text-white">Analytics that speak <br><span class="text-indigo-600">for themselves.</span></h2>
              <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                No more doubts. Our real-time analytics show you exactly what's happening in your business. From category performance to average ticket value, all in one place.
              </p>
              <ul class="space-y-4">
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                  Detailed sales reports by category
                </li>
                <li class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div class="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                  Live tracking of top-performing products
                </li>
              </ul>
            </div>
            <div class="flex-1 relative group">
              <div class="absolute -inset-10 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div class="relative bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 p-12 shadow-2xl overflow-hidden">
                 <div class="aspect-square flex items-center justify-center">
                    <svg class="w-full h-full text-indigo-500" viewBox="0 0 100 100" fill="none">
                      <circle cx="50" cy="50" r="45" stroke="currentColor" stroke-width="2" stroke-dasharray="8 8" class="opacity-20"/>
                      <circle cx="50" cy="50" r="35" stroke="currentColor" stroke-width="10" stroke-dasharray="160 220" stroke-linecap="round" class="animate-spin-slow origin-center"/>
                      <text x="50" y="58" text-anchor="middle" font-weight="900" font-size="24" fill="currentColor">BI</text>
                    </svg>
                 </div>
              </div>
            </div>
          </div>

          <!-- Feature 2: Smart Inventory (Reverse Layout) -->
          <div class="reveal-item flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24 opacity-0 translate-y-20 transition-all duration-1000 ease-out">
            <div class="flex-1 space-y-6">
              <div class="inline-flex p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 class="text-4xl md:text-5xl font-black tracking-tight dark:text-white">Smart Inventory</h2>
              <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Manage your stock effortlessly. Full support for variants, low stock alerts, and automatic synchronization across all your branches.
              </p>
              <div class="grid grid-cols-2 gap-4">
                 <div class="p-6 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-[2rem] border border-emerald-100 dark:border-emerald-500/10">
                    <span class="block text-3xl font-black text-emerald-600 dark:text-emerald-400 italic">99.9%</span>
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Accuracy</span>
                 </div>
                 <div class="p-6 bg-emerald-100 dark:bg-emerald-500/20 rounded-[2rem] border border-emerald-200 dark:border-emerald-500/30">
                    <span class="block text-3xl font-black text-emerald-700 dark:text-white">Real</span>
                    <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Time</span>
                 </div>
              </div>
            </div>
            <div class="flex-1 relative group">
              <div class="absolute -inset-10 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div class="relative bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 p-12 shadow-2xl">
                 <div class="space-y-6">
                    <div class="h-4 bg-emerald-500/20 rounded-full w-3/4"></div>
                    <div class="h-4 bg-gray-100 dark:bg-gray-700 rounded-full w-full"></div>
                    <div class="h-4 bg-gray-100 dark:bg-gray-700 rounded-full w-5/6"></div>
                    <div class="flex justify-end pt-4">
                       <div class="w-14 h-14 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white">
                          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round"/></svg>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <!-- Feature 3: Customization -->
          <div class="reveal-item flex flex-col md:flex-row items-center gap-12 lg:gap-24 opacity-0 translate-y-20 transition-all duration-1000 ease-out">
            <div class="flex-1 space-y-6">
              <div class="inline-flex p-3 bg-orange-50 dark:bg-orange-500/10 rounded-2xl text-orange-600 dark:text-orange-400">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656l-1.172 1.172" />
                </svg>
              </div>
              <h2 class="text-4xl md:text-5xl font-black tracking-tight dark:text-white">Your store, <br><span class="text-orange-600">your brand.</span></h2>
              <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Personalize your store's appearance in seconds. Change colors, logos, and fonts to reflect your business's unique identity. Create an experience your customers will love.
              </p>
              <div class="flex flex-wrap gap-3">
                 <span class="px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-xl text-xs font-bold dark:text-white border border-transparent hover:border-orange-500/30 transition-all">Visual Branding</span>
                 <span class="px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-xl text-xs font-bold dark:text-white border border-transparent hover:border-orange-500/30 transition-all">HSL Colors</span>
                 <span class="px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-xl text-xs font-bold dark:text-white border border-transparent hover:border-orange-500/30 transition-all">Typography</span>
              </div>
            </div>
            <div class="flex-1 relative group">
              <div class="absolute -inset-10 bg-gradient-to-tr from-orange-500/20 to-amber-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div class="relative bg-slate-900 rounded-[3rem] p-2 shadow-2xl overflow-hidden aspect-video group-hover:scale-[1.02] transition-transform duration-500">
                 <div class="absolute inset-x-0 top-0 h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                    <div class="w-2 h-2 rounded-full bg-red-400/50"></div>
                    <div class="w-2 h-2 rounded-full bg-yellow-400/50"></div>
                    <div class="w-2 h-2 rounded-full bg-green-400/50"></div>
                 </div>
                 <div class="h-full pt-8 flex items-center justify-center">
                    <div class="grid grid-cols-3 gap-6 w-3/4">
                       <div class="aspect-square bg-orange-600 rounded-2xl rotate-12 group-hover:rotate-0 transition-transform duration-700"></div>
                       <div class="aspect-square bg-indigo-600 rounded-2xl -rotate-6 translate-y-4 group-hover:rotate-0 group-hover:translate-y-0 transition-all duration-700"></div>
                       <div class="aspect-square bg-emerald-600 rounded-2xl rotate-6 group-hover:rotate-0 transition-transform duration-700"></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-32 bg-white dark:bg-gray-900 scroll-mt-20">
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
      <section id="pricing" class="py-32 scroll-mt-20">
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
      <footer id="contact" class="py-20 border-at border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 scroll-mt-20">
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

    .reveal-visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly seo = inject(SeoService);
  private observer: IntersectionObserver | null = null;
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

  ngAfterViewInit() {
    this.initScrollReveal();
    // Handle initial hash if present
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      setTimeout(() => this.scrollToSection(id), 100);
    }

    // Set SEO Tags
    this.seo.updateTags({
      title: 'Venti Shop - The Modern Multi-Tenant Ecommerce Platform',
      description: 'Launch your SaaS in minutes. Manage products, members, and subscriptions with a beautiful, unified interface.',
      keywords: ['multi-tenant', 'ecommerce', 'saas', 'angular', 'supabase', 'store builder'],
      type: 'website'
    });

    this.seo.setOrganizationSchema({
      name: 'Venti Shop',
      url: window.location.origin,
      logo: window.location.origin + '/assets/logo.png' // Adjust path if needed
    });
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private initScrollReveal() {
    const options = {
      root: null,
      threshold: 0.1,
      rootMargin: '0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          // Once visible, we can stop observing this element
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    const items = this.el.nativeElement.querySelectorAll('.reveal-item');
    items.forEach((item: HTMLElement) => {
      // If item is already above the fold, show it immediately
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        item.classList.add('reveal-visible');
      } else {
        this.observer?.observe(item);
      }
    });
  }

  scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Navbar height + padding
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
