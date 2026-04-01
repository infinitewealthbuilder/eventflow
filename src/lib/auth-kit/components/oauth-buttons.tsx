'use client';

/**
 * Auth Kit — OAuthButtons
 *
 * Standalone OAuth provider buttons. Can be used independently or within SignInForm/SignUpForm.
 */

import { useState } from 'react';
import { createBrowserClient } from '../client/browser-client';

type OAuthProvider = 'google' | 'github' | 'apple';

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  apple: 'Apple',
};

interface OAuthButtonsProps {
  providers: OAuthProvider[];
  redirectUrl?: string;
  mode?: 'sign-in' | 'sign-up';
}

export function OAuthButtons({
  providers,
  redirectUrl = '/dashboard',
  mode = 'sign-in',
}: OAuthButtonsProps) {
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect_url=${encodeURIComponent(redirectUrl)}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  const action = mode === 'sign-up' ? 'Sign up' : 'Continue';

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {providers.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => handleOAuth(provider)}
          className="border-input bg-background hover:bg-accent flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
        >
          {action} with {PROVIDER_LABELS[provider]}
        </button>
      ))}
    </div>
  );
}
