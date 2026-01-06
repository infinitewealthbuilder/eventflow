/**
 * EventFlow - Facebook Events Adapter
 * Creates and manages events via Facebook Graph API
 * Requires Facebook Page access token with pages_manage_posts permission
 */

import type { Event } from '../core/domain/event';
import type { PublicationResult } from '../core/domain/publication';
import {
  BasePlatformAdapter,
  type ConnectionResult,
  type TransformedEvent,
} from '../core/ports/platform-adapter';
import { PLATFORMS } from '../core/domain/platform';

const FACEBOOK_GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

interface FacebookCredentials {
  accessToken: string;
  pageId: string;
  pageName?: string;
}

interface FacebookEventResponse {
  id: string;
}

interface FacebookPageResponse {
  id: string;
  name: string;
  access_token?: string;
}

interface FacebookErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export class FacebookAdapter extends BasePlatformAdapter {
  readonly platformId = 'facebook' as const;

  private credentials: FacebookCredentials | null = null;
  private readonly capabilities = PLATFORMS.facebook.capabilities;

  /**
   * Check if we have valid credentials
   */
  async isConnected(): Promise<boolean> {
    if (!this.credentials?.accessToken || !this.credentials?.pageId) {
      return false;
    }

    try {
      // Validate token by fetching page info
      const response = await fetch(
        `${FACEBOOK_GRAPH_API_BASE}/${this.credentials.pageId}?fields=id,name&access_token=${this.credentials.accessToken}`
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return !!data.id;
    } catch {
      return false;
    }
  }

  /**
   * Connect with Facebook Page access token
   * credentials should include: accessToken, pageId
   */
  async connect(credentials: Record<string, string>): Promise<ConnectionResult> {
    const { accessToken, pageId } = credentials;

    if (!accessToken || !pageId) {
      return {
        success: false,
        platformId: this.platformId,
        error: 'Missing required credentials: accessToken and pageId',
      };
    }

    try {
      // Validate credentials by fetching page info
      const response = await fetch(
        `${FACEBOOK_GRAPH_API_BASE}/${pageId}?fields=id,name&access_token=${accessToken}`
      );

      if (!response.ok) {
        const errorData = (await response.json()) as FacebookErrorResponse;
        return {
          success: false,
          platformId: this.platformId,
          error: errorData.error?.message || 'Failed to validate Facebook credentials',
        };
      }

      const pageData = (await response.json()) as FacebookPageResponse;

      this.credentials = {
        accessToken,
        pageId,
        pageName: pageData.name,
      };

      return {
        success: true,
        platformId: this.platformId,
        accountName: pageData.name,
        accountId: pageData.id,
      };
    } catch (error) {
      return {
        success: false,
        platformId: this.platformId,
        error: error instanceof Error ? error.message : 'Unknown error connecting to Facebook',
      };
    }
  }

  /**
   * Clear stored credentials
   */
  async disconnect(): Promise<void> {
    this.credentials = null;
  }

  /**
   * Transform canonical event to Facebook-specific format
   */
  transformEvent(event: Event): TransformedEvent {
    // Facebook description with character limit
    let description = event.description;
    if (description.length > this.capabilities.maxDescriptionLength) {
      description = this.truncate(description, this.capabilities.maxDescriptionLength);
    }

    // Build location for Facebook
    const location: TransformedEvent['location'] = {
      isVirtual: event.location.isVirtual,
    };

    if (event.location.isVirtual && event.location.virtualUrl) {
      location.virtualUrl = event.location.virtualUrl;
      location.name = 'Online Event';
    } else {
      location.name = event.location.name;
      location.address = this.buildFacebookAddress(event.location);
    }

    return {
      platformId: this.platformId,
      title: this.truncate(event.title, this.capabilities.maxTitleLength),
      description,
      startTime: event.startTime,
      endTime: event.endTime,
      timezone: event.timezone,
      location,
      imageUrl: event.coverImageUrl,
      metadata: {
        eventId: event.id,
        category: event.category,
        isOnline: event.location.isVirtual,
        ticketUrl: event.registrationUrl,
      },
    };
  }

  /**
   * Create event on Facebook Page
   */
  async createEvent(event: TransformedEvent): Promise<PublicationResult> {
    if (!this.credentials) {
      return {
        success: false,
        publicationId: '',
        error: {
          code: 'NOT_CONNECTED',
          message: 'Not connected to Facebook. Call connect() first.',
          timestamp: new Date(),
          retryable: false,
        },
      };
    }

    try {
      // Build Facebook event payload
      const payload = this.buildEventPayload(event);

      const response = await fetch(
        `${FACEBOOK_GRAPH_API_BASE}/${this.credentials.pageId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...payload,
            access_token: this.credentials.accessToken,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as FacebookErrorResponse;
        return {
          success: false,
          publicationId: '',
          error: {
            code: `FB_${errorData.error?.code || 'UNKNOWN'}`,
            message: errorData.error?.message || 'Failed to create Facebook event',
            timestamp: new Date(),
            retryable: this.isRetryableError(errorData.error?.code),
          },
        };
      }

      const data = (await response.json()) as FacebookEventResponse;

      return {
        success: true,
        publicationId: `fb-${data.id}`,
        externalId: data.id,
        externalUrl: this.getEventUrl(data.id),
      };
    } catch (error) {
      return {
        success: false,
        publicationId: '',
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error creating Facebook event',
          timestamp: new Date(),
          retryable: true,
        },
      };
    }
  }

  /**
   * Update existing Facebook event
   */
  async updateEvent(externalId: string, event: TransformedEvent): Promise<PublicationResult> {
    if (!this.credentials) {
      return {
        success: false,
        publicationId: '',
        error: {
          code: 'NOT_CONNECTED',
          message: 'Not connected to Facebook. Call connect() first.',
          timestamp: new Date(),
          retryable: false,
        },
      };
    }

    try {
      const payload = this.buildEventPayload(event);

      const response = await fetch(
        `${FACEBOOK_GRAPH_API_BASE}/${externalId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...payload,
            access_token: this.credentials.accessToken,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as FacebookErrorResponse;
        return {
          success: false,
          publicationId: `fb-${externalId}`,
          error: {
            code: `FB_${errorData.error?.code || 'UNKNOWN'}`,
            message: errorData.error?.message || 'Failed to update Facebook event',
            timestamp: new Date(),
            retryable: this.isRetryableError(errorData.error?.code),
          },
        };
      }

      return {
        success: true,
        publicationId: `fb-${externalId}`,
        externalId,
        externalUrl: this.getEventUrl(externalId),
      };
    } catch (error) {
      return {
        success: false,
        publicationId: `fb-${externalId}`,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error updating Facebook event',
          timestamp: new Date(),
          retryable: true,
        },
      };
    }
  }

  /**
   * Delete Facebook event
   */
  async deleteEvent(externalId: string): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not connected to Facebook. Call connect() first.');
    }

