export interface TenantBranding {
    logo_url: string | null;
    favicon_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    layout: 'modern' | 'classic' | 'minimal';
}

export interface TenantAddress {
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
}

export interface TenantSettings {
    [key: string]: unknown;
}

export interface TenantSettingItem {
    id: string;
    tenant_id: string;
    setting_key: string;
    setting_value: unknown;
    setting_type: 'string' | 'number' | 'boolean' | 'json';
    created_at: string;
    updated_at: string;
}

export interface TenantMember {
    id: string;
    tenant_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer'; // Using string union for now or import enum if available
    permissions: string[];
    is_active: boolean;
    invited_by?: string;
    invited_at: string;
    joined_at?: string;
    created_at: string;
    updated_at: string;
}

export type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'suspended' | 'expired' | 'trial';
export type TenantStatus = 'active' | 'suspended' | 'pending' | 'cancelled';

export interface Tenant {
    id: string;

    // Business Information
    business_name: string;
    slug: string;
    subdomain: string;
    custom_domain: string | null;

    // Owner Information
    owner_id: string;
    contact_email: string;
    contact_phone: string | null;

    // Subscription
    plan: SubscriptionPlan;
    plan_status: SubscriptionStatus;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;

    // Status & Settings
    status: TenantStatus;
    is_verified: boolean;

    // Branding
    logo_url: string | null;
    favicon_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    layout: 'modern' | 'classic' | 'minimal';

    // Business Address
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;

    // Settings JSON
    settings: TenantSettings;

    // Metadata
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface UpdateTenantDto {
    business_name?: string;
    contact_email?: string;
    contact_phone?: string | null;
    logo_url?: string | null;
    favicon_url?: string | null;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    font_family?: string;
    layout?: 'modern' | 'classic' | 'minimal';
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    settings?: TenantSettings;
}
