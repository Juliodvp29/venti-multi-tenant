import { BaseModel } from './index';
import { SubscriptionPlan, SubscriptionStatus } from './tenant.model';

export interface BillingPlan {
    id: SubscriptionPlan;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    description: string;
    features: string[];
    isRecommended?: boolean;
    limitations: {
        products: number;
        categories: number;
        members: number;
        custom_domain: boolean;
        transaction_fee: number; // percentage
        [key: string]: any;
    };
}

export interface SubscriptionHistoryEntry extends BaseModel {
    tenant_id: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    amount: number;
    currency: string;
    billing_period_start: string;
    billing_period_end: string;
    payment_method?: string;
    payment_id?: string;
    metadata?: Record<string, any>;
}

export const BILLING_PLANS: BillingPlan[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        description: 'Perfect to start and test all basic functions.',
        features: ['Up to 50 Products', '5 Categories', '2 Team members', 'Community support'],
        limitations: {
            products: 50,
            categories: 5,
            members: 2,
            custom_domain: false,
            transaction_fee: 5
        }
    },
    {
        id: 'basic',
        name: 'Basic',
        price: 15,
        currency: 'USD',
        interval: 'month',
        description: 'The most affordable option to launch your professional brand.',
        features: ['Up to 1,000 Products', 'Unlimited Categories', '5 Team members', 'Custom domain'],
        isRecommended: true,
        limitations: {
            products: 1000,
            categories: 9999,
            members: 5,
            custom_domain: true,
            transaction_fee: 2
        }
    },
    {
        id: 'professional',
        name: 'Pro',
        price: 79,
        currency: 'USD',
        interval: 'month',
        description: 'Optimized for high volume and scaling brands.',
        features: ['Up to 25,000 Products', 'Unlimited members', '24/7 Priority support', 'API access'],
        limitations: {
            products: 25000,
            categories: 9999,
            members: 9999,
            custom_domain: true,
            transaction_fee: 0.5
        }
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 299,
        currency: 'USD',
        interval: 'month',
        description: 'Maximum performance for corporate operations.',
        features: ['Unlimited products', 'Dedicated infrastructure', 'Account Manager', 'Guaranteed SLA'],
        limitations: {
            products: 999999,
            categories: 999999,
            members: 999999,
            custom_domain: true,
            transaction_fee: 0
        }
    }
];
