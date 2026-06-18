import type { SubscriptionPlan } from '@prezence/types';

export type PaidPlan = Exclude<SubscriptionPlan, 'free'>;

export type PlanButtonVariant = 'blue' | 'green-gradient';

export interface PlanDefinition {
  name: PaidPlan;
  displayName: string;
  price: string;
  priceSuffix: string | null;
  features: string[];
  highlight: boolean;
  buttonText: string;
  buttonVariant: PlanButtonVariant;
  showPaymentBadges: boolean;
}

/** Plan copy and display prices from Figma Subscription screen (254:8060) */
export const PLANS: PlanDefinition[] = [
  {
    name: 'starter',
    displayName: 'Starter',
    price: 'Free',
    priceSuffix: null,
    features: [
      '1 platform connection',
      'Basic AI interview',
      'Manual content approval',
      'Email support',
    ],
    highlight: false,
    buttonText: 'Upgrade to Starter',
    buttonVariant: 'blue',
    showPaymentBadges: false,
  },
  {
    name: 'professional',
    displayName: 'Professional',
    price: 'XAF 15,000',
    priceSuffix: '/month',
    features: [
      'Up to 5 platform connections',
      'Advanced AI features',
      'Content scheduler',
      'Market-Fit Score tracking',
      'Priority support',
      'Custom branding',
    ],
    highlight: true,
    buttonText: 'Start 14-day free trial',
    buttonVariant: 'green-gradient',
    showPaymentBadges: true,
  },
  {
    name: 'elite',
    displayName: 'Elite',
    price: 'XAF 35,000',
    priceSuffix: '/month',
    features: [
      'Unlimited platforms',
      'Premium AI capabilities',
      'Advanced analytics',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
    ],
    highlight: false,
    buttonText: 'Upgrade to Elite',
    buttonVariant: 'blue',
    showPaymentBadges: true,
  },
];

export const PLAN_MODAL_DISPLAY: Record<
  PaidPlan,
  { label: string; price: string; priceColor: string }
> = {
  starter: { label: 'Prezence Starter', price: 'Free', priceColor: '#1a1a2e' },
  professional: {
    label: 'Prezence Professional',
    price: 'XAF 15,000',
    priceColor: '#0f6e56',
  },
  elite: { label: 'Prezence Elite', price: 'XAF 35,000', priceColor: '#5b2d8e' },
};
