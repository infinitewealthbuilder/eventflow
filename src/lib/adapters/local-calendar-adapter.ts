/**
 * EventFlow - Local Calendar Adapter
 * Generates iCal (.ics) format for universal calendar import
 * No authentication required - exports to downloadable file
 */

import type { Event } from '../core/domain/event';
import type { PublicationResult } from '../core/domain/publication';
import {
  BasePlatformAdapter,
  type ConnectionResult,
  type TransformedEvent,
} from '../core/ports/platform-adapter';

export class LocalCalendarAdapter extends BasePlatformAdapter {
  readonly platformId = 'local-calendar' as const;

  /**
   * Local calendar is always "connected" - no auth needed
   */
  async isConnected(): Promise<boolean> {
    return true;
  }

  /**
   * No-op for local calendar - no authentication required
   */
  async connect(): Promise<ConnectionResult> {
    return {
      success: true,
      platformId: this.platformId,
      accountName: 'Local Calendar',
    };
  }

  /**
   * No-op for local calendar
   */
  async disconnect(): Promise<void> {
    // No-op
  }

  /**
   * Transform event to iCal-compatible format
   */
  transformEvent(event: Event): TransformedEvent {
    return {
      platformId: this.platformId,
      title: this.truncate(event.title, 255),
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      timezone: event.timezone,
      location: {
        name: event.location.name,
        address: this.formatAddress(event.location),
        virtualUrl: event.location.virtualUrl,
        isVirtual: event.location.isVirtual,
      },
      metadata: {
        organizer: event.organizer,
        category: event.category,
        uid: event.id,
      },
    };
  }

  /**
   * Generate iCal content string
   * Returns the .ics content as the "externalId"
   */
  async createEvent(event: TransformedEvent): Promise<PublicationResult> {
    const icsContent = this.generateICS(event);

    return {
      success: true,
      publicationId: `ical-${Date.now()}`,
      externalId: icsContent, // Store the ICS content as the external ID
      externalUrl: undefined, // No URL - it's a downloadable file
    };
  }

  /**
   * Regenerate the iCal content
   */
  async updateEvent(externalId: string, event: TransformedEvent): Promise<PublicationResult> {
    return this.createEvent(event);
  }

  /**
   * No-op for local calendar - nothing to delete externally
   */
  async deleteEvent(): Promise<void> {
    // No-op - local calendar doesn't store events
  }

  /**
   * No URL for local calendar exports
   */
  getEventUrl(): string {
    return '';
  }

  /**
   * Generate iCal/ICS file content
   */
  generateICS(event: TransformedEvent): string {
    const uid = (event.metadata.uid as string) || `${Date.now()}@eventflow.app`;
    const now = this.formatICSDate(new Date());

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventFlow//EventFlow App//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=${event.timezone}:${this.formatICSDate(event.startTime)}`,
      `DTEND;TZID=${event.timezone}:${this.formatICSDate(event.endTime)}`,
      `SUMMARY:${this.escapeICS(event.title)}`,
      `DESCRIPTION:${this.escapeICS(event.description)}`,
    ];

    // Add location
    if (event.location) {
      if (event.location.isVirtual && event.location.virtualUrl) {
        lines.push(`LOCATION:${this.escapeICS(event.location.virtualUrl)}`);
        lines.push(`URL:${event.location.virtualUrl}`);
      } else if (event.location.address) {
        lines.push(`LOCATION:${this.escapeICS(event.location.address)}`);
      } else if (event.location.name) {
        lines.push(`LOCATION:${this.escapeICS(event.location.name)}`);
      }
    }

    // Add organizer
    const organizer = event.metadata.organizer as { name?: string; email?: string } | undefined;
    if (organizer?.email) {
      lines.push(`ORGANIZER;CN=${this.escapeICS(organizer.name || '')}:mailto:${organizer.email}`);
    }

    // Add category
    const category = event.metadata.category as string | undefined;
    if (category) {
      lines.push(`CATEGORIES:${this.escapeICS(category)}`);
    }

    lines.push('END:VEVENT', 'END:VCALENDAR');

    return lines.join('\r\n');
  }

  /**
   * Format date for iCal (YYYYMMDDTHHMMSS)
   */
  private formatICSDate(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  }

  /**
   * Escape special characters for iCal format
   */
  private escapeICS(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Format location address from event location
   */
  private formatAddress(location: Event['location']): string {
    const parts: string[] = [];

    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.postalCode) parts.push(location.postalCode);
    if (location.country) parts.push(location.country);

    return parts.join(', ');
  }
}

/**
 * Helper function to create downloadable .ics file
 */
export function downloadICS(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate a Google Calendar add URL
 */
export function generateGoogleCalendarUrl(event: TransformedEvent): string {
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}`,
    details: event.description,
    ctz: event.timezone,
  });

  if (event.location?.address) {
    params.set('location', event.location.address);
  } else if (event.location?.virtualUrl) {
    params.set('location', event.location.virtualUrl);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an Outlook calendar URL
 */
export function generateOutlookUrl(event: TransformedEvent): string {
  const params = new URLSearchParams({
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
  });

  if (event.location?.address) {
    params.set('location', event.location.address);
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
