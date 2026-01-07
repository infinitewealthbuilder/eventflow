/**
 * EventFlow - Organization Membership Utilities
 * Shared authorization logic for API routes
 */

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { OrganizationMember } from "@prisma/client";

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

export interface AuthResult {
  userId: string;
  member: OrganizationMember;
}

export interface AuthError {
  error: string;
  status: 401 | 403 | 404;
}

/**
 * Verify user is authenticated and is a member of the organization
 * Returns member data if authorized, or error details if not
 */
export async function verifyOrgMembership(
  organizationId: string,
  requiredRoles?: MemberRole[]
): Promise<AuthResult | AuthError> {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }

  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  });

  if (!member) {
    return { error: "Not a member of this organization", status: 403 };
  }

  // If specific roles are required, check membership role
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(member.role as MemberRole)) {
      return { error: "Insufficient permissions", status: 403 };
    }
  }

  return { userId, member };
}

/**
 * Verify user is authenticated and has access to an event
 * Checks organization membership via the event's organization
 */
export async function verifyEventAccess(
  eventId: string,
  requiredRoles?: MemberRole[]
): Promise<(AuthResult & { event: { organizationId: string } }) | AuthError> {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organization: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!event) {
    return { error: "Event not found", status: 404 };
  }

  if (event.organization.members.length === 0) {
    return { error: "Not authorized to access this event", status: 403 };
  }

  const member = event.organization.members[0];

  // If specific roles are required, check membership role
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(member.role as MemberRole)) {
      return { error: "Insufficient permissions", status: 403 };
    }
  }

  return {
    userId,
    member,
    event: { organizationId: event.organizationId },
  };
}

/**
 * Type guard to check if result is an error
 */
export function isAuthError(
  result: AuthResult | AuthError | (AuthResult & { event: { organizationId: string } })
): result is AuthError {
  return "status" in result;
}
