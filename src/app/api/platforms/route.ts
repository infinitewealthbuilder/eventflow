/**
 * Platform Connections API
 * GET /api/platforms?organizationId=xxx - List connected platforms
 * DELETE /api/platforms?organizationId=xxx&platform=FACEBOOK - Disconnect platform
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  getConnectedPlatforms,
  deleteCredentials,
} from '@/lib/platforms/credentials-service';
import { PLATFORMS } from '@/lib/core/domain/platform';
import type { Platform } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to view this organization' },
        { status: 403 }
      );
    }

    // Get connected platforms
    const connections = await getConnectedPlatforms(organizationId);

    // Build full platform list with connection status
    const allPlatforms = Object.entries(PLATFORMS).map(([id, platform]) => {
      const connection = connections.find(
        (c) => c.platform.toLowerCase() === id.toLowerCase()
      );

      return {
        id,
        name: platform.name,
        icon: platform.icon,
        capabilities: platform.capabilities,
        isConnected: connection?.isConnected || false,
        accountName: connection?.accountName,
        accountId: connection?.accountId,
        expiresAt: connection?.expiresAt,
        lastValidated: connection?.lastValidated,
      };
    });

    return NextResponse.json({ platforms: allPlatforms });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const platform = searchParams.get('platform') as Platform | null;

    if (!organizationId || !platform) {
      return NextResponse.json(
        { error: 'Missing organizationId or platform' },
        { status: 400 }
      );
    }

    // Verify user has admin access to this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to manage this organization' },
        { status: 403 }
      );
    }

    // Delete credentials
    await deleteCredentials(organizationId, platform);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    );
  }
}
