/**
 * LinkedIn OAuth - Callback Handler
 * GET /api/oauth/linkedin/callback
 *
 * Handles the redirect from LinkedIn after user authorization
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  getLinkedInOAuthConfig,
  parseOAuthState,
  exchangeCodeForTokens,
} from '@/lib/platforms/oauth-config';
import { saveCredentials } from '@/lib/platforms/credentials-service';
import { getLinkedInOrganizations } from '@/lib/adapters/linkedin-adapter';

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

    // Handle OAuth errors from LinkedIn
    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);
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

    // Exchange code for tokens
    const config = getLinkedInOAuthConfig();
    const tokens = await exchangeCodeForTokens(config, code);

    // Get user's LinkedIn Organizations
    const organizations = await getLinkedInOrganizations(tokens.accessToken);

    if (organizations.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/connections?error=no_organizations', request.url)
      );
    }

    // If user has multiple organizations, use the first one
    // (could add organization selection UI later)
    const selectedOrg = organizations[0];

    // Calculate expiration from API response, fallback to 60 days
    const expiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    if (!tokens.expiresIn) {
      console.warn('LinkedIn API did not return expires_in, using 60-day fallback');
    }

    // Save credentials
    await saveCredentials({
      organizationId,
      platform: 'LINKEDIN_EVENTS',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      platformUserId: selectedOrg.id,
      metadata: {
        accountName: selectedOrg.localizedName,
        organizationId: selectedOrg.id,
        vanityName: selectedOrg.vanityName,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/connections?success=linkedin&org=${encodeURIComponent(selectedOrg.localizedName)}`,
        request.url
      )
    );
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
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
