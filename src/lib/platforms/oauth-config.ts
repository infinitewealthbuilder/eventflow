/**
 * EventFlow - OAuth Configuration
 * Platform-specific OAuth settings
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
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
 * Encodes organizationId and a random token
 */
export function generateOAuthState(organizationId: string): string {
  const randomToken = crypto.randomUUID();
  const state = {
    organizationId,
    token: randomToken,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

/**
 * Parse and validate OAuth state parameter
 * Returns null if invalid or expired (15 min timeout)
 */
export function parseOAuthState(state: string): { organizationId: string; token: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());

    // Check expiry (15 minutes)
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - decoded.timestamp > fifteenMinutes) {
      return null;
    }

    return {
      organizationId: decoded.organizationId,
      token: decoded.token,
    };
  } catch {
    return null;
  }
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
