import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  private readonly _client: SupabaseClient<Database>;

  constructor() {
    this._client = createClient<Database>(
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

  get client(): SupabaseClient<Database> {
    return this._client;
  }

  get auth() {
    return this._client.auth;
  }

  get storage() {
    return this._client.storage;
  }

  /** Typed query builder shortcut */
  from<T = unknown>(table: string): any {
    return this._client.from(table as any);
  }
}
