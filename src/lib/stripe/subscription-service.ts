import { prisma } from "@/lib/db";
import { SUBSCRIPTION_TIERS, type SubscriptionTierKey } from "./config";

export interface SubscriptionLimits {
  platforms: number;
  eventsPerMonth: number;
  teamMembers: number;
  features: string[];
}

/**
 * Get subscription limits for an organization
 */
export async function getSubscriptionLimits(
  organizationId: string
): Promise<SubscriptionLimits> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  const tier = (subscription?.tier ?? "FREE") as SubscriptionTierKey;
  const config = SUBSCRIPTION_TIERS[tier];

  return {
    platforms: config.platforms,
    eventsPerMonth: config.eventsPerMonth,
    teamMembers: config.teamMembers,
    features: [...config.features],
  };
}

/**
 * Check if organization can create more events this month
 */
export async function canCreateEvent(organizationId: string): Promise<boolean> {
  const limits = await getSubscriptionLimits(organizationId);

  // Unlimited events
  if (limits.eventsPerMonth === -1) {
    return true;
  }

  // Count events created this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const eventCount = await prisma.event.count({
    where: {
      organizationId,
      createdAt: { gte: startOfMonth },
    },
  });

  return eventCount < limits.eventsPerMonth;
}

/**
 * Check if organization can connect more platforms
 */
export async function canConnectPlatform(
  organizationId: string
): Promise<boolean> {
  const limits = await getSubscriptionLimits(organizationId);

  // Count existing platform connections
  const connectionCount = await prisma.platformCredential.count({
    where: { organizationId },
  });

  return connectionCount < limits.platforms;
}

/**
 * Check if organization can add more team members
 */
export async function canAddTeamMember(organizationId: string): Promise<boolean> {
  const limits = await getSubscriptionLimits(organizationId);

  // Unlimited team members
  if (limits.teamMembers === -1) {
    return true;
  }

  const memberCount = await prisma.organizationMember.count({
    where: { organizationId },
  });

  return memberCount < limits.teamMembers;
}

/**
 * Get usage statistics for an organization
 */
export async function getUsageStats(organizationId: string) {
  const limits = await getSubscriptionLimits(organizationId);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [eventCount, platformCount, memberCount] = await Promise.all([
    prisma.event.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.platformCredential.count({
      where: { organizationId },
    }),
    prisma.organizationMember.count({
      where: { organizationId },
    }),
  ]);

  return {
    events: {
      used: eventCount,
      limit: limits.eventsPerMonth,
      percentage:
        limits.eventsPerMonth === -1
          ? 0
          : Math.round((eventCount / limits.eventsPerMonth) * 100),
    },
    platforms: {
      used: platformCount,
      limit: limits.platforms,
      percentage: Math.round((platformCount / limits.platforms) * 100),
    },
    teamMembers: {
      used: memberCount,
      limit: limits.teamMembers,
      percentage:
        limits.teamMembers === -1
          ? 0
          : Math.round((memberCount / limits.teamMembers) * 100),
    },
  };
}
