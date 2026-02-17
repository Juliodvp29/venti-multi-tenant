import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  private readonly _client: SupabaseClient;

  constructor() {
    this._client = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  get client(): SupabaseClient {
    return this._client;
  }

  get auth() {
    return this._client.auth;
  }

  get storage() {
    return this._client.storage;
  }

  /** Typed query builder shortcut */
  from<T = unknown>(table: string) {
    return this._client.from<string, { Row: T }>(table);
  }
}
