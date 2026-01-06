import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe, SUBSCRIPTION_TIERS, type SubscriptionTierKey } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier, organizationId } = await req.json();

    if (!tier || !organizationId) {
      return NextResponse.json(
        { error: "Missing tier or organizationId" },
        { status: 400 }
      );
    }

    // Verify user is a member of the organization
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
      return NextResponse.json(
        { error: "Not authorized to manage billing" },
        { status: 403 }
      );
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier as SubscriptionTierKey];

    if (!tierConfig || !tierConfig.priceId) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    let customerId = organization.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          organizationId,
          organizationName: organization.name,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
      metadata: {
        organizationId,
        tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
