import { PLAN_PRICES_XAF } from '@prezence/config';
import type { SubscriptionPlan } from '@prezence/types';

export type PaidPlan = Exclude<SubscriptionPlan, 'free'>;

export type PlanButtonVariant = 'blue' | 'green-gradient';

export interface PlanDefinition {
  name: PaidPlan;
  displayName: string;
  price: string;
  priceSuffix: string | null;
  billingNote: string | null;
  features: string[];
  highlight: boolean;
  buttonText: string;
  buttonVariant: PlanButtonVariant;
  showPaymentBadges: boolean;
}

function formatXAF(amount: number): string {
  return `XAF ${amount.toLocaleString('en-US')}`;
}

export const PLANS: PlanDefinition[] = [
  {
    name: 'starter',
    displayName: 'Free',
    price: formatXAF(PLAN_PRICES_XAF.starter),
    priceSuffix: null,
    billingNote: 'One-time payment',
    features: [
      '2 platform connections',
      'Basic AI interview & content generation',
      'Manual content approval',
      'Email support',
    ],
    highlight: false,
    buttonText: 'Get Started – Free',
    buttonVariant: 'blue',
    showPaymentBadges: true,
  },
  {
    name: 'professional',
    displayName: 'Professional',
    price: formatXAF(PLAN_PRICES_XAF.professional),
    priceSuffix: '/month',
    billingNote: 'Billed monthly',
    features: [
      'Up to 5 platform connections',
      'Advanced AI features',
      'Content scheduler',
      'Market-Fit Score tracking',
      'Priority support',
      'Custom branding',
    ],
    highlight: true,
    buttonText: 'Get Professional',
    buttonVariant: 'green-gradient',
    showPaymentBadges: true,
  },
  {
    name: 'elite',
    displayName: 'Elite',
    price: formatXAF(PLAN_PRICES_XAF.elite),
    priceSuffix: '/month',
    billingNote: 'Billed monthly',
    features: [
      'Unlimited platform connections',
      'Premium AI capabilities',
      'Advanced analytics',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
    ],
    highlight: false,
    buttonText: 'Get Elite',
    buttonVariant: 'blue',
    showPaymentBadges: true,
  },
];

export const PLAN_MODAL_DISPLAY: Record<
  PaidPlan,
  { label: string; price: string; priceColor: string }
> = {
  starter: {
    label: 'Prezence Free',
    price: `${formatXAF(PLAN_PRICES_XAF.starter)} (one-time)`,
    priceColor: '#1a1a2e',
  },
  professional: {
    label: 'Prezence Professional',
    price: `${formatXAF(PLAN_PRICES_XAF.professional)}/month`,
    priceColor: '#0f6e56',
  },
  elite: {
    label: 'Prezence Elite',
    price: `${formatXAF(PLAN_PRICES_XAF.elite)}/month`,
    priceColor: '#5b2d8e',
  },
};
