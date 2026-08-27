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
    products: number | null;
    categories: number | null;
    members: number | null;
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
    features: [
      'Hasta 50 Productos',
      'Hasta 5 Categorías',
      '1 Miembro de equipo',
      'Soporte Comunitario',
    ],
    limitations: {
      products: 50,
      categories: 5,
      members: 1,
      custom_domain: false,
      transaction_fee: 2,
    },
  },

  {
    id: 'basic',
    name: 'Emprendedor',
    price: 23900,
    currency: 'COP',
    interval: 'month',
    description:
      'La opción perfecta para profesionalizar tu marca en crecimiento.',
    features: [
      'Hasta 500 Productos',
      'Hasta 25 Categorías',
      '3 Miembros de equipo',
      'Dominio Personalizado',
    ],
    isRecommended: true,
    limitations: {
      products: 500,
      categories: 25,
      members: 3,
      custom_domain: true,
      transaction_fee: 1,
    },
  },

  {
    id: 'professional',
    name: 'Negocio',
    price: 60900,
    currency: 'COP',
    interval: 'month',
    description: 'Optimizado para tiendas con mayor volumen de ventas.',
    features: [
      'Hasta 5.000 Productos',
      'Hasta 100 Categorías',
      '10 Miembros de equipo',
      'Dominio Personalizado',
      'Acceso a API',
      'Soporte Prioritario 24/7',
    ],
    limitations: {
      products: 5000,
      categories: 100,
      members: 10,
      custom_domain: true,
      transaction_fee: 0.5,
    },
  },

  {
    id: 'enterprise',
    name: 'Corporativo',
    price: 199900,
    currency: 'COP',
    interval: 'month',
    description:
      'Máximo rendimiento para operaciones de comercio electrónico a gran escala.',
    features: [
      'Productos Ilimitados',
      'Categorías Ilimitadas',
      'Miembros Ilimitados',
      'Infraestructura Dedicada',
      'Acceso completo a API',
      'Account Manager',
      'SLA Garantizado',
      '0% de comisión',
    ],
    limitations: {
      products: null,
      categories: null,
      members: null,
      custom_domain: true,
      transaction_fee: 0,
    },
  },
];