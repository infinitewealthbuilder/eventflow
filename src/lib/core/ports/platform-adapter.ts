/**
 * EventFlow - Platform Adapter Port (Interface)
 * Defines the contract that all platform adapters must implement
 */

import type { Event } from '../domain/event';
import type { PlatformId } from '../domain/platform';
import type { PublicationResult } from '../domain/publication';

export interface ConnectionResult {
  success: boolean;
  platformId: PlatformId;
  accountName?: string;
  accountId?: string;
  error?: string;
}

export interface TransformedEvent {
  platformId: PlatformId;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  location?: {
    name?: string;
    address?: string;
    virtualUrl?: string;
    isVirtual: boolean;
  };
  imageUrl?: string;
  metadata: Record<string, unknown>;
}

export interface IPlatformAdapter {
  /**
   * The platform this adapter handles
   */
  readonly platformId: PlatformId;

  /**
   * Check if credentials are valid and connection is active
   */
  isConnected(): Promise<boolean>;

  /**
   * Connect to the platform (OAuth flow or API key validation)
   */
  connect(credentials: Record<string, string>): Promise<ConnectionResult>;

  /**
   * Disconnect from the platform
   */
  disconnect(): Promise<void>;

  /**
   * Transform a canonical event to platform-specific format
   */
  transformEvent(event: Event): TransformedEvent;

  /**
   * Create an event on the platform
   */
  createEvent(event: TransformedEvent): Promise<PublicationResult>;

  /**
   * Update an existing event on the platform
   */
  updateEvent(externalId: string, event: TransformedEvent): Promise<PublicationResult>;

  /**
   * Delete an event from the platform
   */
  deleteEvent(externalId: string): Promise<void>;

  /**
   * Get the external URL for a published event
   */
  getEventUrl(externalId: string): string;
}

/**
 * Base class with common functionality for adapters
 */
export abstract class BasePlatformAdapter implements IPlatformAdapter {
  abstract readonly platformId: PlatformId;

  abstract isConnected(): Promise<boolean>;
  abstract connect(credentials: Record<string, string>): Promise<ConnectionResult>;
  abstract disconnect(): Promise<void>;
  abstract transformEvent(event: Event): TransformedEvent;
  abstract createEvent(event: TransformedEvent): Promise<PublicationResult>;
  abstract updateEvent(externalId: string, event: TransformedEvent): Promise<PublicationResult>;
  abstract deleteEvent(externalId: string): Promise<void>;
  abstract getEventUrl(externalId: string): string;

  /**
   * Truncate text to max length with ellipsis
   */
  protected truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }

  /**
   * Format date for display
   */
  protected formatDate(date: Date, timezone: string): string {
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
