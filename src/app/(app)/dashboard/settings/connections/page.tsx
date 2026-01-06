'use client';

/**
 * Platform Connections Page
 * Manage OAuth connections to Facebook, LinkedIn, and other platforms
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOrganization } from '@/lib/hooks/use-organization';
import { PLATFORMS } from '@/lib/core/domain/platform';

interface PlatformConnection {
  id: string;
  name: string;
  icon: string;
  isConnected: boolean;
  accountName?: string;
  accountId?: string;
  expiresAt?: string;
  capabilities: {
    supportsRecurring: boolean;
    supportsRSVP: boolean;
    supportsImages: boolean;
    maxTitleLength: number;
    maxDescriptionLength: number;
  };
}

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const { organization } = useOrganization();
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle success/error from OAuth callbacks
  useEffect(() => {
    if (!searchParams) return;

    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');
    const pageParam = searchParams.get('page');
    const orgParam = searchParams.get('org');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clear URL params after reading
      window.history.replaceState({}, '', '/dashboard/settings/connections');
    }

    if (successParam) {
      const platformName = successParam === 'facebook' ? 'Facebook' : 'LinkedIn';
      const accountName = pageParam || orgParam;
      setSuccessMessage(
        `Successfully connected ${platformName}${accountName ? ` (${accountName})` : ''}`
      );
      // Clear URL params after reading
      window.history.replaceState({}, '', '/dashboard/settings/connections');
    }
  }, [searchParams]);

  // Fetch platforms
  const fetchPlatforms = useCallback(async () => {
    if (!organization) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/platforms?organizationId=${organization.id}`
      );
      if (!response.ok) throw new Error('Failed to fetch platforms');

      const data = await response.json();
      setPlatforms(data.platforms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platforms');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  // Connect to a platform
  const handleConnect = (platformId: string) => {
    if (!organization) return;

    // Redirect to OAuth start endpoint
    const oauthUrl = `/api/oauth/${platformId}?organizationId=${organization.id}`;
    window.location.href = oauthUrl;
  };

  // Disconnect from a platform
  const handleDisconnect = async (platformId: string) => {
    if (!organization) return;

    if (
      !confirm(
        'Are you sure you want to disconnect this platform? You will need to reconnect to post events.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/platforms?organizationId=${organization.id}&platform=${platformId.toUpperCase()}_EVENTS`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to disconnect');

      setSuccessMessage('Platform disconnected successfully');
      fetchPlatforms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  // Get the OAuth-enabled platforms
  const oauthPlatforms = ['facebook', 'linkedin'];

  // Sort platforms - connected first, then OAuth-enabled
  const sortedPlatforms = [...platforms].sort((a, b) => {
    if (a.isConnected !== b.isConnected) return a.isConnected ? -1 : 1;
    const aOAuth = oauthPlatforms.includes(a.id);
    const bOAuth = oauthPlatforms.includes(b.id);
    if (aOAuth !== bOAuth) return aOAuth ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (!organization) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          Please select an organization to manage platform connections.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Connections</h1>
        <p className="mt-1 text-gray-500">
          Connect your social media accounts to cross-post events.
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

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-48" />
                </div>
                <div className="w-24 h-10 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPlatforms.map((platform) => {
            const isOAuthEnabled = oauthPlatforms.includes(platform.id);
            const platformInfo = PLATFORMS[platform.id as keyof typeof PLATFORMS];

            return (
              <div
                key={platform.id}
                className={`bg-white border rounded-lg p-6 ${
                  platform.isConnected ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Platform Icon */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                      platform.isConnected
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    {platform.icon}
                  </div>

                  {/* Platform Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                      {platform.isConnected && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Connected
                        </span>
                      )}
                    </div>
                    {platform.isConnected && platform.accountName && (
                      <p className="text-sm text-gray-500">
                        {platform.accountName}
                        {platform.expiresAt && (
                          <span className="ml-2 text-gray-400">
                            · Expires {new Date(platform.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    )}
                    {!platform.isConnected && (
                      <p className="text-sm text-gray-500">
                        {isOAuthEnabled
                          ? 'Click Connect to authorize'
                          : 'Coming soon'}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div>
                    {platform.isConnected ? (
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Disconnect
                      </button>
                    ) : isOAuthEnabled ? (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Connect
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                </div>

                {/* Capabilities */}
                {platform.isConnected && platformInfo && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {platformInfo.capabilities.supportsImages && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          Cover Images
                        </span>
                      )}
                      {platformInfo.capabilities.supportsRSVP && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                          RSVP Support
                        </span>
                      )}
                      {platformInfo.capabilities.supportsRecurring && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                          Recurring Events
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded">
                        Max {platformInfo.capabilities.maxDescriptionLength.toLocaleString()} chars
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Need help?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            • <strong>Facebook:</strong> You need admin access to a Facebook Page to connect.
          </li>
          <li>
            • <strong>LinkedIn:</strong> You need admin access to a LinkedIn Organization Page.
          </li>
          <li>
            • Events will be posted to the connected Page/Organization automatically.
          </li>
        </ul>
      </div>
    </div>
  );
}
