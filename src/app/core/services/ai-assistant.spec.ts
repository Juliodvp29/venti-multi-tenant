import { TestBed } from '@angular/core/testing';
import { AiAssistantService } from './ai-assistant';
import { Supabase } from './supabase';
import { TenantService } from './tenant';

// El entorno de tests no provee localStorage: stub en memoria.
const memoryStorage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => void memoryStorage.set(key, value),
  removeItem: (key: string) => void memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
});

describe('AiAssistantService', () => {
  let service: AiAssistantService;
  let rpc: ReturnType<typeof vi.fn>;
  let invoke: ReturnType<typeof vi.fn>;
  const tenantId = vi.fn((): string | null => 'tenant-1');

  beforeEach(() => {
    localStorage.clear();
    rpc = vi.fn();
    invoke = vi.fn();
    tenantId.mockReset();
    tenantId.mockReturnValue('tenant-1');

    TestBed.configureTestingModule({
      providers: [
        AiAssistantService,
        { provide: Supabase, useValue: { client: { rpc, functions: { invoke } } } },
        { provide: TenantService, useValue: { tenantId } },
      ],
    });

    service = TestBed.inject(AiAssistantService);
  });

  it('clears the conversation from the signal and local storage', () => {
    service.messages.set([
      { role: 'user', content: 'Consulta anterior', timestamp: new Date() },
      { role: 'model', content: 'Respuesta anterior', timestamp: new Date() },
    ]);
    localStorage.setItem('venti_ai_chat_history', 'conversation');

    service.clearConversation();

    expect(service.messages()).toHaveLength(1);
    expect(service.messages()[0].role).toBe('model');
    expect(service.messages()[0].content).toContain('Hola');
    expect(localStorage.getItem('venti_ai_chat_history')).toBeNull();
  });

  it('handles /CLEAR locally without requiring a tenant or consuming quota', async () => {
    tenantId.mockReturnValueOnce(null);
    service.messages.set([{ role: 'user', content: 'Consulta anterior', timestamp: new Date() }]);

    await service.sendMessage('  /CLEAR  ');

    expect(rpc).not.toHaveBeenCalled();
    expect(service.messages()).toHaveLength(1);
    expect(service.messages()[0].content).toContain('Hola');
  });

  it('blocks the message when the daily AI limit is reached', async () => {
    rpc.mockResolvedValueOnce({
      data: { allowed: false, reason: 'daily_limit_reached', used: 5, limit: 5 },
      error: null,
    });

    await service.sendMessage('¿Cómo fueron mis ventas?');

    expect(rpc).toHaveBeenCalledWith('consume_ai_request', { p_tenant_id: 'tenant-1' });
    expect(service.messages()[service.messages().length - 1].content).toContain(
      'límite diario de Venti AI',
    );
    expect(service.isLoading()).toBe(false);
  });

  it('answers via the ai-chat Edge Function without touching the Gemini key', async () => {
    rpc.mockResolvedValueOnce({ data: { allowed: true }, error: null });
    invoke.mockResolvedValueOnce({
      data: { candidates: [{ content: { parts: [{ text: 'Vendiste 10 órdenes hoy.' }] } }] },
      error: null,
    });

    await service.sendMessage('¿Cómo fueron mis ventas?');

    expect(invoke).toHaveBeenCalledWith(
      'ai-chat',
      expect.objectContaining({ body: expect.objectContaining({ tenant_id: 'tenant-1' }) }),
    );
    expect(service.messages()[service.messages().length - 1].content).toContain(
      'Vendiste 10 órdenes hoy.',
    );
    expect(service.isLoading()).toBe(false);
  });
});
