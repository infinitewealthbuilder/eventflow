'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOrganization } from '@/lib/hooks/use-organization';
import { SUBSCRIPTION_TIERS, type SubscriptionTierKey } from '@/lib/stripe/config';
import { Button } from '@/components/ui/button';

interface UsageStats {
  events: {
    used: number;
    limit: number;
    percentage: number;
  };
  platforms: {
    used: number;
    limit: number;
    percentage: number;
  };
  teamMembers: {
    used: number;
    limit: number;
    percentage: number;
  };
}

interface SubscriptionInfo {
  tier: SubscriptionTierKey;
  status: string;
  currentPeriodEnd: Date | null;
  usageStats: UsageStats;
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { organization } = useOrganization();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle success/cancel from Stripe
  useEffect(() => {
    if (!searchParams) return;

    const successParam = searchParams.get('success');
    const canceledParam = searchParams.get('canceled');

    if (successParam === 'true') {
      setSuccessMessage('Your subscription was successfully updated.');
      // Clear URL params after reading
      window.history.replaceState({}, '', '/dashboard/settings/billing');
    }

    if (canceledParam === 'true') {
      setError('You canceled the subscription update.');
      // Clear URL params after reading
      window.history.replaceState({}, '', '/dashboard/settings/billing');
    }
  }, [searchParams]);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!organization) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/subscription?organizationId=${organization.id}`);
        if (!response.ok) throw new Error('Failed to fetch subscription');

        const data = await response.json();
        setSubscription(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [organization]);

  // Handle manage subscription
  const handleManageSubscription = async () => {
    if (!organization) return;

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: organization.id }),
      });

      if (!response.ok) throw new Error('Failed to open billing portal');

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to manage subscription');
    }
  };

  // Handle upgrade
  const handleUpgrade = async (tier: SubscriptionTierKey) => {
    if (!organization) return;

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, organizationId: organization.id }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade subscription');
    }
  };

  if (!organization) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          Please select an organization to manage billing.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-8">
        <div className="text-gray-500">No subscription information available.</div>
      </div>
    );
  }

  const { tier, status, currentPeriodEnd, usageStats } = subscription;
  const tierConfig = SUBSCRIPTION_TIERS[tier];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-1 text-gray-500">
          Manage your subscription and billing information.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-green-700">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-500 hover:text-green-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Subscription Info */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>

        <div className="flex items-center gap-4 mb-4">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
            {tier}
          </span>
          <span className="text-gray-500">{status}</span>
        </div>

        {currentPeriodEnd && (
          <p className="text-sm text-gray-500 mb-4">
            Renews on {new Date(currentPeriodEnd).toLocaleDateString()}
          </p>
        )}

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="border rounded-lg p-4 text-center">
            <h3 className="text-sm font-medium text-gray-500">Events</h3>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              {usageStats.events.used} / {usageStats.events.limit}
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${usageStats.events.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="border rounded-lg p-4 text-center">
            <h3 className="text-sm font-medium text-gray-500">Platforms</h3>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              {usageStats.platforms.used} / {usageStats.platforms.limit}
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${usageStats.platforms.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="border rounded-lg p-4 text-center">
            <h3 className="text-sm font-medium text-gray-500">Team Members</h3>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              {usageStats.teamMembers.used} / {usageStats.teamMembers.limit}
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${usageStats.teamMembers.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          {tier === 'FREE' && (
            <>
              <Button
                variant="default"
                onClick={() => handleUpgrade('BASIC')}
              >
                Upgrade to Basic
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleUpgrade('PRO')}
              >
                Upgrade to Pro
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpgrade('BUSINESS')}
              >
                Upgrade to Business
              </Button>
            </>
          )}

          <Button
            variant={tier === 'FREE' ? 'ghost' : 'default'}
            onClick={handleManageSubscription}
          >
            Manage Subscription
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Need help?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Contact support at support@example.com</li>
          <li>• Check our billing FAQs: https://example.com/billing-faq</li>
        </ul>
      </div>
    </div>
  );
}
