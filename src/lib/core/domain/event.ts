/**
 * EventFlow - Core Event Domain Model
 * Represents a canonical event that can be cross-posted to multiple platforms
 */

export interface EventLocation {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  virtualUrl?: string;
  isVirtual: boolean;
}

export interface EventOrganizer {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface EventTicket {
  name: string;
  price: number; // in cents
  currency: string;
  quantity?: number;
  description?: string;
}

export type EventStatus = 'draft' | 'scheduled' | 'published' | 'cancelled';
export type EventVisibility = 'public' | 'private' | 'unlisted';

export interface Event {
  id: string;
  organizationId: string;

  // Core event details
  title: string;
  description: string;
  shortDescription?: string;

  // Timing
  startTime: Date;
  endTime: Date;
  timezone: string;
  isAllDay: boolean;

  // Location
  location: EventLocation;

  // Media
  coverImageUrl?: string;
  thumbnailUrl?: string;
  galleryUrls?: string[];

  // Ticketing
  tickets?: EventTicket[];
  isFree: boolean;
  registrationUrl?: string;
  maxAttendees?: number;

  // Categorization
  category?: string;
  tags?: string[];

  // Organizer
  organizer: EventOrganizer;

  // Status
  status: EventStatus;
  visibility: EventVisibility;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  shortDescription?: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  isAllDay?: boolean;
  location: EventLocation;
  coverImageUrl?: string;
  tickets?: EventTicket[];
  isFree?: boolean;
  registrationUrl?: string;
  maxAttendees?: number;
  category?: string;
  tags?: string[];
  organizer: EventOrganizer;
  visibility?: EventVisibility;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}
