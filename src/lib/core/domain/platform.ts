/**
 * EventFlow - Platform Domain Model
 * Defines supported platforms and their capabilities
 */

export type PlatformId =
  | 'facebook'
  | 'linkedin'
  | 'eventbrite'
  | 'meetup'
  | 'instagram'
  | 'twitter'
  | 'discord'
  | 'whatsapp'
  | 'zoom-meeting'
  | 'zoom-webinar'
  | 'local-calendar';

export type AuthType = 'oauth2' | 'api-key' | 'webhook' | 'none';
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'business' | 'enterprise';

export interface PlatformCapabilities {
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsRSVP: boolean;
  supportsTicketing: boolean;
  supportsRecurring: boolean;
  supportsLocation: boolean;
  supportsVirtual: boolean;
  maxDescriptionLength: number;
  maxTitleLength: number;
  maxImages: number;
}

export interface PlatformMetadata {
  id: PlatformId;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  authType: AuthType;
  requiredTier: SubscriptionTier;
  capabilities: PlatformCapabilities;
  oauthScopes?: string[];
  apiDocsUrl?: string;
}

export const PLATFORMS: Record<PlatformId, PlatformMetadata> = {
  facebook: {
    id: 'facebook',
    name: 'facebook',
    displayName: 'Facebook Events',
    icon: 'facebook',
    color: '#1877F2',
    authType: 'oauth2',
    requiredTier: 'basic',
    capabilities: {
      supportsImages: true,
      supportsVideo: true,
      supportsRSVP: true,
      supportsTicketing: false,
      supportsRecurring: true,
      supportsLocation: true,
      supportsVirtual: true,
      maxDescriptionLength: 63206,
      maxTitleLength: 100,
      maxImages: 10,
    },
    oauthScopes: ['pages_manage_posts', 'pages_read_engagement'],
    apiDocsUrl: 'https://developers.facebook.com/docs/graph-api/reference/event/',
  },

  linkedin: {
    id: 'linkedin',
    name: 'linkedin',
    displayName: 'LinkedIn Events',
    icon: 'linkedin',
    color: '#0A66C2',
    authType: 'oauth2',
    requiredTier: 'basic',
    capabilities: {
      supportsImages: true,
      supportsVideo: false,
      supportsRSVP: true,
      supportsTicketing: false,
      supportsRecurring: false,
      supportsLocation: true,
      supportsVirtual: true,
      maxDescriptionLength: 2000,
      maxTitleLength: 200,
      maxImages: 1,
    },
    oauthScopes: ['w_organization_social', 'r_organization_social'],
    apiDocsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/events-api',
  },

  eventbrite: {
    id: 'eventbrite',
    name: 'eventbrite',
    displayName: 'Eventbrite',
    icon: 'ticket',
    color: '#F05537',
    authType: 'oauth2',
    requiredTier: 'basic',
    capabilities: {
      supportsImages: true,
      supportsVideo: false,
      supportsRSVP: true,
      supportsTicketing: true,
      supportsRecurring: true,
      supportsLocation: true,
      supportsVirtual: true,
      maxDescriptionLength: 10000,
      maxTitleLength: 75,
      maxImages: 10,
    },
    oauthScopes: ['event_management'],
    apiDocsUrl: 'https://www.eventbrite.com/platform/api',
  },

  meetup: {
    id: 'meetup',
    name: 'meetup',
    displayName: 'Meetup',
    icon: 'users',
    color: '#ED1C40',
    authType: 'oauth2',
    requiredTier: 'pro',
    capabilities: {
      supportsImages: true,
      supportsVideo: false,
      supportsRSVP: true,
      supportsTicketing: false,
      supportsRecurring: true,
      supportsLocation: true,
      supportsVirtual: true,
      maxDescriptionLength: 50000,
      maxTitleLength: 80,
      maxImages: 1,
    },
    oauthScopes: ['event_management'],
    apiDocsUrl: 'https://www.meetup.com/api/schema/',
  },

  instagram: {
    id: 'instagram',
    name: 'instagram',
    displayName: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    authType: 'oauth2',
    requiredTier: 'basic',
    capabilities: {
      supportsImages: true,
      supportsVideo: true,
      supportsRSVP: false,
      supportsTicketing: false,
      supportsRecurring: false,
      supportsLocation: true,
      supportsVirtual: false,
      maxDescriptionLength: 2200,
      maxTitleLength: 0, // No title, just caption
      maxImages: 10,
    },
    oauthScopes: ['instagram_basic', 'instagram_content_publish'],
    apiDocsUrl: 'https://developers.facebook.com/docs/instagram-api/',
  },

  twitter: {
    id: 'twitter',
    name: 'twitter',
    displayName: 'X (Twitter)',
    icon: 'twitter',
    color: '#000000',
    authType: 'oauth2',
    requiredTier: 'basic',
    capabilities: {
      supportsImages: true,
      supportsVideo: true,
      supportsRSVP: false,
      supportsTicketing: false,
      supportsRecurring: false,
      supportsLocation: false,
      supportsVirtual: false,
      maxDescriptionLength: 280,
      maxTitleLength: 0, // No title, just tweet
      maxImages: 4,
    },
    oauthScopes: ['tweet.read', 'tweet.write', 'users.read'],
    apiDocsUrl: 'https://developer.twitter.com/en/docs/twitter-api',
  },

  discord: {
    id: 'discord',
    name: 'discord',
    displayName: 'Discord',
    icon: 'message-circle',
    color: '#5865F2',
    authType: 'webhook',
    requiredTier: 'pro',
    capabilities: {
      supportsImages: true,
      supportsVideo: false,
      supportsRSVP: false,
      supportsTicketing: false,
      supportsRecurring: false,
      supportsLocation: false,
      supportsVirtual: true,
      maxDescriptionLength: 4096,
      maxTitleLength: 256,
      maxImages: 10,
    },
    apiDocsUrl: 'https://discord.com/developers/docs/resources/webhook',
  },

  whatsapp: {
    id: 'whatsapp',
    name: 'whatsapp',
    displayName: 'WhatsApp',
    icon: 'message-square',
    color: '#25D366',
    authType: 'api-key',
    requiredTier: 'business',
    capabilities: {
      supportsImages: true,
      supportsVideo: true,
      supportsRSVP: false,
      supportsTicketing: false,
      supportsRecurring: false,
      supportsLocation: true,
      supportsVirtual: false,
      maxDescriptionLength: 4096,
      maxTitleLength: 0,
      maxImages: 1,
    },
    apiDocsUrl: 'https://developers.facebook.com/docs/whatsapp/business-management-api/',
  },

  'zoom-meeting': {
    id: 'zoom-meeting',
    name: 'zoom-meeting',
    displayName: 'Zoom Meeting',
    icon: 'video',
    color: '#2D8CFF',
    authType: 'oauth2',
    requiredTier: 'basic',
    capabilities: {
      supportsImages: false,
      supportsVideo: false,
      supportsRSVP: true,
      supportsTicketing: false,
      supportsRecurring: true,
      supportsLocation: false,
      supportsVirtual: true,
      maxDescriptionLength: 2000,
      maxTitleLength: 200,
      maxImages: 0,
    },
    oauthScopes: ['meeting:write', 'user:read'],
    apiDocsUrl: 'https://developers.zoom.us/docs/api/',
  },

  'zoom-webinar': {
    id: 'zoom-webinar',
    name: 'zoom-webinar',
    displayName: 'Zoom Webinar',
    icon: 'presentation',
    color: '#2D8CFF',
    authType: 'oauth2',
    requiredTier: 'pro',
    capabilities: {
      supportsImages: false,
      supportsVideo: false,
      supportsRSVP: true,
      supportsTicketing: false,
      supportsRecurring: true,
      supportsLocation: false,
      supportsVirtual: true,
      maxDescriptionLength: 2000,
      maxTitleLength: 200,
      maxImages: 0,
    },
    oauthScopes: ['webinar:write', 'user:read'],
    apiDocsUrl: 'https://developers.zoom.us/docs/api/',
  },

  'local-calendar': {
    id: 'local-calendar',
    name: 'local-calendar',
    displayName: 'Local Calendar (iCal)',
    icon: 'calendar',
    color: '#6B7280',
    authType: 'none',
    requiredTier: 'free',
    capabilities: {
      supportsImages: false,
      supportsVideo: false,
      supportsRSVP: false,
      supportsTicketing: false,
      supportsRecurring: true,
      supportsLocation: true,
      supportsVirtual: true,
      maxDescriptionLength: 10000,
      maxTitleLength: 255,
      maxImages: 0,
    },
    apiDocsUrl: 'https://icalendar.org/',
  },
};

export function getPlatform(id: PlatformId): PlatformMetadata {
  return PLATFORMS[id];
}

export function getPlatformsByTier(tier: SubscriptionTier): PlatformMetadata[] {
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'pro', 'business', 'enterprise'];
  const tierIndex = tierOrder.indexOf(tier);

  return Object.values(PLATFORMS).filter((platform) => {
    const platformTierIndex = tierOrder.indexOf(platform.requiredTier);
    return platformTierIndex <= tierIndex;
  });
}
