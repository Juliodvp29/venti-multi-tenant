import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  remove(id: string) {
    // If it's a confirmation toast and we close it via the 'X' button or auto-close (not applicable here usually), 
    // we should treat it as 'cancel' to resolve the promise.
    const toast = this.toasts().find(t => t.id === id);
    if (toast?.type === 'confirm') {
      toast.onCancel?.();
    }
    this.toastService.remove(id);
  }

  confirm(id: string) {
    const toast = this.toasts().find(t => t.id === id);
    if (toast) {
      toast.onConfirm?.();
      // The onConfirm callback in service removes the toast, but we can do it here too just in case.
      // But typically the service callback handles resolution.
      // Actually, my service implementation removes it in onConfirm.
    }
  }

  cancel(id: string) {
    const toast = this.toasts().find(t => t.id === id);
    if (toast) {
      toast.onCancel?.();
      this.toastService.remove(id);
    }
  }
}
