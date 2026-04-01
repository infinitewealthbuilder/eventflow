'use client';

/**
 * Auth Kit — ForgotPasswordForm
 *
 * Sends a password reset email via Supabase Auth.
 */

import { useState } from 'react';
import { createBrowserClient } from '../client/browser-client';

interface ForgotPasswordFormProps {
  redirectUrl?: string;
  appearance?: {
    brandColor?: string;
    logo?: string;
  };
}

export function ForgotPasswordForm({
  redirectUrl = '/reset-password',
  appearance,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = createBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${redirectUrl}`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          {appearance?.logo && (
            <img src={appearance.logo} alt="" className="mx-auto h-10 w-auto" />
          )}
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a password reset link to <strong>{email}</strong>
          </p>
        </div>
        <a
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground block w-full text-center text-sm underline"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        {appearance?.logo && (
          <img src={appearance.logo} alt="" className="mx-auto h-10 w-auto" />
        )}
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="reset-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={appearance?.brandColor ? { backgroundColor: appearance.brandColor } : undefined}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <a
        href="/sign-in"
        className="text-muted-foreground hover:text-foreground block w-full text-center text-sm underline"
      >
        Back to sign in
      </a>
    </div>
  );
}
