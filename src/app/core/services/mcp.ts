import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { TenantService } from './tenant';
import { McpApiKey, CreateMcpApiKeyResult, McpAuditLog } from '@core/models';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class McpService {
  private readonly supabase = inject(Supabase);
  private readonly tenantService = inject(TenantService);

  readonly defaultScopes = [
    'read:orders',
    'read:products',
    'read:customers',
    'read:analytics',
    'read:inventory',
  ];

  getMcpEndpointUrl(): string {
    return `${environment.supabase.url}/functions/v1/mcp`;
  }

  async listKeys(): Promise<McpApiKey[]> {
    const tenantId = this.requireTenantId();
    const { data, error } = await (this.supabase.client.from as any)('mcp_api_keys')
      .select(
        'id, tenant_id, name, key_prefix, scopes, is_active, last_used_at, created_by, created_at, updated_at',
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as McpApiKey[];
  }

  async createKey(
    name: string,
    scopes: string[] = this.defaultScopes,
  ): Promise<CreateMcpApiKeyResult> {
    const tenantId = this.requireTenantId();
    const rawToken = this.generateToken();
    const keyHash = await this.hashToken(rawToken);
    const keyPrefix = `vnt_mcp_...${rawToken.slice(-4)}`;

    const { data, error } = await (this.supabase.client.from as any)('mcp_api_keys')
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      apiKey: data as McpApiKey,
      rawToken,
    };
  }

  async setKeyActive(keyId: string, isActive: boolean): Promise<void> {
    const tenantId = this.requireTenantId();
    const { error } = await (this.supabase.client.from as any)('mcp_api_keys')
      .update({ is_active: isActive })
      .eq('id', keyId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  async deleteKey(keyId: string): Promise<void> {
    const tenantId = this.requireTenantId();
    const { error } = await (this.supabase.client.from as any)('mcp_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  async listAuditLogs(limit = 20): Promise<McpAuditLog[]> {
    const tenantId = this.requireTenantId();
    const { data, error } = await (this.supabase.client.from as any)('mcp_audit_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as McpAuditLog[];
  }

  getOpenApiUrl(): string {
    return `${this.getMcpEndpointUrl()}/openapi.json`;
  }

  generateClaudeConfig(token: string): string {
    const config = {
      mcpServers: {
        venti: {
          command: 'node',
          args: [
            'C:\\Users\\julio\\Documents\\Dev\\Angular\\venti-multi-tenant\\scripts\\venti-mcp-cli.js',
            '--key',
            token,
          ],
        },
      },
    };
    return JSON.stringify(config, null, 2);
  }

  generateCursorConfig(token: string): string {
    const config = {
      mcpServers: {
        venti: {
          type: 'sse',
          url: `${this.getMcpEndpointUrl()}?key=${token}`,
        },
      },
    };
    return JSON.stringify(config, null, 2);
  }

  generateCodexConfig(token: string): string {
    const config = {
      mcpServers: {
        venti: {
          command: 'node',
          args: [
            'C:\\Users\\julio\\Documents\\Dev\\Angular\\venti-multi-tenant\\scripts\\venti-mcp-cli.js',
            '--key',
            token,
          ],
        },
      },
    };
    return JSON.stringify(config, null, 2);
  }

  generateGeminiConfig(token: string): string {
    const config = {
      mcpServers: {
        venti: {
          command: 'node',
          args: [
            'C:\\Users\\julio\\Documents\\Dev\\Angular\\venti-multi-tenant\\scripts\\venti-mcp-cli.js',
            '--key',
            token,
          ],
        },
      },
    };
    return JSON.stringify(config, null, 2);
  }

  generateGeminiPythonSnippet(token: string): string {
    return `# Integración con Google Gemini (@google/genai / requests)
import requests

VENTI_MCP_URL = "${this.getMcpEndpointUrl()}"
VENTI_KEY = "${token}"

headers = {"Authorization": f"Bearer {VENTI_KEY}"}
# Consulta directa de herramientas Venti
response = requests.post(f"{VENTI_MCP_URL}/tools/get_sales_overview", headers=headers, json={"period": "today"})
print("Ventas hoy:", response.json())`;
  }

  private requireTenantId(): string {
    const tenantId = this.tenantService.tenantId();
    if (!tenantId) throw new Error('No active tenant');
    return tenantId;
  }

  private generateToken(): string {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `vnt_mcp_live_${hex}`;
  }

  private async hashToken(token: string): Promise<string> {
    const data = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
