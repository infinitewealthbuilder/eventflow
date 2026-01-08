'use client';

import Link from 'next/link';
import Image from 'next/image';
import { brand } from '@/lib/branding';
import { AuthButton } from '@/components/auth-button';

interface HeaderProps {
  variant?: 'default' | 'minimal' | 'dashboard';
  showAuth?: boolean;
}

export function Header({ variant = 'default', showAuth = true }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50"
      style={{ backgroundColor: brand.colors.secondary }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090909]"
          >
            <Image
              src={brand.logo}
              alt={`${brand.name} logo`}
              width={160}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Navigation - Only show on default variant */}
          {variant === 'default' && (
            <nav
              className="hidden md:flex items-center gap-8"
              role="navigation"
              aria-label="Main navigation"
            >
              <Link
                href="/dashboard"
                className="text-sm font-medium text-white transition-colors hover:opacity-80 rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C]"
              >
                Dashboard
              </Link>
              <Link
                href="#platforms"
                className="text-sm font-medium text-white transition-colors hover:opacity-80 rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C]"
              >
                Platforms
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-white transition-colors hover:opacity-80 rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C]"
              >
                Pricing
              </Link>
            </nav>
          )}

          {/* Dashboard Navigation */}
          {variant === 'dashboard' && (
            <nav
              className="hidden md:flex items-center gap-6"
              role="navigation"
              aria-label="Dashboard navigation"
            >
              <Link
                href="/dashboard"
                className="text-sm font-medium text-white transition-colors hover:opacity-80 rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C]"
              >
                Overview
              </Link>
              <Link
                href="/dashboard/events"
                className="text-sm font-medium text-white transition-colors hover:opacity-80 rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C]"
              >
                Events
              </Link>
              <Link
                href="/dashboard/settings/connections"
                className="text-sm font-medium text-white transition-colors hover:opacity-80 rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C]"
              >
                Connections
              </Link>
            </nav>
          )}

          {/* Right side - Auth or CTA */}
          <div className="flex items-center gap-4">
            {showAuth ? (
              <AuthButton />
            ) : (
              <Link
                href="/sign-up"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090909]"
                style={{
                  backgroundColor: brand.colors.primary,
                  color: brand.colors.secondary,
                }}
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
