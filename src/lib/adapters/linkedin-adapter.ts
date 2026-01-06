/**
 * EventFlow - LinkedIn Events Adapter
 * Creates and manages events via LinkedIn Marketing API
 * Requires LinkedIn Organization access with w_organization_social permission
 */

import type { Event } from '../core/domain/event';
import type { PublicationResult } from '../core/domain/publication';
import {
  BasePlatformAdapter,
  type ConnectionResult,
  type TransformedEvent,
} from '../core/ports/platform-adapter';
import { PLATFORMS } from '../core/domain/platform';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_REST_API_BASE = 'https://api.linkedin.com/rest';

interface LinkedInCredentials {
  accessToken: string;
  organizationId: string;
  organizationName?: string;
}

interface LinkedInEventResponse {
  id: string;
  eventUrl?: string;
}

interface LinkedInOrganization {
  id: string;
  localizedName: string;
  vanityName?: string;
}

interface LinkedInErrorResponse {
  message: string;
  status: number;
  serviceErrorCode?: number;
}

export class LinkedInAdapter extends BasePlatformAdapter {
  readonly platformId = 'linkedin' as const;

  private credentials: LinkedInCredentials | null = null;
  private readonly capabilities = PLATFORMS.linkedin.capabilities;

  /**
   * Check if we have valid credentials
   */
  async isConnected(): Promise<boolean> {
    if (!this.credentials?.accessToken || !this.credentials?.organizationId) {
      return false;
    }

    try {
      // Validate token by fetching organization info
      const response = await fetch(
        `${LINKEDIN_API_BASE}/organizations/${this.credentials.organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Connect with LinkedIn organization access token
   * credentials should include: accessToken, organizationId
   */
  async connect(credentials: Record<string, string>): Promise<ConnectionResult> {
    const { accessToken, organizationId } = credentials;

    if (!accessToken || !organizationId) {
      return {
        success: false,
        platformId: this.platformId,
        error: 'Missing required credentials: accessToken and organizationId',
      };
    }

    try {
      // Validate credentials by fetching organization info
      const response = await fetch(
        `${LINKEDIN_API_BASE}/organizations/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as LinkedInErrorResponse;
        return {
          success: false,
          platformId: this.platformId,
          error: errorData.message || 'Failed to validate LinkedIn credentials',
        };
      }

      const orgData = (await response.json()) as LinkedInOrganization;

      this.credentials = {
        accessToken,
        organizationId,
        organizationName: orgData.localizedName,
      };

      return {
        success: true,
        platformId: this.platformId,
        accountName: orgData.localizedName,
        accountId: organizationId,
      };
    } catch (error) {
      return {
        success: false,
        platformId: this.platformId,
        error: error instanceof Error ? error.message : 'Unknown error connecting to LinkedIn',
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
   * Transform canonical event to LinkedIn-specific format
   */
  transformEvent(event: Event): TransformedEvent {
    // LinkedIn has strict description limits
    let description = event.description;
    if (description.length > this.capabilities.maxDescriptionLength) {
      description = this.truncate(description, this.capabilities.maxDescriptionLength);
    }

    // LinkedIn prefers professional, concise content
    description = this.professionalizeDescription(description);

    const location: TransformedEvent['location'] = {
      isVirtual: event.location.isVirtual,
    };

    if (event.location.isVirtual && event.location.virtualUrl) {
      location.virtualUrl = event.location.virtualUrl;
      location.name = 'Virtual Event';
    } else {
      location.name = event.location.name;
      location.address = this.buildLinkedInAddress(event.location);
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
        organizationId: this.credentials?.organizationId,
        registrationUrl: event.registrationUrl,
        category: event.category,
      },
    };
  }

  /**
   * Create event on LinkedIn Organization
   */
  async createEvent(event: TransformedEvent): Promise<PublicationResult> {
    if (!this.credentials) {
      return {
        success: false,
        publicationId: '',
        error: {
          code: 'NOT_CONNECTED',
          message: 'Not connected to LinkedIn. Call connect() first.',
          timestamp: new Date(),
          retryable: false,
        },
      };
    }

    try {
      const payload = this.buildEventPayload(event);

      const response = await fetch(
        `${LINKEDIN_REST_API_BASE}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': '202401',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as LinkedInErrorResponse;
        return {
          success: false,
          publicationId: '',
          error: {
            code: `LI_${errorData.status || 'UNKNOWN'}`,
            message: errorData.message || 'Failed to create LinkedIn event',
            timestamp: new Date(),
            retryable: this.isRetryableError(response.status),
          },
        };
      }

      // LinkedIn returns the event ID in the x-restli-id header or response body
      const eventId = response.headers.get('x-restli-id') ||
        (await response.json() as LinkedInEventResponse).id;

      return {
        success: true,
        publicationId: `li-${eventId}`,
        externalId: eventId,
        externalUrl: this.getEventUrl(eventId),
      };
    } catch (error) {
      return {
        success: false,
        publicationId: '',
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error creating LinkedIn event',
          timestamp: new Date(),
          retryable: true,
        },
      };
    }
  }

  /**
   * Update existing LinkedIn event
   */
  async updateEvent(externalId: string, event: TransformedEvent): Promise<PublicationResult> {
    if (!this.credentials) {
      return {
        success: false,
        publicationId: '',
        error: {
          code: 'NOT_CONNECTED',
          message: 'Not connected to LinkedIn. Call connect() first.',
          timestamp: new Date(),
          retryable: false,
        },
      };
    }

    try {
      const payload = this.buildEventPayload(event);

      // LinkedIn uses POST with x-http-method-override for updates
      const response = await fetch(
        `${LINKEDIN_REST_API_BASE}/events/${externalId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
            'X-HTTP-Method-Override': 'PATCH',
            'LinkedIn-Version': '202401',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as LinkedInErrorResponse;
        return {
          success: false,
          publicationId: `li-${externalId}`,
          error: {
            code: `LI_${errorData.status || 'UNKNOWN'}`,
            message: errorData.message || 'Failed to update LinkedIn event',
            timestamp: new Date(),
            retryable: this.isRetryableError(response.status),
          },
        };
      }

      return {
        success: true,
        publicationId: `li-${externalId}`,
        externalId,
        externalUrl: this.getEventUrl(externalId),
      };
    } catch (error) {
      return {
        success: false,
        publicationId: `li-${externalId}`,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error updating LinkedIn event',
          timestamp: new Date(),
          retryable: true,
        },
      };
    }
  }

  /**
   * Delete LinkedIn event
   */
  async deleteEvent(externalId: string): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not connected to LinkedIn. Call connect() first.');
    }

    const response = await fetch(
      `${LINKEDIN_REST_API_BASE}/events/${externalId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202401',
        },
      }
    );

    if (!response.ok) {
      const errorData = (await response.json()) as LinkedInErrorResponse;
      throw new Error(errorData.message || 'Failed to delete LinkedIn event');
    }
  }

  /**
   * Get the public URL for a LinkedIn event
   */
  getEventUrl(externalId: string): string {
    // LinkedIn event URLs follow this pattern
    return `https://www.linkedin.com/events/${externalId}`;
  }

  /**
   * Build LinkedIn event API payload
   */
  private buildEventPayload(event: TransformedEvent): Record<string, unknown> {
    const organizationUrn = `urn:li:organization:${this.credentials?.organizationId}`;

    const payload: Record<string, unknown> = {
      name: event.title,
      description: event.description,
      organizerInfo: {
        organizerType: 'ORGANIZATION',
        organizer: organizationUrn,
      },
      eventTime: {
        startAt: {
          // LinkedIn uses Unix timestamp in milliseconds
          dateTime: event.startTime.getTime(),
          timezone: event.timezone,
        },
        endAt: {
          dateTime: event.endTime.getTime(),
          timezone: event.timezone,
        },
      },
      visibility: 'PUBLIC',
    };

    // Handle location
    if (event.location) {
      if (event.location.isVirtual) {
        payload.eventFormat = 'ONLINE';
        if (event.location.virtualUrl) {
          payload.onlineContent = {
            url: event.location.virtualUrl,
          };
        }
      } else {
        payload.eventFormat = 'IN_PERSON';
        if (event.location.address) {
          payload.location = {
            address: event.location.address,
          };
        }
      }
    }

    // Add cover image if provided
    if (event.imageUrl) {
      // LinkedIn requires images to be uploaded first
      // For now, store the URL in metadata for later upload
      payload.coverImage = event.imageUrl;
    }

    // Add registration URL if present
    const registrationUrl = event.metadata.registrationUrl as string | undefined;
    if (registrationUrl) {
      payload.externalRegistrationUrl = registrationUrl;
    }

    return payload;
  }

  /**
   * Build formatted address string for LinkedIn
   */
  private buildLinkedInAddress(location: Event['location']): string {
    const parts: string[] = [];

    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);

    return parts.join(', ');
  }

