/**
 * EventFlow - Zoom Adapter
 * Creates and manages Zoom Meetings and Webinars
 * Supports both meeting:write and webinar:write scopes
 */

import type { Event } from '../core/domain/event';
import type { PublicationResult } from '../core/domain/publication';
import type { PlatformId } from '../core/domain/platform';
import {
  BasePlatformAdapter,
  type ConnectionResult,
  type TransformedEvent,
} from '../core/ports/platform-adapter';
import { PLATFORMS } from '../core/domain/platform';

const ZOOM_API_BASE = 'https://api.zoom.us/v2';

interface ZoomCredentials {
  accessToken: string;
  userId: string;
  email?: string;
  displayName?: string;
}

interface ZoomMeetingResponse {
  id: number;
  uuid: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  agenda?: string;
  join_url: string;
  start_url: string;
}

interface ZoomWebinarResponse {
  id: number;
  uuid: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  agenda?: string;
  join_url: string;
  start_url: string;
  registration_url?: string;
}

interface ZoomErrorResponse {
  code: number;
  message: string;
}

type ZoomPlatformType = 'zoom-meeting' | 'zoom-webinar';

export class ZoomAdapter extends BasePlatformAdapter {
  readonly platformId: PlatformId;
  private readonly zoomType: 'meeting' | 'webinar';

  private credentials: ZoomCredentials | null = null;

  constructor(type: ZoomPlatformType = 'zoom-meeting') {
    super();
    this.platformId = type;
    this.zoomType = type === 'zoom-webinar' ? 'webinar' : 'meeting';
  }

  private get capabilities() {
    return PLATFORMS[this.platformId].capabilities;
  }

  /**
   * Check if we have valid credentials
   */
  async isConnected(): Promise<boolean> {
    if (!this.credentials?.accessToken || !this.credentials?.userId) {
      return false;
    }

    try {
      // Validate token by fetching user info
      const response = await fetch(
        `${ZOOM_API_BASE}/users/me`,
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Connect with Zoom access token
   * credentials should include: accessToken, userId
   */
  async connect(credentials: Record<string, string>): Promise<ConnectionResult> {
    const { accessToken, userId } = credentials;

    if (!accessToken || !userId) {
      return {
        success: false,
        platformId: this.platformId,
        error: 'Missing required credentials: accessToken and userId',
      };
    }

    try {
      // Validate credentials by fetching user info
      const response = await fetch(
        `${ZOOM_API_BASE}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ZoomErrorResponse;
        return {
          success: false,
          platformId: this.platformId,
          error: errorData.message || 'Failed to validate Zoom credentials',
        };
      }

      const userData = await response.json();

      this.credentials = {
        accessToken,
        userId,
        email: userData.email,
        displayName: userData.display_name || `${userData.first_name} ${userData.last_name}`,
      };

      return {
        success: true,
        platformId: this.platformId,
        accountName: this.credentials.displayName,
        accountId: userId,
      };
    } catch (error) {
      return {
        success: false,
        platformId: this.platformId,
        error: error instanceof Error ? error.message : 'Unknown error connecting to Zoom',
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
   * Transform canonical event to Zoom-specific format
   */
  transformEvent(event: Event): TransformedEvent {
    let description = event.description;
    if (description.length > this.capabilities.maxDescriptionLength) {
      description = this.truncate(description, this.capabilities.maxDescriptionLength);
    }

    const location: TransformedEvent['location'] = {
      isVirtual: true, // Zoom is always virtual
    };

    if (event.location.virtualUrl) {
      location.virtualUrl = event.location.virtualUrl;
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
        userId: this.credentials?.userId,
        zoomType: this.zoomType,
        registrationUrl: event.registrationUrl,
      },
    };
  }

  /**
   * Create meeting or webinar on Zoom
   */
  async createEvent(event: TransformedEvent): Promise<PublicationResult> {
    if (!this.credentials) {
      return {
        success: false,
        publicationId: '',
        error: {
          code: 'NOT_CONNECTED',
          message: 'Not connected to Zoom. Call connect() first.',
          timestamp: new Date(),
          retryable: false,
        },
      };
    }

    try {
      const payload = this.buildPayload(event);
      const endpoint = this.zoomType === 'webinar'
        ? `${ZOOM_API_BASE}/users/${this.credentials.userId}/webinars`
        : `${ZOOM_API_BASE}/users/${this.credentials.userId}/meetings`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ZoomErrorResponse;
        return {
          success: false,
          publicationId: '',
          error: {
            code: `ZOOM_${errorData.code || 'UNKNOWN'}`,
            message: errorData.message || `Failed to create Zoom ${this.zoomType}`,
            timestamp: new Date(),
            retryable: this.isRetryableError(response.status),
          },
        };
      }

      const data = (await response.json()) as ZoomMeetingResponse | ZoomWebinarResponse;
      const externalId = data.id.toString();

      return {
        success: true,
        publicationId: `zoom-${this.zoomType}-${externalId}`,
        externalId,
        externalUrl: data.join_url,
      };
    } catch (error) {
      return {
        success: false,
        publicationId: '',
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : `Network error creating Zoom ${this.zoomType}`,
          timestamp: new Date(),
          retryable: true,
        },
      };
    }
  }

  /**
   * Update existing Zoom meeting or webinar
   */
  async updateEvent(externalId: string, event: TransformedEvent): Promise<PublicationResult> {
    if (!this.credentials) {
      return {
        success: false,
        publicationId: '',
        error: {
          code: 'NOT_CONNECTED',
          message: 'Not connected to Zoom. Call connect() first.',
          timestamp: new Date(),
          retryable: false,
        },
      };
    }

    try {
      const payload = this.buildPayload(event);
      const endpoint = this.zoomType === 'webinar'
        ? `${ZOOM_API_BASE}/webinars/${externalId}`
        : `${ZOOM_API_BASE}/meetings/${externalId}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ZoomErrorResponse;
        return {
          success: false,
          publicationId: `zoom-${this.zoomType}-${externalId}`,
          error: {
            code: `ZOOM_${errorData.code || 'UNKNOWN'}`,
            message: errorData.message || `Failed to update Zoom ${this.zoomType}`,
            timestamp: new Date(),
            retryable: this.isRetryableError(response.status),
          },
        };
      }

      // Zoom PATCH returns 204 No Content on success
      // Fetch updated info to get join URL
      const infoResponse = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      let joinUrl = this.getEventUrl(externalId);
      if (infoResponse.ok) {
        const data = (await infoResponse.json()) as ZoomMeetingResponse | ZoomWebinarResponse;
        joinUrl = data.join_url;
      }

      return {
        success: true,
        publicationId: `zoom-${this.zoomType}-${externalId}`,
        externalId,
        externalUrl: joinUrl,
      };
    } catch (error) {
      return {
        success: false,
        publicationId: `zoom-${this.zoomType}-${externalId}`,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : `Network error updating Zoom ${this.zoomType}`,
          timestamp: new Date(),
          retryable: true,
        },
      };
    }
  }

  /**
   * Delete Zoom meeting or webinar
   */
  async deleteEvent(externalId: string): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not connected to Zoom. Call connect() first.');
    }

    const endpoint = this.zoomType === 'webinar'
      ? `${ZOOM_API_BASE}/webinars/${externalId}`
      : `${ZOOM_API_BASE}/meetings/${externalId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok && response.status !== 204) {
      const errorData = (await response.json()) as ZoomErrorResponse;
      throw new Error(errorData.message || `Failed to delete Zoom ${this.zoomType}`);
    }
  }

  /**
   * Get the URL for a Zoom meeting or webinar
   */
  getEventUrl(externalId: string): string {
    // Zoom join URLs are dynamically generated, so we use a placeholder
    // The actual join_url is returned from createEvent/updateEvent
    return `https://zoom.us/${this.zoomType === 'webinar' ? 'w' : 'j'}/${externalId}`;
  }

