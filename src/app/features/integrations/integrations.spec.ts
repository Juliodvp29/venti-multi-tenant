import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebhookEvent } from '@core/enums';
import { WebhooksService } from '@core/services/webhooks';
import { ToastService } from '@core/services/toast';
import { TenantService } from '@core/services/tenant';
import { ActivatedRoute } from '@angular/router';
import { Integrations } from './integrations';

import { EmailService } from '@core/services/email';
import { AuthService } from '@core/services/auth';
import { Supabase } from '@core/services/supabase';

describe('Integrations', () => {
  let component: Integrations;
  const webhooksService = {
    listEndpoints: vi.fn().mockResolvedValue([]),
    listDeliveries: vi.fn().mockResolvedValue([]),
    createEndpoint: vi.fn().mockResolvedValue({
      id: 'endpoint-1',
      tenant_id: 'tenant-1',
      url: 'https://example.com/webhook',
      secret_key: 'whsec_generated',
      subscribed_events: [WebhookEvent.OrderCreated],
      is_active: true,
    }),
    setEndpointActive: vi.fn(),
    deleteEndpoint: vi.fn(),
    retryDelivery: vi.fn(),
  };
  const toast = {
    success: vi.fn(),
    error: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true),
  };
  const tenantService = {
    tenantId: signal<string | null>(null),
    tenant: signal({ business_name: 'Test Store' }),
  };
  const emailService = {
    getTemplates: vi.fn().mockResolvedValue([]),
    updateTemplate: vi.fn().mockResolvedValue({ success: true }),
    sendEmail: vi.fn().mockResolvedValue({ success: true }),
    replacePlaceholders: vi.fn((str) => str),
  };
  const authService = {
    user: signal({ email: 'test@example.com' }),
  };
  const supabase = {
    client: { from: vi.fn() },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [Integrations],
      providers: [
        { provide: WebhooksService, useValue: webhooksService },
        { provide: ToastService, useValue: toast },
        { provide: TenantService, useValue: tenantService },
        { provide: EmailService, useValue: emailService },
        { provide: AuthService, useValue: authService },
        { provide: Supabase, useValue: supabase },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: vi.fn().mockReturnValue(null) } },
            queryParamMap: { subscribe: vi.fn() },
          },
        },
      ],
    }).compileComponents();

    component = TestBed.createComponent(Integrations).componentInstance;
  });

  it('starts with the webhook event selected and no secret exposed', () => {
    expect(component.selectedEvents()).toEqual([WebhookEvent.OrderCreated]);
    expect(component.revealedSecret()).toBeNull();
  });

  it('toggles event subscriptions', () => {
    component.toggleEvent(WebhookEvent.PaymentConfirmed);
    expect(component.selectedEvents()).toContain(WebhookEvent.PaymentConfirmed);

    component.toggleEvent(WebhookEvent.PaymentConfirmed);
    expect(component.selectedEvents()).not.toContain(WebhookEvent.PaymentConfirmed);
  });

  it('creates an endpoint and reveals its secret only after success', async () => {
    component.endpointUrl.set('https://example.com/webhook');

    await component.createEndpoint();

    expect(webhooksService.createEndpoint).toHaveBeenCalledWith('https://example.com/webhook', [
      WebhookEvent.OrderCreated,
    ]);
    expect(component.revealedSecret()).toBe('whsec_generated');
    expect(component.endpoints()).toHaveLength(1);
  });

  it('rejects insecure URLs before calling Supabase', async () => {
    component.endpointUrl.set('http://example.com/webhook');

    await component.createEndpoint();

    expect(webhooksService.createEndpoint).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Ingresa una URL HTTPS válida y selecciona al menos un evento',
    );
  });
});
