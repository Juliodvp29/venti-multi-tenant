import { computed, inject, Injectable, signal } from '@angular/core';
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

  // ── State ────────────────────────────────────────────────
  private readonly _state = signal<AuthState>({
    user: null,
    session: null,
    loading: false,
    initialized: false,
  });

  // ── Computed selectors ───────────────────────────────────
  readonly user = computed(() => this._state().user);
  readonly session = computed(() => this._state().session);
  readonly isAuthenticated = computed(() => !!this._state().session);
  readonly isLoading = computed(() => this._state().loading);
  readonly isInitialized = computed(() => this._state().initialized);
  readonly userEmail = computed(() => this._state().user?.email ?? null);
  readonly userId = computed(() => this._state().user?.id ?? null);
  readonly userMetadata = computed(() => this._state().user?.user_metadata ?? null);
  readonly isSuperAdmin = computed(
    () => this._state().user?.user_metadata?.['role'] === 'superadmin'
  );

  constructor() {
    this.initAuth();
  }

  // ── Init ─────────────────────────────────────────────────

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

      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  // ── Methods ──────────────────────────────────────────────

  async signInWithEmail(email: string, password: string) {
    this._state.update((s) => ({ ...s, loading: true }));
    const result = await this.supabase.auth.signInWithPassword({ email, password });
    this._state.update((s) => ({ ...s, loading: false }));
    return result;
  }

  async signUp(email: string, password: string, businessName: string) {
    this._state.update((s) => ({ ...s, loading: true }));
    const result = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { business_name: businessName },
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
    return this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  }

  async updatePassword(newPassword: string) {
    return this.supabase.auth.updateUser({ password: newPassword });
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
}
