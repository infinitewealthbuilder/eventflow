/**
 * EventFlow - Publication Domain Model
 * Tracks event cross-posts to each platform
 */

import type { PlatformId } from './platform';

export type PublicationStatus =
  | 'pending'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled';

export interface PublicationError {
  code: string;
  message: string;
  timestamp: Date;
  retryable: boolean;
}

export interface Publication {
  id: string;
  eventId: string;
  organizationId: string;
  platformId: PlatformId;

  // Platform-specific identifiers
  externalId?: string;
  externalUrl?: string;

  // Status tracking
  status: PublicationStatus;
  error?: PublicationError;
  retryCount: number;
  maxRetries: number;

  // Scheduling
  scheduledFor?: Date;
  publishedAt?: Date;

  // Transformed content (platform-specific)
  transformedContent?: Record<string, unknown>;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePublicationInput {
  eventId: string;
  platformId: PlatformId;
  scheduledFor?: Date;
}

export interface PublicationResult {
  success: boolean;
  publicationId: string;
  externalId?: string;
  externalUrl?: string;
  error?: PublicationError;
}
