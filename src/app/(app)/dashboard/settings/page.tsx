'use client';

/**
 * Settings Page - redirects to connections
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings/connections');
  }, [router]);

  return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-gray-500">Redirecting...</div>
    </div>
  );
}
