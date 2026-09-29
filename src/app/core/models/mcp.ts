import { BaseModel } from './index';

export interface McpApiKey extends BaseModel {
  tenant_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_by: string | null;
}

export interface CreateMcpApiKeyResult {
  apiKey: McpApiKey;
  rawToken: string;
}

export interface McpAuditLog {
  id: string;
  tenant_id: string;
  api_key_id: string | null;
  tool_name: string;
  params: Record<string, unknown>;
  status: 'success' | 'error';
  execution_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}
