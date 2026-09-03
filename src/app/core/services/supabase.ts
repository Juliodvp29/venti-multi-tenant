import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@env/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly _client: SupabaseClient<Database>;

  constructor() {
    this._client = createClient<Database>(environment.supabase.url, environment.supabase.anonKey, {
      auth: {
        autoRefreshToken: this.isBrowser,
        persistSession: this.isBrowser,
        detectSessionInUrl: this.isBrowser,
      },
    });
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
  from<T extends string & (keyof Database['public']['Tables'] | keyof Database['public']['Views'])>(
    table: T,
  ) {
    return (this._client.from as (table: string) => ReturnType<SupabaseClient<Database>['from']>)(
      table,
    );
  }
}
