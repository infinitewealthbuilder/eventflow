'use client';

/**
 * Billing Settings Page
 * Manage subscription tier and view usage stats
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOrganization } from '@/lib/hooks/use-organization';
import { SUBSCRIPTION_TIERS } from '@/lib/stripe/config';

interface SubscriptionData {
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

interface UsageStats {
  events: { used: number; limit: number; percentage: number };
  platforms: { used: number; limit: number; percentage: number };
  teamMembers: { used: number; limit: number; percentage: number };
}

const UPGRADE_TIERS = ['BASIC', 'PRO', 'BUSINESS'] as const;

function formatLimit(limit: number): string {
  return limit === -1 ? 'Unlimited' : String(limit);
}

function UsageBar({ percentage, used, limit }: { percentage: number; used: number; limit: number }) {
  const displayPct = limit === -1 ? 0 : Math.min(percentage, 100);
  const color =
    displayPct >= 90 ? 'bg-red-500' : displayPct >= 70 ? 'bg-yellow-500' : 'bg-blue-500';
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{used} used</span>
        <span>{formatLimit(limit)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${displayPct}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { organization } = useOrganization();

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle ?success=true / ?canceled=true from Stripe redirects
  useEffect(() => {
    if (!searchParams) return;
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('Your subscription has been updated successfully!');
      window.history.replaceState({}, '', '/dashboard/settings/billing');
    } else if (searchParams.get('canceled') === 'true') {
      setError('Checkout was canceled. No charges were made.');
      window.history.replaceState({}, '', '/dashboard/settings/billing');
    }
  }, [searchParams]);

  const fetchSubscription = useCallback(async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/stripe/subscription?organizationId=${organization.id}`
      );
      if (!res.ok) throw new Error('Failed to fetch subscription');
      const data = await res.json();
      setSubscription(data.subscription);
      setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing info');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleManageSubscription = async () => {
    if (!organization) return;
    setActionLoading('portal');
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: organization.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (tier: string) => {
    if (!organization) return;
    setActionLoading(tier);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, organizationId: organization.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setActionLoading(null);
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

  const currentTier = (subscription?.tier ?? 'FREE') as keyof typeof SUBSCRIPTION_TIERS;
  const tierConfig = SUBSCRIPTION_TIERS[currentTier];
  const isFreeTier = currentTier === 'FREE';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-1 text-gray-500">
          Manage your plan, view usage, and update payment details.
        </p>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-700">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
              <div className="h-4 bg-gray-100 rounded w-64" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Plan Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">{tierConfig.name}</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      subscription?.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : subscription?.status === 'PAST_DUE'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {subscription?.status ?? 'ACTIVE'}
                  </span>
                </div>
                {!isFreeTier && tierConfig.price > 0 && (
                  <p className="mt-1 text-gray-500 text-sm">
                    ${(tierConfig.price / 100).toFixed(2)} / month
                  </p>
                )}
                {subscription?.currentPeriodEnd && (
                  <p className="mt-1 text-sm text-gray-500">
                    Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>

              {!isFreeTier && (
                <button
                  onClick={handleManageSubscription}
                  disabled={actionLoading === 'portal'}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'portal' ? 'Opening…' : 'Manage Subscription'}
                </button>
              )}
            </div>

            {/* Features list */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">Included features:</p>
              <ul className="flex flex-wrap gap-2">
                {tierConfig.features.map((feature) => (
                  <li key={feature} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Usage Stats */}
          {usage && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage This Month</h2>
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Events</p>
                  <UsageBar
                    percentage={usage.events.percentage}
                    used={usage.events.used}
                    limit={usage.events.limit}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Platform Connections</p>
                  <UsageBar
                    percentage={usage.platforms.percentage}
                    used={usage.platforms.used}
                    limit={usage.platforms.limit}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Team Members</p>
                  <UsageBar
                    percentage={usage.teamMembers.percentage}
                    used={usage.teamMembers.used}
                    limit={usage.teamMembers.limit}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Options (shown for FREE tier) */}
          {isFreeTier && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Upgrade Your Plan</h2>
              <p className="text-sm text-gray-500 mb-4">
                Unlock more platforms, events, and team members.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {UPGRADE_TIERS.map((tier) => {
                  const config = SUBSCRIPTION_TIERS[tier];
                  return (
                    <div
                      key={tier}
                      className="border border-gray-200 rounded-lg p-4 flex flex-col"
                    >
                      <h3 className="font-semibold text-gray-900">{config.name}</h3>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        ${(config.price / 100).toFixed(2)}
                        <span className="text-sm font-normal text-gray-500">/mo</span>
                      </p>
                      <ul className="mt-3 space-y-1 text-sm text-gray-600 flex-1">
                        <li>{config.platforms} platforms</li>
                        <li>
                          {config.eventsPerMonth === -1
                            ? 'Unlimited events'
                            : `${config.eventsPerMonth} events/mo`}
                        </li>
                        <li>{config.teamMembers} team members</li>
                      </ul>
                      <button
                        onClick={() => handleUpgrade(tier)}
                        disabled={actionLoading === tier}
                        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === tier ? 'Redirecting…' : `Upgrade to ${config.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
