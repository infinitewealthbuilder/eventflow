import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUsageStats } from '@/lib/stripe/subscription-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Fetch subscription data
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found for this organization' },
        { status: 404 }
      );
    }

    // Get usage stats
    const usageStats = await getUsageStats(organizationId);

    const responseData = {
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      usageStats,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
