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
        description: 'Perfecto para comenzar y probar todas las funciones básicas.',
        features: ['Hasta 50 Productos', '5 Categorías', '2 Miembros de equipo', 'Soporte vía comunidad'],
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
        description: 'La opción más económica para lanzar tu marca profesional.',
        features: ['Hasta 1,000 Productos', 'Categorías ilimitadas', '5 Miembros de equipo', 'Dominio personalizado'],
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
        description: 'Optimizado para marcas de alto volumen y escala.',
        features: ['Hasta 25,000 Productos', 'Miembros ilimitados', 'Soporte prioritario 24/7', 'Acceso API'],
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
        description: 'Máximo rendimiento para operaciones corporativas.',
        features: ['Productos ilimitados', 'Infraestructura dedicada', 'Account Manager', 'SLA garantizado'],
        limitations: {
            products: 999999,
            categories: 999999,
            members: 999999,
            custom_domain: true,
            transaction_fee: 0
        }
    }
];
