import { ThemePresetId } from './theme.model';
import { StorefrontSection } from './storefront.model';

export interface AiStoreWizardInput {
  businessName: string;
  industry: string;
  customIndustryDetail?: string;
  targetAudience: string;
  valueProposition: string;
  stylePreference: ThemePresetId;
  tone: string;
}

export interface SuggestedCategory {
  name: string;
  icon: string;
  description?: string;
}

export interface AiGeneratedStore {
  business_description: string;
  tagline: string;
  suggested_theme_id: ThemePresetId;
  typography_pairing_id: string;
  branding_colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    header: string;
    footer: string;
  };
  storefront_sections: StorefrontSection[];
  suggested_categories: SuggestedCategory[];
}
