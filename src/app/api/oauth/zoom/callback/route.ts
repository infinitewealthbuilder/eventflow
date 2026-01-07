/**
 * Zoom OAuth - Callback Handler
 * GET /api/oauth/zoom/callback
 *
 * Handles the redirect from Zoom after user authorization
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  getZoomOAuthConfig,
  parseOAuthState,
  exchangeZoomCodeForTokens,
} from '@/lib/platforms/oauth-config';
import { saveCredentials } from '@/lib/platforms/credentials-service';

/**
 * Get Zoom user info to retrieve userId
 */
async function getZoomUser(accessToken: string): Promise<{
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
}> {
  const response = await fetch('https://api.zoom.us/v2/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Zoom user: ${error}`);
  }

  return response.json();
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(
        new URL('/sign-in?error=unauthorized', request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors from Zoom
    if (error) {
      console.error('Zoom OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings/connections?error=${encodeURIComponent(errorDescription || error)}`,
          request.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/connections?error=missing_params', request.url)
      );
    }

    // Parse and validate state (verifies against database, one-time use)
    const stateData = await parseOAuthState(state);
    if (!stateData) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/connections?error=invalid_state', request.url)
      );
    }

    const { organizationId } = stateData;

    // Verify user has access to this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/connections?error=not_authorized', request.url)
      );
    }

    // Exchange code for tokens (Zoom uses Basic Auth)
    const config = getZoomOAuthConfig();
    const tokens = await exchangeZoomCodeForTokens(config, code);

    // Get Zoom user info (needed for API calls)
    const zoomUser = await getZoomUser(tokens.accessToken);

    // Calculate expiration - Zoom tokens expire in 1 hour
    const expiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : new Date(Date.now() + 60 * 60 * 1000); // 1 hour fallback

    // Save credentials for ZOOM_MEETING
    // (Both meeting and webinar use the same credentials)
    await saveCredentials({
      organizationId,
      platform: 'ZOOM_MEETING',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      platformUserId: zoomUser.id,
      metadata: {
        email: zoomUser.email,
        displayName: zoomUser.display_name || `${zoomUser.first_name} ${zoomUser.last_name}`,
        firstName: zoomUser.first_name,
        lastName: zoomUser.last_name,
      },
    });

    // Also save for ZOOM_WEBINAR (same credentials)
    await saveCredentials({
      organizationId,
      platform: 'ZOOM_WEBINAR',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      platformUserId: zoomUser.id,
      metadata: {
        email: zoomUser.email,
        displayName: zoomUser.display_name || `${zoomUser.first_name} ${zoomUser.last_name}`,
        firstName: zoomUser.first_name,
        lastName: zoomUser.last_name,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/connections?success=zoom&account=${encodeURIComponent(zoomUser.email)}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Zoom OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/connections?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'callback_failed'
        )}`,
        request.url
      )
    );
  }
}
