/**
 * Facebook OAuth - Callback Handler
 * GET /api/oauth/facebook/callback
 *
 * Handles the redirect from Facebook after user authorization
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  getFacebookOAuthConfig,
  parseOAuthState,
  exchangeCodeForTokens,
} from '@/lib/platforms/oauth-config';
import { saveCredentials } from '@/lib/platforms/credentials-service';
import {
  getFacebookPages,
  exchangeForLongLivedToken,
} from '@/lib/adapters/facebook-adapter';

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

    // Handle OAuth errors from Facebook
    if (error) {
      console.error('Facebook OAuth error:', error, errorDescription);
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

    // Parse and validate state
    const stateData = parseOAuthState(state);
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
    const config = getFacebookOAuthConfig();
    const tokens = await exchangeCodeForTokens(config, code);

    // Exchange for long-lived token (60 days instead of 2 hours)
    const longLivedToken = await exchangeForLongLivedToken(
      tokens.accessToken,
      config.clientId,
      config.clientSecret
    );

    // Get user's Facebook Pages
    const pages = await getFacebookPages(longLivedToken);

    if (pages.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/connections?error=no_pages', request.url)
      );
    }

    // If user has multiple pages, redirect to page selection
    // For now, we'll use the first page (could add page selection UI later)
    const selectedPage = pages[0];

    // Get the page access token (different from user access token)
    const pageAccessToken = selectedPage.access_token;

    if (!pageAccessToken) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/connections?error=no_page_token', request.url)
      );
    }

    // Calculate expiration (long-lived tokens last ~60 days)
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    // Save credentials
    await saveCredentials({
      organizationId,
      platform: 'FACEBOOK_EVENTS',
      accessToken: pageAccessToken,
      expiresAt,
      platformPageId: selectedPage.id,
      metadata: {
        accountName: selectedPage.name,
        pageId: selectedPage.id,
        userAccessToken: longLivedToken, // Keep for potential future use
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/connections?success=facebook&page=${encodeURIComponent(selectedPage.name)}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
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
