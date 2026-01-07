/**
 * EventFlow - Platform Adapters
 * Export all platform adapters and their types
 */

// Adapters
export { LocalCalendarAdapter } from './local-calendar-adapter';
export { FacebookAdapter, getFacebookPages, exchangeForLongLivedToken } from './facebook-adapter';
export { LinkedInAdapter, getLinkedInOrganizations, uploadLinkedInImage } from './linkedin-adapter';
export { ZoomAdapter, checkZoomWebinarLicense, getZoomUser } from './zoom-adapter';

// Re-export base types from ports
export type {
  IPlatformAdapter,
  ConnectionResult,
  TransformedEvent,
} from '../core/ports/platform-adapter';
export { BasePlatformAdapter } from '../core/ports/platform-adapter';

// Future adapters will be added here:
// export { EventbriteAdapter } from './eventbrite-adapter';
// export { MeetupAdapter } from './meetup-adapter';
// export { DiscordAdapter } from './discord-adapter';
