import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupportService } from '@core/services/support.service';
import { TenantService } from '@core/services/tenant';
import { AuthService } from '@core/services/auth';
import { ToastService } from '@core/services/toast';
import { TicketCategory, TicketSeverity, TroubleshootingGuide } from '@core/models/support';

export type HelpViewMode = 'home' | 'checklist' | 'troubleshooting' | 'contact';

@Component({
  selector: 'app-help-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './help-drawer.html',
  styleUrl: './help-drawer.css',
})
export class HelpDrawer {
  private readonly supportService = inject(SupportService);
  protected readonly tenantService = inject(TenantService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly elementRef = inject(ElementRef);

  readonly isOpen = signal(false);
  readonly currentView = signal<HelpViewMode>('home');
  readonly selectedGuideId = signal<string | null>(null);
  readonly searchQuery = signal<string>('');

  readonly isSubmitting = signal(false);
  readonly isUploading = signal(false);
  readonly attachments = signal<string[]>([]);

  readonly healthSummary = this.supportService.healthSummary;
  readonly isCheckingHealth = this.supportService.isCheckingHealth;
  readonly troubleshootingGuides = this.supportService.troubleshootingGuides;

  readonly filteredGuides = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const guides = this.troubleshootingGuides();
    if (!query) return guides;
    return guides.filter(
      (g) =>
        g.title.toLowerCase().includes(query) ||
        g.summary.toLowerCase().includes(query) ||
        g.commonCauses.some((c) => c.toLowerCase().includes(query))
    );
  });

  readonly contactForm = this.fb.nonNullable.group({
    category: ['store_setup' as TicketCategory, [Validators.required]],
    severity: ['low' as TicketSeverity, [Validators.required]],
    subject: ['', [Validators.required, Validators.minLength(5)]],
    message: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(5000)]],
  });

  readonly messageCharCount = computed(() => {
    return this.contactForm.controls.message.value?.length || 0;
  });

  open(view: HelpViewMode = 'home'): void {
    this.currentView.set(view);
    this.isOpen.set(true);
    this.supportService.evaluateStoreHealth();
  }

  close(): void {
    this.isOpen.set(false);
  }

  setView(view: HelpViewMode): void {
    this.currentView.set(view);
    if (view === 'checklist') {
      this.supportService.evaluateStoreHealth();
    }
  }

  toggleGuide(guideId: string): void {
    this.selectedGuideId.update((current) => (current === guideId ? null : guideId));
  }

  navigateTo(route: string, queryParams?: Record<string, string>): void {
    this.close();
    this.router.navigate([route], { queryParams });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    if (this.attachments().length >= 5) {
      this.toast.warning('Límite alcanzado', 'Puedes adjuntar un máximo de 5 capturas o archivos.');
      return;
    }

    const file = input.files[0];
    this.isUploading.set(true);

    const result = await this.supportService.uploadAttachment(file);
    this.isUploading.set(false);

    if (result.url) {
      this.attachments.update((list) => [...list, result.url!]);
      this.toast.success('Archivo adjuntado', file.name);
    } else {
      this.toast.error('Error al subir', result.error || 'No se pudo subir la captura');
    }

    input.value = '';
  }

  removeAttachment(index: number): void {
    this.attachments.update((list) => list.filter((_, i) => i !== index));
  }

  async onSubmitTicket(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const tenantId = this.tenantService.tenantId();
    const user = this.authService.user();

    if (!tenantId || !user) {
      this.toast.error('Error de sesión', 'No se detectó la tienda o el usuario activo');
      return;
    }

    this.isSubmitting.set(true);

    const val = this.contactForm.getRawValue();

    const res = await this.supportService.createSupportTicket({
      tenant_id: tenantId,
      user_id: user.id,
      category: val.category,
      severity: val.severity,
      subject: val.subject,
      message: val.message,
      attachments: this.attachments(),
    });

    this.isSubmitting.set(false);

    if (res.success) {
      this.contactForm.reset({
        category: 'store_setup',
        severity: 'low',
        subject: '',
        message: '',
      });
      this.attachments.set([]);
      this.setView('home');
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
}
