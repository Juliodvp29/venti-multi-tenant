import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-success',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-md mx-auto py-24 text-center">
      <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
        ✓
      </div>
      <h1 class="text-3xl font-bold text-slate-900 mb-2">Order Received!</h1>
      <p class="text-slate-500 mb-8">Thank you for your purchase. We'll send you an email with your order details shortly.</p>
      
      <button routerLink="/store" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors">
        Back to Store
      </button>
    </div>
  `,
})
export class OrderSuccess { }
