'use client';

/**
 * Auth Kit — SignInForm
 *
 * Email/password sign-in with optional OAuth and magic link.
 * Uses shadcn/ui primitives. Replaces Clerk's <SignIn /> component.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '../client/browser-client';

type AuthMethod = 'password' | 'magic-link';

interface SignInFormProps {
  redirectUrl?: string;
  providers?: ('google' | 'github' | 'apple')[];
  showMagicLink?: boolean;
  appearance?: {
    brandColor?: string;
    logo?: string;
  };
}

export function SignInForm({
  redirectUrl = '/dashboard',
  providers = [],
  showMagicLink = false,
  appearance,
}: SignInFormProps) {
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const supabase = createBrowserClient();

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(redirectUrl);
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectUrl}`,
      },
    });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setMagicLinkSent(true);
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

  if (magicLinkSent) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          {appearance?.logo && (
            <img src={appearance.logo} alt="" className="mx-auto h-10 w-auto" />
          )}
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a sign-in link to <strong>{email}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMagicLinkSent(false)}
          className="text-muted-foreground hover:text-foreground w-full text-center text-sm underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        {appearance?.logo && (
          <img src={appearance.logo} alt="" className="mx-auto h-10 w-auto" />
        )}
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-muted-foreground text-sm">
          Enter your credentials to continue
        </p>
      </div>

      {/* OAuth buttons */}
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

      {/* Method toggle */}
      {showMagicLink && (
        <div className="flex gap-1 rounded-md border p-1">
          <button
            type="button"
            onClick={() => setMethod('password')}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
              method === 'password' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMethod('magic-link')}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
              method === 'magic-link' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            Magic Link
          </button>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={method === 'password' ? handlePasswordSignIn : handleMagicLink} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>

        {method === 'password' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <a
                href="/forgot-password"
                className="text-muted-foreground hover:text-foreground text-sm underline"
              >
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={appearance?.brandColor ? { backgroundColor: appearance.brandColor } : undefined}
        >
          {loading
            ? 'Signing in...'
            : method === 'magic-link'
              ? 'Send magic link'
              : 'Sign in'}
        </button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{' '}
        <a href="/sign-up" className="text-foreground font-medium underline">
          Sign up
        </a>
      </p>
    </div>
  );
}
