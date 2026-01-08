'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { brand } from '@/lib/branding';
import { ExternalLinkIcon, EmailIcon, LinkedInIcon, ChevronDownIcon } from '@/components/icons';

interface NavLink {
  name: string;
  href: string;
  external?: boolean;
}

// Changed to anchor sections on the homepage instead of dashboard routes
// This avoids CORS errors for logged-out users
const platforms: NavLink[] = [
  { name: 'Facebook Events', href: '#platforms' },
  { name: 'LinkedIn Events', href: '#platforms' },
  { name: 'Eventbrite', href: '#platforms' },
  { name: 'Zoom Meetings', href: '#platforms' },
  { name: 'Local Calendar', href: '#platforms' },
];

const resources: NavLink[] = [
  { name: 'Vibe Coding Academy', href: 'https://matthewdnye.com/vibe-coding', external: true },
  { name: 'Elite Advisor Tools', href: 'https://eliteadvisortools.com', external: true },
  { name: 'WealthRank SEO', href: 'https://matthewdnye.com/wealthrank-seo', external: true },
];

interface CollapsibleSectionProps {
  title: string;
  titleId: string;
  children: React.ReactNode;
}

function CollapsibleSection({ title, titleId, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-800 md:border-0">
      {/* Mobile: collapsible header */}
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`${titleId}-content`}
      >
        <h3 id={titleId} className="text-sm font-semibold text-white">
          {title}
        </h3>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Desktop: always visible header */}
      <h3 id={`${titleId}-desktop`} className="hidden md:block text-sm font-semibold text-white">
        {title}
      </h3>

      {/* Content - collapsible on mobile, always visible on desktop */}
      <div
        id={`${titleId}-content`}
        className={`overflow-hidden transition-all duration-300 md:overflow-visible ${
          isOpen ? 'max-h-96 pb-4' : 'max-h-0 md:max-h-none'
        }`}
      >
        <div className="md:mt-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t border-gray-200"
      style={{ backgroundColor: brand.colors.secondary }}
      role="contentinfo"
    >
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:gap-8 md:grid-cols-4">
          {/* Brand Column - always visible */}
          <div className="md:col-span-2 pb-6 md:pb-0 border-b border-gray-800 md:border-0">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src={brand.logoLight}
                alt={`${brand.name} logo`}
                width={200}
                height={50}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <div className="mt-3">
              <div className="text-sm font-semibold text-white">
                {brand.productName}
              </div>
              <div className="text-xs text-gray-400">
                by {brand.name}
              </div>
            </div>
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

          {/* Platforms Column - collapsible on mobile */}
          <CollapsibleSection title="Platforms" titleId="footer-platforms">
            <ul className="space-y-2" role="list" aria-labelledby="footer-platforms">
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
          </CollapsibleSection>

          {/* Resources Column - collapsible on mobile */}
          <CollapsibleSection title="Resources" titleId="footer-resources">
            <ul className="space-y-2" role="list" aria-labelledby="footer-resources">
              {resources.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-[#D9B01C]"
                  >
                    {item.name}
                    {item.external && <ExternalLinkIcon />}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-[#C49F18]"
                  style={{ color: brand.colors.primary }}
                >
                  Visit {brand.name}
                  <ExternalLinkIcon />
                </a>
              </li>
            </ul>
          </CollapsibleSection>
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
              <a
                href={`mailto:${brand.contact.email}`}
                className="text-gray-500 transition-colors hover:text-[#D9B01C]"
                aria-label="Send email"
              >
                <EmailIcon />
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
