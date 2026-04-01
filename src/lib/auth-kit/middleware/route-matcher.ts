/**
 * Auth Kit — Route Matcher
 *
 * Drop-in replacement for Clerk's createRouteMatcher().
 * Supports glob-style patterns with (.*) suffixes.
 */

import type { NextRequest } from 'next/server';

type RouteMatcher = (req: NextRequest) => boolean;

/**
 * Creates a route matcher function from an array of patterns.
 *
 * Patterns support:
 * - Exact match: '/sign-in'
 * - Prefix match: '/api/webhooks/(.*)'
 * - Regex: any valid regex string
 */
export function createRouteMatcher(patterns: string[]): RouteMatcher {
  const compiled = patterns.map((pattern) => {
    // Convert glob-style (.*)  to regex
    const regexStr = pattern
      .replace(/\(/g, '(?:')
      .replace(/\.\*/g, '.*');
    return new RegExp(`^${regexStr}$`);
  });

  return (req: NextRequest) => {
    const pathname = req.nextUrl.pathname;
    return compiled.some((re) => re.test(pathname));
  };
}
