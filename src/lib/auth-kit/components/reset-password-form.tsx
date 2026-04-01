'use client';

/**
 * Auth Kit — ResetPasswordForm
 *
 * Handles the token from a password reset email and sets a new password.
 * Supabase automatically exchanges the token when the user clicks the email link,
 * so this component just needs to call updateUser({ password }).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '../client/browser-client';

interface ResetPasswordFormProps {
  afterResetUrl?: string;
  appearance?: {
    brandColor?: string;
    logo?: string;
  };
}

export function ResetPasswordForm({
  afterResetUrl = '/sign-in',
  appearance,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push(afterResetUrl);
    }, 2000);
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Password updated</h1>
          <p className="text-muted-foreground text-sm">
            Redirecting you to sign in...
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
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your new password below
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="new-password" className="text-sm font-medium">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