  /**
   * Clean up description for LinkedIn's professional context
   */
  private professionalizeDescription(description: string): string {
    // Remove excessive emoji (keep max 2)
    const emojiRegex = /[\p{Emoji}]/gu;
    const emojis = description.match(emojiRegex) || [];
    if (emojis.length > 2) {
      let emojiCount = 0;
      description = description.replace(emojiRegex, (match) => {
        emojiCount++;
        return emojiCount <= 2 ? match : '';
      });
    }

    // Clean up excessive newlines
    description = description.replace(/\n{3,}/g, '\n\n');

    return description.trim();
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(statusCode: number): boolean {
    // Rate limiting
    if (statusCode === 429) return true;
    // Server errors
    if (statusCode >= 500 && statusCode < 600) return true;
    return false;
  }
}

/**
 * Helper to get LinkedIn Organizations user has access to
 * Used during OAuth flow to let user select which organization to post events to
 */
export async function getLinkedInOrganizations(
  accessToken: string
): Promise<LinkedInOrganization[]> {
  const response = await fetch(
    `${LINKEDIN_API_BASE}/organizationAcls?q=roleAssignee&projection=(elements*(organization~(id,localizedName,vanityName)))`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch LinkedIn organizations');
  }

  const data = await response.json();

  // Extract organizations from the projection
  return (data.elements || []).map((element: Record<string, unknown>) => {
    const org = element['organization~'] as LinkedInOrganization;
    return {
      id: org.id,
      localizedName: org.localizedName,
      vanityName: org.vanityName,
    };
  });
}

/**
 * Upload image to LinkedIn for use as event cover
 * LinkedIn requires images be uploaded before referencing in events
 */
export async function uploadLinkedInImage(
  accessToken: string,
  organizationId: string,
  imageUrl: string
): Promise<string> {
  // Step 1: Register the image upload
  const registerResponse = await fetch(
    `${LINKEDIN_REST_API_BASE}/images?action=initializeUpload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: `urn:li:organization:${organizationId}`,
        },
      }),
    }
  );

  if (!registerResponse.ok) {
    throw new Error('Failed to initialize LinkedIn image upload');
  }

  const { value } = await registerResponse.json();
  const uploadUrl = value.uploadUrl;
  const imageUrn = value.image;

  // Step 2: Fetch the image and upload to LinkedIn
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': imageBlob.type,
    },
    body: imageBlob,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to LinkedIn');
  }

  return imageUrn;
}
