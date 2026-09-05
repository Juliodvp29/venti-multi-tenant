import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmailService } from './email';
import { Supabase } from './supabase';
import { TenantService } from './tenant';

describe('EmailService', () => {
  let service: EmailService;
  let tenantId: WritableSignal<string | null>;
  let functionsInvokeMock: ReturnType<typeof vi.fn>;
  let fromMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tenantId = signal<string | null>('tenant-123');
    functionsInvokeMock = vi.fn().mockResolvedValue({
      data: { success: true, email_id: 'test-email-id' },
      error: null,
    });

    fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'template-1',
          template_key: 'order_confirmation',
          subject: 'Order {{order_number}} confirmed',
          body_html: '<h1>Hi {{customer_name}}</h1>',
        },
        error: null,
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    TestBed.configureTestingModule({
      providers: [
        EmailService,
        {
          provide: Supabase,
          useValue: {
            client: {
              functions: {
                invoke: functionsInvokeMock,
              },
              from: fromMock,
            },
          },
        },
        {
          provide: TenantService,
          useValue: {
            tenantId,
          },
        },
      ],
    });

    service = TestBed.inject(EmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should interpolate placeholders correctly', () => {
    const template = 'Hola {{ customer_name }}, tu orden {{order_number}} está lista';
    const result = service.replacePlaceholders(template, {
      customer_name: 'Ana',
      order_number: '#1001',
    });
    expect(result).toBe('Hola Ana, tu orden #1001 está lista');
  });

  it('should call send-email Edge Function with correct payload', async () => {
    const result = await service.sendOrderConfirmation({
      to: 'cliente@ejemplo.com',
      orderId: 'ord-123',
      orderNumber: 'VENTI-101',
      customerName: 'Ana Gomez',
      totalFormatted: '$50.000',
      storeName: 'Mi Tienda',
    });

    expect(result.success).toBe(true);
    expect(result.emailId).toBe('test-email-id');
    expect(functionsInvokeMock).toHaveBeenCalledWith('send-email', {
      body: {
        tenant_id: 'tenant-123',
        to_email: 'cliente@ejemplo.com',
        template_key: 'order_confirmation',
        variables: {
          order_number: 'VENTI-101',
          customer_name: 'Ana Gomez',
          total: '$50.000',
          store_name: 'Mi Tienda',
        },
        subject: undefined,
        body_html: undefined,
        body_text: undefined,
        from_name: undefined,
        related_customer_id: undefined,
        related_order_id: 'ord-123',
      },
    });
  });

  it('should handle shipping notification shortcut', async () => {
    await service.sendShippingNotification({
      to: 'cliente@ejemplo.com',
      orderId: 'ord-123',
      orderNumber: 'VENTI-101',
      customerName: 'Ana Gomez',
      carrier: 'Servientrega',
      trackingNumber: 'SER-999',
      trackingUrl: 'https://rastreo.com/999',
      storeName: 'Mi Tienda',
    });

    expect(functionsInvokeMock).toHaveBeenCalledWith('send-email', {
      body: expect.objectContaining({
        template_key: 'shipping_notification',
        variables: expect.objectContaining({
          tracking_number: 'SER-999',
          carrier: 'Servientrega',
        }),
      }),
    });
  });

  it('should return error if no tenant is selected', async () => {
    tenantId.set(null);
    const result = await service.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('No tenant selected');
    expect(functionsInvokeMock).not.toHaveBeenCalled();
  });
});
