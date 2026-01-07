/**
 * EventFlow - OAuth Configuration
 * Platform-specific OAuth settings
 */

import { prisma } from '../db';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

/**
 * Validate required OAuth environment variables
 * Call this at startup to fail fast if credentials are missing
 */
export function validateOAuthEnvVars(): {
  facebook: boolean;
  linkedin: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let facebook = true;
  let linkedin = true;

  // Check Facebook
  if (!process.env.FACEBOOK_APP_ID) {
    errors.push('FACEBOOK_APP_ID is not configured');
    facebook = false;
  }
  if (!process.env.FACEBOOK_APP_SECRET) {
    errors.push('FACEBOOK_APP_SECRET is not configured');
    facebook = false;
  }

  // Check LinkedIn
  if (!process.env.LINKEDIN_CLIENT_ID) {
    errors.push('LINKEDIN_CLIENT_ID is not configured');
    linkedin = false;
  }
  if (!process.env.LINKEDIN_CLIENT_SECRET) {
    errors.push('LINKEDIN_CLIENT_SECRET is not configured');
    linkedin = false;
  }

  // Check base URL
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL is not configured (required for OAuth callbacks)');
  }

  return { facebook, linkedin, errors };
}

/**
 * Check if a specific platform's OAuth is configured
 */
export function isOAuthConfigured(platform: 'facebook' | 'linkedin'): boolean {
  const validation = validateOAuthEnvVars();
  return platform === 'facebook' ? validation.facebook : validation.linkedin;
}

/**
 * Get Facebook OAuth configuration
 */
export function getFacebookOAuthConfig(): OAuthConfig {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    clientId: process.env.FACEBOOK_APP_ID || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
    ],
    redirectUri: `${baseUrl}/api/oauth/facebook/callback`,
  };
}

/**
 * Get LinkedIn OAuth configuration
 */
export function getLinkedInOAuthConfig(): OAuthConfig {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: [
      'r_organization_social',
      'w_organization_social',
      'rw_organization_admin',
    ],
    redirectUri: `${baseUrl}/api/oauth/linkedin/callback`,
  };
}

/**
 * Generate OAuth state parameter (CSRF protection)
 * Creates a random token and stores it in the database for validation
 */
export async function generateOAuthState(
  organizationId: string,
  platform: 'facebook' | 'linkedin'
): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store in database for server-side validation
  await prisma.oAuthState.create({
    data: {
      token,
      organizationId,
      platform,
      expiresAt,
    },
  });

  // Return base64url encoded state
  const state = {
    token,
    organizationId,
  };
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

/**
 * Parse and validate OAuth state parameter
 * Validates against database record and deletes after use (one-time use)
 * Returns null if invalid, expired, or already used
 */
export async function parseOAuthState(
  state: string
): Promise<{ organizationId: string; token: string } | null> {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());

    if (!decoded.token || !decoded.organizationId) {
      return null;
    }

    // Find and delete the state record (atomic - prevents replay attacks)
    const stateRecord = await prisma.oAuthState.findUnique({
      where: { token: decoded.token },
    });

    if (!stateRecord) {
      console.error('OAuth state not found in database - possible CSRF attack');
      return null;
    }

    // Delete immediately (one-time use)
    await prisma.oAuthState.delete({
      where: { token: decoded.token },
    });

    // Check expiry
    if (stateRecord.expiresAt < new Date()) {
      console.error('OAuth state expired');
      return null;
    }

    // Verify organizationId matches
    if (stateRecord.organizationId !== decoded.organizationId) {
      console.error('OAuth state organizationId mismatch - possible tampering');
      return null;
    }

    return {
      organizationId: stateRecord.organizationId,
      token: stateRecord.token,
    };
  } catch (error) {
    console.error('Failed to parse OAuth state:', error);
    return null;
  }
}

/**
 * Clean up expired OAuth states (call periodically)
 */
export async function cleanupExpiredOAuthStates(): Promise<number> {
  const result = await prisma.oAuthState.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}

/**
 * Build OAuth authorization URL
 */
export function buildAuthorizationUrl(
  config: OAuthConfig,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });

  return `${config.authorizeUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  config: OAuthConfig,
  code: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}
