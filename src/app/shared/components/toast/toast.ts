import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  remove(id: string) {
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
