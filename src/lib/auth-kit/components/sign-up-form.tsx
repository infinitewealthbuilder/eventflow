'use client';

/**
 * Auth Kit — SignUpForm
 *
 * Registration form with email/password and optional OAuth.
 * Supports passing default user_metadata (tenant_id, role) via metadata prop.
 */

import { useState } from 'react';
import { createBrowserClient } from '../client/browser-client';

interface SignUpFormProps {
  redirectUrl?: string;
  providers?: ('google' | 'github' | 'apple')[];
  metadata?: Record<string, unknown>;
  appearance?: {
    brandColor?: string;
    logo?: string;
  };
}

export function SignUpForm({
  redirectUrl = '/dashboard',
  providers = [],
  metadata = {},
  appearance,
}: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const supabase = createBrowserClient();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectUrl}`,
        data: {
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          ...metadata,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setConfirmationSent(true);
  }

  async function handleOAuth(provider: 'google' | 'github' | 'apple') {
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

  if (confirmationSent) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          {appearance?.logo && (
            <img src={appearance.logo} alt="" className="mx-auto h-10 w-auto" />
          )}
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a confirmation link to <strong>{email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        {appearance?.logo && (
          <img src={appearance.logo} alt="" className="mx-auto h-10 w-auto" />
        )}
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground text-sm">
          Enter your details to get started
        </p>
      </div>

      {providers.length > 0 && (
        <div className="space-y-2">
          {providers.map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleOAuth(provider)}
              className="border-input bg-background hover:bg-accent flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
            >
              Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </button>
          ))}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">or</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-medium">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-sm font-medium">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={appearance?.brandColor ? { backgroundColor: appearance.brandColor } : undefined}
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <a href="/sign-in" className="text-foreground font-medium underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
