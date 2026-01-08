/**
 * EventFlow Brand System
 * Colors, fonts, and brand constants for consistent styling
 * Uses Matthew D Nye brand identity
 */

export const brand = {
  name: 'Matthew D Nye',
  shortName: 'MDN',
  productName: 'EventFlow',
  tagline: 'Effective. Efficient. Expeditious.',
  productTagline: 'Create once. Publish everywhere.',
  website: 'https://matthewdnye.com',
  logo: 'https://assets.cdn.filesafe.space/mHWnduakz84s7W5eaNra/media/643027c98f3b62399a468225.png',
  logoLight: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/mHWnduakz84s7W5eaNra/media/63e62d767b2134639f42806e.png',

  colors: {
    // Primary brand gold - excellence and value
    primary: '#D9B01C',
    primaryHover: '#C49F18',
    primaryLight: '#F5E6A3',

    // Secondary brand black - sophistication and authority
    secondary: '#090909',
    secondaryLight: '#1A1A1A',

    // Accent white
    accent: '#FFFFFF',

    // Neutral grays
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },

  social: {
    linkedin: 'https://www.linkedin.com/in/matthewdnye',
    youtube: null,
    twitter: null,
  },

  contact: {
    email: 'matthew@matthewdnye.com',
  },

  products: [
    { name: 'Vibe Coding Academy', href: 'https://matthewdnye.com/vibe-coding' },
    { name: 'WealthRank SEO', href: 'https://matthewdnye.com/wealthrank-seo' },
    { name: 'Elite Advisor Tools', href: 'https://eliteadvisortools.com' },
  ],

  platforms: [
    { name: 'Facebook Events', href: '/dashboard/settings/connections', icon: '📘' },
    { name: 'LinkedIn Events', href: '/dashboard/settings/connections', icon: '💼' },
    { name: 'Eventbrite', href: '/dashboard/settings/connections', icon: '🎟️' },
    { name: 'Local Calendar', href: '/dashboard/events', icon: '📅' },
    { name: 'Zoom', href: '/dashboard/settings/connections', icon: '📹' },
  ],
} as const;
