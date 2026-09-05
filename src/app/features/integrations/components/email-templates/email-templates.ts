import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { EmailService, EmailTemplate } from '@core/services/email';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';
import { AuthService } from '@core/services/auth';
import {
  EMAIL_THEMES,
  EmailThemeId,
  getTemplateByTheme,
  VENTI_ELEGANT_TEMPLATES,
} from '../../../../core/constants/email-default-templates';

interface TemplateMetadata {
  displayName: string;
  badge: string;
  description: string;
  variables: { key: string; label: string; example: string }[];
}

@Component({
  selector: 'app-email-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-templates.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplatesManager implements OnInit {
  private readonly emailService = inject(EmailService);
  private readonly toast = inject(ToastService);
  private readonly tenantService = inject(TenantService);
  private readonly authService = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly templates = signal<EmailTemplate[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isSendingTest = signal(false);
  readonly selectedTemplate = signal<EmailTemplate | null>(null);

  // Form edit state
  readonly editSubject = signal('');
  readonly editBodyHtml = signal('');
  readonly editIsActive = signal(true);
  readonly previewTab = signal<'edit' | 'preview'>('edit');
  readonly testEmailRecipient = signal('');

  readonly templateCatalog: Record<string, TemplateMetadata> = {
    order_confirmation: {
      displayName: 'Confirmación de Pedido',
      badge: 'Clientes',
      description: 'Se envía al cliente inmediatamente después de registrar una compra.',
      variables: [
        { key: 'customer_name', label: 'Nombre del cliente', example: 'Camila Morales' },
        { key: 'order_number', label: 'Número de orden', example: 'VENTI-1024' },
        { key: 'order_total', label: 'Total formateado', example: '$185.000 COP' },
        { key: 'store_name', label: 'Nombre de la tienda', example: 'Mi Tienda' },
        { key: 'order_url', label: 'Enlace del pedido', example: 'https://tienda.com/pedidos/1024' },
      ],
    },
    shipping_notification: {
      displayName: 'Notificación de Despacho',
      badge: 'Clientes',
      description: 'Se envía al cliente cuando se genera la guía y transportadora del envío.',
      variables: [
        { key: 'customer_name', label: 'Nombre del cliente', example: 'Camila Morales' },
        { key: 'order_number', label: 'Número de orden', example: 'VENTI-1024' },
        { key: 'carrier', label: 'Empresa transportadora', example: 'Servientrega' },
        { key: 'tracking_number', label: 'Número de guía', example: 'SER-9948214' },
        { key: 'tracking_url', label: 'Enlace de rastreo', example: 'https://rastreo.com/9948214' },
        { key: 'store_name', label: 'Nombre de la tienda', example: 'Mi Tienda' },
      ],
    },
    customer_welcome: {
      displayName: 'Bienvenida a Clientes',
      badge: 'Clientes',
      description: 'Se envía a clientes que se registran en tu tienda online.',
      variables: [
        { key: 'customer_name', label: 'Nombre del cliente', example: 'Camila Morales' },
        { key: 'store_name', label: 'Nombre de la tienda', example: 'Mi Tienda' },
      ],
    },
    order_cancelled: {
      displayName: 'Cancelación de Pedido',
      badge: 'Clientes',
      description: 'Se envía al cliente si un pedido es cancelado.',
      variables: [
        { key: 'customer_name', label: 'Nombre del cliente', example: 'Camila Morales' },
        { key: 'order_number', label: 'Número de orden', example: 'VENTI-1024' },
        { key: 'cancel_reason', label: 'Motivo de cancelación', example: 'Solicitud del cliente' },
        { key: 'store_name', label: 'Nombre de la tienda', example: 'Mi Tienda' },
      ],
    },
    refund_processed: {
      displayName: 'Reembolso Procesado',
      badge: 'Clientes',
      description: 'Se envía al cliente tras procesar una devolución o reembolso.',
      variables: [
        { key: 'customer_name', label: 'Nombre del cliente', example: 'Camila Morales' },
        { key: 'order_number', label: 'Número de orden', example: 'VENTI-1024' },
        { key: 'refund_amount', label: 'Monto devuelto', example: '$75.000 COP' },
        { key: 'refund_reason', label: 'Motivo del reembolso', example: 'Garantía de producto' },
        { key: 'store_name', label: 'Nombre de la tienda', example: 'Mi Tienda' },
      ],
    },
    member_invitation: {
      displayName: 'Invitación a Colaborador',
      badge: 'Equipo',
      description: 'Se envía al invitar un miembro existente al equipo de tu tienda.',
      variables: [
        { key: 'store_name', label: 'Nombre de la tienda', example: 'Mi Tienda' },
        { key: 'invited_by_email', label: 'Email de quien invita', example: 'admin@tienda.com' },
        { key: 'role', label: 'Rol asignado', example: 'Editor' },
        { key: 'invite_link', label: 'Enlace para unirse', example: 'https://venti.app/invite/token' },
      ],
    },
    member_invitation_new_user: {
      displayName: 'Invitación a Nuevo Usuario',
      badge: 'Equipo',
      description: 'Se envía a usuarios nuevos que deben crear cuenta para colaborar.',
      variables: [
        { key: 'store_name', label: 'Nombre de la tienda', example: 'Mi Tienda' },
        { key: 'invited_by_email', label: 'Email de quien invita', example: 'admin@tienda.com' },
        { key: 'role', label: 'Rol asignado', example: 'Editor' },
        { key: 'invite_link', label: 'Enlace para registrarse', example: 'https://venti.app/register?invite=token' },
      ],
    },
  };

  readonly renderedPreviewHtml = computed(() => {
    const rawHtml = this.editBodyHtml();
    const template = this.selectedTemplate();
    if (!rawHtml || !template) return this.sanitizer.bypassSecurityTrustHtml('');

    const storeName = this.tenantService.tenant()?.business_name || 'Mi Tienda';
    const sampleData: Record<string, string> = {
      store_name: storeName,
      customer_name: 'Camila Morales',
      order_number: 'VENTI-1024',
      order_total: '$185.000 COP',
      total: '$185.000 COP',
      order_url: 'https://tienda.com/pedidos/1024',
      carrier: 'Servientrega',
      tracking_number: 'SER-9948214',
      tracking_url: 'https://rastreo.com/9948214',
      cancel_reason: 'Solicitud del cliente',
      refund_amount: '$185.000 COP',
      refund_reason: 'Garantía de producto',
      invited_by_email: this.authService.user()?.email || 'admin@tienda.com',
      role: 'Editor',
      invite_link: 'https://venti.app/invite/sample',
    };

    const rendered = this.emailService.replacePlaceholders(rawHtml, sampleData);
    const fullDoc =
      rendered.includes('<html') || rendered.includes('<!DOCTYPE')
        ? rendered
        : `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:16px;background:#f1f5f9;font-family:sans-serif;}</style></head><body>${rendered}</body></html>`;
    return this.sanitizer.bypassSecurityTrustHtml(fullDoc);
  });

  async ngOnInit() {
    this.testEmailRecipient.set(this.authService.user()?.email || '');
    await this.loadTemplates();
  }

  async loadTemplates() {
    this.isLoading.set(true);
    try {
      const data = await this.emailService.getTemplates();
      this.templates.set(data);
      if (data.length > 0 && !this.selectedTemplate()) {
        this.selectTemplate(data[0]);
      }
    } catch (err) {
      console.error('Error loading email templates:', err);
      this.toast.error('Error al cargar las plantillas de correo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  selectTemplate(tpl: EmailTemplate) {
    this.selectedTemplate.set(tpl);
    this.editSubject.set(tpl.subject || '');
    this.editBodyHtml.set(tpl.body_html || '');
    this.editIsActive.set(tpl.is_active ?? true);
    this.previewTab.set('edit');
  }

  getMetadata(key: string): TemplateMetadata {
    return (
      this.templateCatalog[key] || {
        displayName: key.replace(/_/g, ' '),
        badge: 'General',
        description: 'Plantilla de correo transaccional.',
        variables: [],
      }
    );
  }

  readonly availableThemes = EMAIL_THEMES;

  copyVariable(key: string) {
    const text = `{{${key}}}`;
    void navigator.clipboard.writeText(text);
    this.toast.info(`Copiado: ${text}`);
  }

  applyTheme(themeId: EmailThemeId) {
    const tpl = this.selectedTemplate();
    if (!tpl) return;

    const templateData = getTemplateByTheme(themeId, tpl.template_key);
    if (!templateData) {
      this.toast.error('No hay una versión disponible para este estilo y plantilla.');
      return;
    }

    this.editSubject.set(templateData.subject);
    this.editBodyHtml.set(templateData.body_html);
    const themeName = EMAIL_THEMES.find((t) => t.id === themeId)?.name || 'seleccionado';
    this.toast.success(`Estilo "${themeName}" aplicado. Puedes previsualizarlo o pulsar "Guardar Plantilla" para guardarlo.`);
  }

  applyVentiDesign() {
    this.applyTheme('venti');
  }

  async toggleActive(tpl: EmailTemplate, event: Event) {
    event.stopPropagation();
    const newStatus = !(tpl.is_active ?? true);
    try {
      const res = await this.emailService.updateTemplate(tpl.id, { is_active: newStatus });
      if (res.success) {
        this.templates.update((list) =>
          list.map((item) => (item.id === tpl.id ? { ...item, is_active: newStatus } : item))
        );
        if (this.selectedTemplate()?.id === tpl.id) {
          this.editIsActive.set(newStatus);
        }
        this.toast.success(`Plantilla ${newStatus ? 'activada' : 'desactivada'}.`);
      } else {
        this.toast.error(res.error || 'Error al actualizar estado.');
      }
    } catch (err: any) {
      this.toast.error(err?.message || 'Error inesperado.');
    }
  }

  async saveChanges() {
    const tpl = this.selectedTemplate();
    if (!tpl) return;

    if (!this.editSubject().trim() || !this.editBodyHtml().trim()) {
      this.toast.error('El asunto y el cuerpo del correo no pueden estar vacíos.');
      return;
    }

    this.isSaving.set(true);
    try {
      const res = await this.emailService.updateTemplate(tpl.id, {
        subject: this.editSubject().trim(),
        body_html: this.editBodyHtml().trim(),
        is_active: this.editIsActive(),
      });

      if (res.success) {
        this.templates.update((list) =>
          list.map((item) =>
            item.id === tpl.id
              ? {
                  ...item,
                  subject: this.editSubject().trim(),
                  body_html: this.editBodyHtml().trim(),
                  is_active: this.editIsActive(),
                }
              : item
          )
        );
        this.toast.success('Plantilla guardada con éxito.');
      } else {
        this.toast.error(res.error || 'Error al guardar la plantilla.');
      }
    } catch (err: any) {
      this.toast.error(err?.message || 'Error inesperado al guardar.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async sendTestEmail() {
    const tpl = this.selectedTemplate();
    const recipient = this.testEmailRecipient().trim();

    if (!recipient) {
      this.toast.error('Ingresa un correo electrónico para la prueba.');
      return;
    }

    if (!tpl) return;

    this.isSendingTest.set(true);
    try {
      const storeName = this.tenantService.tenant()?.business_name || 'Mi Tienda';
      const sampleVariables: Record<string, string> = {
        store_name: storeName,
        customer_name: 'Camila Morales',
        order_number: 'TEST-001',
        order_total: '$185.000 COP',
        total: '$185.000 COP',
        order_url: 'https://tienda.com',
        carrier: 'Servientrega',
        tracking_number: 'TEST-TRACK-123',
        tracking_url: 'https://tienda.com',
        cancel_reason: 'Prueba del sistema',
        refund_amount: '$185.000 COP',
        refund_reason: 'Prueba de reembolso',
        invited_by_email: this.authService.user()?.email || 'admin@tienda.com',
        role: 'Colaborador',
        invite_link: 'https://venti.app',
      };

      const result = await this.emailService.sendEmail({
        to: recipient,
        subject: this.editSubject(),
        bodyHtml: this.editBodyHtml(),
        variables: sampleVariables,
      });

      if (result.success) {
        this.toast.success(`Correo de prueba enviado a ${recipient}. Revisa tu bandeja.`);
      } else {
        this.toast.error(result.error || 'Fallo al enviar correo de prueba.');
      }
    } catch (err: any) {
      this.toast.error(err?.message || 'Error al enviar prueba.');
    } finally {
      this.isSendingTest.set(false);
    }
  }
}