  /**
   * Build Zoom API payload
   */
  private buildPayload(event: TransformedEvent): Record<string, unknown> {
    // Calculate duration in minutes
    const durationMs = event.endTime.getTime() - event.startTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));

    const payload: Record<string, unknown> = {
      topic: event.title,
      type: 2, // Scheduled meeting/webinar
      start_time: event.startTime.toISOString(),
      duration: durationMinutes,
      timezone: event.timezone,
      agenda: event.description,
      settings: {
        host_video: true,
        participant_video: true,
        waiting_room: true,
        approval_type: 0, // Auto-approve registrants
        registration_type: 1, // Register once and join any time
        audio: 'voip',
        auto_recording: 'none',
      },
    };

    // Webinar-specific settings
    if (this.zoomType === 'webinar') {
      payload.settings = {
        ...payload.settings as Record<string, unknown>,
        hd_video: true,
        panelists_video: true,
        practice_session: false,
        on_demand: false,
        question_and_answer: {
          enable: true,
          allow_anonymous_questions: false,
        },
      };
    }

    return payload;
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
 * Helper to check if user has webinar license
 * Webinars require a separate Zoom Webinar license
 */
export async function checkZoomWebinarLicense(accessToken: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${ZOOM_API_BASE}/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const userData = await response.json();
    // Check if user has webinar feature
    return userData.feature?.webinar === true;
  } catch {
    return false;
  }
}

/**
 * Get Zoom user info
 */
export async function getZoomUser(accessToken: string): Promise<{
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  type: number;
}> {
  const response = await fetch(
    `${ZOOM_API_BASE}/users/me`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Zoom user: ${error}`);
  }

  return response.json();
}
