import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, type SubscriptionTierKey } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// Valid subscription tiers for validation
const VALID_TIERS: SubscriptionTierKey[] = [
  "FREE",
  "BASIC",
  "PRO",
  "BUSINESS",
  "ENTERPRISE",
];

function isValidTier(tier: string): tier is SubscriptionTierKey {
  return VALID_TIERS.includes(tier as SubscriptionTierKey);
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Validate webhook secret is configured
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const tier = session.metadata?.tier;

  if (!organizationId || !tier) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // Validate tier before using
  if (!isValidTier(tier)) {
    console.error(`Invalid tier in checkout metadata: ${tier}`);
    return;
  }

  // Check if session.subscription exists (could be null for one-time payments)
  if (!session.subscription) {
    console.error("No subscription in checkout session - may be one-time payment");
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscriptionId,
    { expand: ["items.data"] }
  );

  // Safely extract period timestamps with fallbacks
  const firstItem = stripeSubscription.items?.data?.[0];
  const now = new Date();
  const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const periodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000)
    : now;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : defaultEnd;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!customerId) {
    console.error("No customer ID in checkout session");
    return;
  }

  await prisma.subscription.upsert({
    where: { organizationId },
    update: {
      tier,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
      status: "ACTIVE",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    create: {
      organizationId,
      tier,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
      status: "ACTIVE",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });

  console.log(`Subscription created for org ${organizationId}: ${tier}`);
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSub.id },
  });

  if (!existingSub) {
    console.error(`No subscription found for ${stripeSub.id}`);
    return;
  }

  const status = mapStripeStatus(stripeSub.status);

  // Safely extract period from first subscription item
  const firstItem = stripeSub.items?.data?.[0];
  const periodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000)
    : existingSub.currentPeriodStart;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : existingSub.currentPeriodEnd;

  await prisma.subscription.update({
    where: { id: existingSub.id },
    data: {
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });

  console.log(`Subscription ${stripeSub.id} updated to ${status}`);
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSub.id },
  });

  if (!existingSub) {
    console.error(`No subscription found for ${stripeSub.id}`);
    return;
  }

  await prisma.subscription.update({
    where: { id: existingSub.id },
    data: {
      tier: "FREE",
      status: "CANCELED",
      stripeSubscriptionId: null,
    },
  });

  console.log(`Subscription ${stripeSub.id} canceled, reverted to FREE`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // In Stripe SDK v20+, subscription is accessed via parent.subscription_details
  const subscriptionDetails = invoice.parent?.subscription_details;

  if (!subscriptionDetails?.subscription) {
    console.log("No subscription associated with failed invoice");
    return;
  }

  const subscriptionId =
    typeof subscriptionDetails.subscription === "string"
      ? subscriptionDetails.subscription
      : subscriptionDetails.subscription?.id;

  if (!subscriptionId) {
    console.log("Could not extract subscription ID from invoice");
    return;
  }

  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!existingSub) {
    console.error(`No subscription found for ${subscriptionId}`);
    return;
  }

  await prisma.subscription.update({
    where: { id: existingSub.id },
    data: { status: "PAST_DUE" },
  });

  console.log(`Payment failed for subscription ${subscriptionId}`);
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    case "trialing":
      return "TRIALING";
    default:
      return "ACTIVE";
  }
}
