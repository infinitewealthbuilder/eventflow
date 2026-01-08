/**
 * EventFlow Brand System
 * Colors, fonts, and brand constants for consistent styling
 */

export const brand = {
  name: 'EventFlow',
  tagline: 'Create once. Publish everywhere.',

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
    twitter: null,
    linkedin: null,
    facebook: null,
  },

  contact: {
    email: null,
    website: null,
  },

  platforms: [
    { name: 'Facebook Events', href: '#', icon: '📘' },
    { name: 'LinkedIn Events', href: '#', icon: '💼' },
    { name: 'Eventbrite', href: '#', icon: '🎟️' },
    { name: 'Local Calendar', href: '#', icon: '📅' },
    { name: 'Zoom', href: '#', icon: '📹' },
  ],
} as const;
