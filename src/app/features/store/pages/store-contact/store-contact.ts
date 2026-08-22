import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { StorefrontSection } from '@core/models';

@Component({
    selector: 'app-store-contact',
    imports: [CommonModule, FormsModule],
    templateUrl: './store-contact.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreContact {
    private readonly tenantService = inject(TenantService);
    private readonly toast = inject(ToastService);

    readonly branding = this.tenantService.branding;
    readonly pageConfig = computed(() => this.tenantService.getPageLayout('contact'));
    readonly sections = computed<StorefrontSection[]>(() => this.pageConfig()?.sections || []);

    readonly form = signal({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    readonly isSending = signal(false);

    asAny(val: any): any {
        return val;
    }

    async submitForm() {
        const { name, email, message } = this.form();
        if (!name.trim() || !email.trim() || !message.trim()) {
            this.toast.error('Por favor completa todos los campos requeridos.');
            return;
        }

        this.isSending.set(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            this.toast.success('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.');
            this.form.set({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch {
            this.toast.error('Error al enviar el mensaje. Intenta de nuevo más tarde.');
        } finally {
            this.isSending.set(false);
        }
    }
}
