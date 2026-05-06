import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth-kit/server";
import { prisma } from "@/lib/db";
import { getUsageStats } from "@/lib/stripe/subscription-service";

// GET /api/stripe/subscription?organizationId=xxx
export async function GET(req: Request) {
  try {
    const authResult = await getAuth();
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

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

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    const usage = await getUsageStats(organizationId);

    return NextResponse.json({
      subscription: subscription
        ? {
            tier: subscription.tier,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            stripeCustomerId: subscription.stripeCustomerId,
          }
        : {
            tier: "FREE",
            status: "ACTIVE",
            currentPeriodEnd: null,
            stripeCustomerId: null,
          },
      usage,
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
