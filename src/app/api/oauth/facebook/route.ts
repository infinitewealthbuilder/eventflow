/**
 * Facebook OAuth - Authorization Start
 * GET /api/oauth/facebook?organizationId=xxx
 *
 * Initiates Facebook OAuth flow for connecting a Page
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  getFacebookOAuthConfig,
  generateOAuthState,
  buildAuthorizationUrl,
} from '@/lib/platforms/oauth-config';

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
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to manage this organization' },
        { status: 403 }
      );
    }

    // Get Facebook OAuth config
    const config = getFacebookOAuthConfig();

    if (!config.clientId) {
      return NextResponse.json(
        { error: 'Facebook OAuth not configured' },
        { status: 500 }
      );
    }

    // Generate state parameter for CSRF protection (stored in database)
    const state = await generateOAuthState(organizationId, 'facebook');

    // Build authorization URL and redirect
    const authUrl = buildAuthorizationUrl(config, state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Facebook OAuth start error:', error);
    return NextResponse.json(
      { error: 'Failed to start Facebook OAuth' },
      { status: 500 }
    );
  }
}
