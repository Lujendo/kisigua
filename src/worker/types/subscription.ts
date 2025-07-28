export type SubscriptionTier = 'free' | 'supporter' | 'premium';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number; // in cents
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId?: string;
  maxListings: number;
  priority: number; // for sorting
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckoutSessionRequest {
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface SubscriptionWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: 0,
    currency: 'eur',
    interval: 'month',
    features: [
      'Up to 5 listings per month',
      'Basic search functionality',
      'Community access',
      'Email support'
    ],
    maxListings: 5,
    priority: 1
  },
  {
    id: 'supporter',
    name: 'Supporter',
    tier: 'supporter',
    price: 999, // €9.99
    currency: 'eur',
    interval: 'month',
    features: [
      'Up to 20 listings per month',
      'Priority search results',
      'Advanced filters',
      'Community access',
      'Priority email support',
      'Support local communities'
    ],
    stripePriceId: 'price_supporter_monthly', // This would be set from Stripe dashboard
    maxListings: 20,
    priority: 2
  },
  {
    id: 'premium',
    name: 'Premium',
    tier: 'premium',
    price: 1999, // €19.99
    currency: 'eur',
    interval: 'month',
    features: [
      'Up to 50 listings per month',
      'Featured listings',
      'Analytics dashboard',
      'Advanced search & filters',
      'API access',
      'Priority support',
      'Custom branding options',
      'Bulk operations'
    ],
    stripePriceId: 'price_premium_monthly', // This would be set from Stripe dashboard
    maxListings: 50,
    priority: 3
  }
];

export const getPlanByTier = (tier: SubscriptionTier): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.tier === tier);
};

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const formatPrice = (price: number, currency: string = 'eur'): string => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price / 100);
};
