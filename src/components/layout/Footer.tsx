'use client';

import Link from 'next/link';
import { brand } from '@/lib/branding';
import { ExternalLinkIcon, EmailIcon, LinkedInIcon } from '@/components/icons';

interface NavLink {
  name: string;
  href: string;
  external?: boolean;
}

const platforms: NavLink[] = [
  { name: 'Facebook Events', href: '/dashboard/settings/connections' },
  { name: 'LinkedIn Events', href: '/dashboard/settings/connections' },
  { name: 'Eventbrite', href: '/dashboard/settings/connections' },
  { name: 'Zoom Meetings', href: '/dashboard/settings/connections' },
  { name: 'Local Calendar', href: '/dashboard/events' },
];

const resources: NavLink[] = [
  { name: 'Documentation', href: '/docs', external: false },
  { name: 'API Reference', href: '/docs/api', external: false },
  { name: 'Support', href: 'mailto:support@eventflow.app', external: false },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t border-gray-800"
      style={{ backgroundColor: brand.colors.secondary }}
      role="contentinfo"
    >
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <span
                className="text-xl font-bold"
                style={{ color: brand.colors.primary }}
              >
                {brand.name}
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-gray-400">
              Create events once and cross-post them to Facebook, LinkedIn,
              Eventbrite, Zoom, and more with a single click. Stop copying
              and pasting event details to multiple platforms.
            </p>
            <p
              className="mt-3 text-xs font-medium"
              style={{ color: brand.colors.primary }}
            >
              {brand.tagline}
            </p>
          </div>

          {/* Platforms Column */}
          <div>
            <h3 id="footer-platforms" className="text-sm font-semibold text-white">
              Platforms
            </h3>
            <ul className="mt-4 space-y-2" role="list" aria-labelledby="footer-platforms">
              {platforms.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 transition-colors hover:text-[#D9B01C]"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 id="footer-resources" className="text-sm font-semibold text-white">
              Resources
            </h3>
            <ul className="mt-4 space-y-2" role="list" aria-labelledby="footer-resources">
              {resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-[#D9B01C]"
                  >
                    {item.name}
                    {item.external && <ExternalLinkIcon />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-gray-500">
              &copy; {currentYear} {brand.name}. All rights reserved.
            </p>
            <nav className="flex items-center gap-4" aria-label="Social links">
              {brand.social.linkedin && (
                <a
                  href={brand.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 transition-colors hover:text-[#0A66C2]"
                  aria-label="Follow on LinkedIn"
                >
                  <LinkedInIcon />
                </a>
              )}
              {brand.contact.email && (
                <a
                  href={`mailto:${brand.contact.email}`}
                  className="text-gray-500 transition-colors hover:text-[#D9B01C]"
                  aria-label="Send email"
                >
                  <EmailIcon />
                </a>
              )}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
