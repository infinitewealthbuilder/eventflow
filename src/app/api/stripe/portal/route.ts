import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await req.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
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

    // Get subscription with Stripe customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
