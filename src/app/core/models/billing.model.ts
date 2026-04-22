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
        transaction_fee: number;
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
        name: 'Gratis',
        price: 0,
        currency: 'COP',
        interval: 'month',
        description: 'Todo lo que necesitas para lanzar tu primera tienda.',
        features: ['Hasta 50 Productos', 'Categorías Básicas', '1 Miembro de equipo', 'Soporte Comunitario'],
        limitations: {
            products: 50,
            categories: 5,
            members: 1,
            custom_domain: false,
            transaction_fee: 2
        }
    },
    {
        id: 'basic',
        name: 'Emprendedor',
        price: 23900,
        currency: 'COP',
        interval: 'month',
        description: 'La opción perfecta para profesionalizar tu marca en crecimiento.',
        features: ['Hasta 1,000 Productos', 'Categorías Ilimitadas', '3 Miembros de equipo', 'Dominio Personalizado'],
        isRecommended: true,
        limitations: {
            products: 1000,
            categories: 9999,
            members: 3,
            custom_domain: true,
            transaction_fee: 1
        }
    },
    {
        id: 'professional',
        name: 'Negocio',
        price: 60900,
        currency: 'COP',
        interval: 'month',
        description: 'Optimizado para alto volumen y marcas en escala.',
        features: ['Hasta 25,000 Productos', 'Miembros ilimitados', 'Soporte Prioritario 24/7', 'Acceso a API'],
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
        name: 'Corporativo',
        price: 199900,
        currency: 'COP',
        interval: 'month',
        description: 'Máximo rendimiento para operaciones a gran escala.',
        features: ['Productos Ilimitados', 'Infraestructura Dedicada', 'Account Manager', 'SLA Garantizado'],
        limitations: {
            products: 999999,
            categories: 999999,
            members: 999999,
            custom_domain: true,
            transaction_fee: 0
        }
    }
];

