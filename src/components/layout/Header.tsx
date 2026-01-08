'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { brand } from '@/lib/branding';
import { AuthButton } from '@/components/auth-button';
import { MenuIcon, CloseIcon } from '@/components/icons';

interface HeaderProps {
  variant?: 'default' | 'minimal' | 'dashboard';
  showAuth?: boolean;
}

export function Header({ variant = 'default', showAuth = true }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const defaultNavLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '#platforms', label: 'Platforms' },
    { href: '#pricing', label: 'Pricing' },
  ];

  const dashboardNavLinks = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/events', label: 'Events' },
    { href: '/dashboard/settings/connections', label: 'Connections' },
  ];

  const navLinks = variant === 'dashboard' ? dashboardNavLinks : defaultNavLinks;
  const showNav = variant === 'default' || variant === 'dashboard';

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

          {/* Desktop Navigation */}
          {showNav && (
            <nav
              className="hidden md:flex items-center gap-8"
              role="navigation"
              aria-label={variant === 'dashboard' ? 'Dashboard navigation' : 'Main navigation'}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-white transition-colors hover:opacity-80 rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side - Auth/CTA + Mobile Menu Button */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            {showNav && (
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? (
                  <CloseIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>
            )}

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

      {/* Mobile Navigation Menu */}
      {showNav && (
        <div
          id="mobile-menu"
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{ backgroundColor: brand.colors.secondaryLight }}
        >
          <nav
            className="px-4 py-4 space-y-2"
            role="navigation"
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-base font-medium text-white rounded-md hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B01C]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
