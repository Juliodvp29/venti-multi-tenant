import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Supabase } from './supabase';
import { Router } from '@angular/router';
import { Nullable } from '@core/types';
import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  user: Nullable<User>;
  session: Nullable<Session>;
  loading: boolean;
  initialized: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(Supabase);
  private readonly router = inject(Router);

  private readonly _state = signal<AuthState>({
    user: null,
    session: null,
    loading: false,
    initialized: false,
  });

  readonly user = computed(() => this._state().user);
  readonly session = computed(() => this._state().session);
  readonly isAuthenticated = computed(() => !!this._state().session);
  readonly isLoading = computed(() => this._state().loading);
  readonly isInitialized = computed(() => this._state().initialized);
  readonly userEmail = computed(() => this._state().user?.email ?? null);
  readonly userId = computed(() => this._state().user?.id ?? null);
  readonly userMetadata = computed(() => this._state().user?.user_metadata ?? null);
  readonly userDisplayName = computed(() => {
    const user = this._state().user;
    if (!user) return '';
    const metadata = user.user_metadata;
    return (
      metadata?.['display_name'] ||
      metadata?.['full_name'] ||
      metadata?.['name'] ||
      metadata?.['user_name'] ||
      metadata?.['username'] ||
      user.email ||
      ''
    );
  });
  readonly isSuperAdmin = computed(
    () => this._state().user?.user_metadata?.['role'] === 'superadmin',
  );

  constructor() {
    this.initAuth();
  }

  private async initAuth(): Promise<void> {
    // Get current session on startup
    const { data } = await this.supabase.auth.getSession();
    this._state.update((s) => ({
      ...s,
      user: data.session?.user ?? null,
      session: data.session,
      initialized: true,
    }));

    // Listen to auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this._state.update((s) => ({
        ...s,
        user: session?.user ?? null,
        session,
        loading: false,
      }));
    });
  }

  async signInWithEmail(email: string, password: string) {
    this._state.update((s) => ({ ...s, loading: true }));
    const result = await this.supabase.auth.signInWithPassword({ email, password });
    this._state.update((s) => ({ ...s, loading: false }));
    return result;
  }

  async signUp(email: string, password: string, metadata: any = {}, redirectTo?: string) {
    this._state.update((s) => ({ ...s, loading: true }));
    const result = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: redirectTo,
      },
    });
    this._state.update((s) => ({ ...s, loading: false }));
    return result;
  }

  async signOut() {
    this._state.update((s) => ({ ...s, loading: true }));
    const result = await this.supabase.auth.signOut();
    this._state.update((s) => ({ ...s, loading: false }));
    return result;
  }

  async resetPassword(email: string) {
    // Use standard Supabase flow: user resets password on Supabase's hosted page,
    // then gets redirected to dashboard with session established
    return this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });
  }

  async updatePassword(newPassword: string) {
    return this.supabase.auth.updateUser({ password: newPassword });
  }

  async exchangeCodeForSession(code: string) {
    return this.supabase.auth.exchangeCodeForSession(code);
  }

  async updateProfile(data: { full_name?: string; avatar_url?: string }) {
    return this.supabase.auth.updateUser({ data });
  }

  async refreshSession() {
    return this.supabase.auth.refreshSession();
  }

  getAccessToken(): string | null {
    return this._state().session?.access_token ?? null;
  }

  async getOrCreateCustomer(tenantId: string): Promise<any> {
    const user = this.user();
    if (!user || !user.email) return null;

    const metadata = user.user_metadata || {};
    const firstName = metadata['first_name'] || metadata['full_name']?.split(' ')[0] || '';
    const lastName =
      metadata['last_name'] || metadata['full_name']?.split(' ').slice(1).join(' ') || '';

    const { data: existingByUser, error: fetchByUserError } = await this.supabase.client
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchByUserError && fetchByUserError.code !== 'PGRST116') {
      throw fetchByUserError;
    }

    if (existingByUser) {
      if (!existingByUser.email || existingByUser.email !== user.email) {
        const { data: updated, error: updateError } = await this.supabase.client
          .from('customers')
          .update({
            email: user.email,
            first_name: firstName || existingByUser.first_name || undefined,
            last_name: lastName || existingByUser.last_name || undefined,
          })
          .eq('id', existingByUser.id)
          .select('*')
          .single();

        if (updateError) throw updateError;
        return updated;
      }

      return existingByUser;
    }

    const { data: existingByEmail, error: fetchByEmailError } = await this.supabase.client
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('email', user.email)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchByEmailError && fetchByEmailError.code !== 'PGRST116') {
      throw fetchByEmailError;
    }

    if (existingByEmail) {
      const { data: updated, error: updateError } = await this.supabase.client
        .from('customers')
        .update({
          user_id: user.id,
          first_name: firstName || existingByEmail.first_name || undefined,
          last_name: lastName || existingByEmail.last_name || undefined,
        })
        .eq('id', existingByEmail.id)
        .select('*')
        .single();

      if (updateError) throw updateError;
      return updated;
    }

    const { data: created, error: createError } = await this.supabase.client
      .from('customers')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        email: user.email,
        first_name: firstName || null,
        last_name: lastName || null,
      })
      .select('*')
      .single();

    if (createError) throw createError;
    return created;
  }

  /**
   * A promise that resolves only when initAuth() has finished verifying the session.
   */
  async ensureInitialized(): Promise<void> {
    if (this.isInitialized()) return;

    return new Promise((resolve) => {
      const checkState = () => {
        if (this.isInitialized()) {
          resolve();
        } else {
          setTimeout(checkState, 50);
        }
      };
      checkState();
    });
  }
}