    const response = await fetch(
      `${FACEBOOK_GRAPH_API_BASE}/${externalId}?access_token=${this.credentials.accessToken}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const errorData = (await response.json()) as FacebookErrorResponse;
      throw new Error(errorData.error?.message || 'Failed to delete Facebook event');
    }
  }

  /**
   * Get the public URL for a Facebook event
   */
  getEventUrl(externalId: string): string {
    return `https://www.facebook.com/events/${externalId}`;
  }

  /**
   * Build Facebook event API payload
   */
  private buildEventPayload(event: TransformedEvent): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      name: event.title,
      description: event.description,
      start_time: event.startTime.toISOString(),
      end_time: event.endTime.toISOString(),
      timezone_id: event.timezone,
    };

    // Handle location
    if (event.location) {
      if (event.location.isVirtual) {
        payload.is_online = true;
        if (event.location.virtualUrl) {
          payload.online_event_url = event.location.virtualUrl;
        }
      } else {
        payload.is_online = false;
        if (event.location.name) {
          payload.place = {
            name: event.location.name,
          };
        }
        if (event.location.address) {
          payload.location = event.location.address;
        }
      }
    }

    // Add cover image if provided
    if (event.imageUrl) {
      payload.cover = {
        source: event.imageUrl,
      };
    }

    // Add ticket URL if present
    const ticketUrl = event.metadata.ticketUrl as string | undefined;
    if (ticketUrl) {
      payload.ticket_uri = ticketUrl;
    }

    // Event category mapping
    const category = event.metadata.category as string | undefined;
    if (category) {
      payload.category = this.mapCategory(category);
    }

    return payload;
  }

  /**
   * Build formatted address string for Facebook
   */
  private buildFacebookAddress(location: Event['location']): string {
    const parts: string[] = [];

    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.postalCode) parts.push(location.postalCode);
    if (location.country) parts.push(location.country);

    return parts.join(', ');
  }

  /**
   * Map EventFlow categories to Facebook event categories
   */
  private mapCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'business': 'BUSINESS',
      'education': 'LEARNING',
      'entertainment': 'ENTERTAINMENT',
      'food': 'FOOD_AND_DRINK',
      'health': 'FITNESS_AND_WELLNESS',
      'music': 'MUSIC',
      'networking': 'NETWORKING',
      'sports': 'SPORTS_AND_FITNESS',
      'technology': 'TECH',
      'community': 'COMMUNITY',
      'art': 'ART',
      'film': 'FILM_AND_MEDIA',
      'gaming': 'GAMES',
      'literature': 'LITERATURE',
      'fashion': 'FASHION',
      'family': 'FAMILY',
      'holiday': 'HOLIDAY',
      'nightlife': 'NIGHTLIFE',
      'shopping': 'SHOPPING',
      'travel': 'TRAVEL',
    };

    return categoryMap[category.toLowerCase()] || 'OTHER';
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(errorCode?: number): boolean {
    // Rate limiting errors are retryable
    if (errorCode === 4 || errorCode === 17 || errorCode === 341) {
      return true;
    }
    // Temporary server errors
    if (errorCode === 1 || errorCode === 2) {
      return true;
    }
    return false;
  }
}

/**
 * Helper to get Facebook Pages user has access to
 * Used during OAuth flow to let user select which page to post events to
 */
export async function getFacebookPages(
  userAccessToken: string
): Promise<FacebookPageResponse[]> {
  const response = await fetch(
    `${FACEBOOK_GRAPH_API_BASE}/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Facebook pages');
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Exchange short-lived token for long-lived token
 * Required for maintaining connection without re-auth
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<string> {
  const response = await fetch(
    `${FACEBOOK_GRAPH_API_BASE}/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${shortLivedToken}`
  );

  if (!response.ok) {
    throw new Error('Failed to exchange Facebook token');
  }

  const data = await response.json();
  return data.access_token;
}
