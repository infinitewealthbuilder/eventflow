'use client';

/**
 * Auth Kit — UserButton
 *
 * Avatar dropdown with user info and sign-out. Replaces Clerk's <UserButton />.
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../client/auth-provider';

interface UserButtonProps {
  afterSignOutUrl?: string;
  profileUrl?: string;
}

export function UserButton({
  afterSignOutUrl = '/sign-in',
  profileUrl,
}: UserButtonProps) {
  const { user, isLoaded, isSignedIn, signOut } = useAuthContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isLoaded) {
    return <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />;
  }

  if (!isSignedIn || !user) return null;

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join('') || user.email.charAt(0).toUpperCase();

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  async function handleSignOut() {
    await signOut();
    router.push(afterSignOutUrl);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="User menu"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border bg-popover p-1 shadow-md">
          <div className="border-b px-3 py-2">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </div>

          {profileUrl && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(profileUrl);
              }}
              className="hover:bg-accent flex w-full items-center rounded-sm px-3 py-2 text-sm"
            >
              Profile
            </button>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="hover:bg-accent flex w-full items-center rounded-sm px-3 py-2 text-sm text-destructive"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
