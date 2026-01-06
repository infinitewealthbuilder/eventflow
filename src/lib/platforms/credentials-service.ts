/**
 * EventFlow - Platform Credentials Service
 * Manages OAuth tokens and platform connections
 */

import { prisma } from '../db';
import type { Platform, Prisma } from '@prisma/client';

export interface PlatformConnection {
  platform: Platform;
  isConnected: boolean;
  accountName?: string;
  accountId?: string;
  expiresAt?: Date;
  lastValidated?: Date;
}

export interface SaveCredentialsInput {
  organizationId: string;
  platform: Platform;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  platformUserId?: string;
  platformPageId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get credentials for a specific platform
 */
export async function getCredentials(
  organizationId: string,
  platform: Platform
) {
  return prisma.platformCredential.findUnique({
    where: {
      organizationId_platform: {
        organizationId,
        platform,
      },
    },
  });
}

/**
 * Get all connected platforms for an organization
 */
export async function getConnectedPlatforms(
  organizationId: string
): Promise<PlatformConnection[]> {
  const credentials = await prisma.platformCredential.findMany({
    where: { organizationId },
  });

  // Map to PlatformConnection with connection status
  return credentials.map((cred) => ({
    platform: cred.platform,
    isConnected: cred.isValid,
    accountName: (cred.metadata as Record<string, string>)?.accountName,
    accountId: cred.platformPageId || cred.platformUserId || undefined,
    expiresAt: cred.expiresAt || undefined,
    lastValidated: cred.lastValidated,
  }));
}

/**
 * Save or update platform credentials
 */
export async function saveCredentials(input: SaveCredentialsInput) {
  const {
    organizationId,
    platform,
    accessToken,
    refreshToken,
    expiresAt,
    platformUserId,
    platformPageId,
    metadata,
  } = input;

  return prisma.platformCredential.upsert({
    where: {
      organizationId_platform: {
        organizationId,
        platform,
      },
    },
    create: {
      organizationId,
      platform,
      accessToken,
      refreshToken,
      expiresAt,
      platformUserId,
      platformPageId,
      metadata: (metadata || {}) as Prisma.InputJsonValue,
      isValid: true,
      lastValidated: new Date(),
    },
    update: {
      accessToken,
      refreshToken,
      expiresAt,
      platformUserId,
      platformPageId,
      metadata: (metadata || {}) as Prisma.InputJsonValue,
      isValid: true,
      lastValidated: new Date(),
    },
  });
}

/**
 * Mark credentials as invalid (e.g., after token refresh failure)
 */
export async function invalidateCredentials(
  organizationId: string,
  platform: Platform
) {
  return prisma.platformCredential.update({
    where: {
      organizationId_platform: {
        organizationId,
        platform,
      },
    },
    data: {
      isValid: false,
    },
  });
}

/**
 * Delete platform credentials (disconnect)
 */
export async function deleteCredentials(
  organizationId: string,
  platform: Platform
) {
  return prisma.platformCredential.delete({
    where: {
      organizationId_platform: {
        organizationId,
        platform,
      },
    },
  });
}

/**
 * Check if credentials need refresh (expires within 1 hour)
 */
export function needsRefresh(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;

  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  return expiresAt <= oneHourFromNow;
}

/**
 * Update the last validated timestamp
 */
export async function updateLastValidated(
  organizationId: string,
  platform: Platform
) {
  return prisma.platformCredential.update({
    where: {
      organizationId_platform: {
        organizationId,
        platform,
      },
    },
    data: {
      lastValidated: new Date(),
    },
  });
}
