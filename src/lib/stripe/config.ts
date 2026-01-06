import Stripe from "stripe";

// Lazy-initialized Stripe client (only created when first accessed at runtime)
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: "Free",
    price: 0,
    priceId: null,
    platforms: 2,
    eventsPerMonth: 10,
    teamMembers: 1,
    features: ["Local Calendar export", "Basic event creation"],
  },
  BASIC: {
    name: "Basic",
    price: 999, // $9.99 in cents
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    platforms: 4,
    eventsPerMonth: 50,
    teamMembers: 3,
    features: [
      "Facebook Events",
      "LinkedIn Events",
      "Local Calendar",
      "Eventbrite",
      "Email support",
    ],
  },
  PRO: {
    name: "Pro",
    price: 1999, // $19.99 in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    platforms: 7,
    eventsPerMonth: 200,
    teamMembers: 10,
    features: [
      "All Basic features",
      "Meetup",
      "Instagram",
      "Twitter/X",
      "Scheduled publishing",
      "Priority support",
    ],
  },
  BUSINESS: {
    name: "Business",
    price: 4999, // $49.99 in cents
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    platforms: 9,
    eventsPerMonth: -1, // Unlimited
    teamMembers: 25,
    features: [
      "All Pro features",
      "Discord",
      "WhatsApp",
      "API access",
      "Custom branding",
      "Dedicated support",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: -1, // Custom pricing
    priceId: null,
    platforms: 9,
    eventsPerMonth: -1,
    teamMembers: -1,
    features: [
      "All Business features",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
    ],
  },
} as const;

export type SubscriptionTierKey = keyof typeof SUBSCRIPTION_TIERS;
