import { getAuth } from '@/lib/auth-kit/server';
import { redirect } from 'next/navigation';
import { AvatarUpload } from './avatar-upload';

export default async function ProfileSettingsPage() {
  const auth = await getAuth();
  if (!auth) redirect('/sign-in');

  const initials = [auth.firstName, auth.lastName]
    .filter(Boolean)
    .map(n => n!.charAt(0).toUpperCase())
    .join('') || '?';

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-gray-500">Manage your profile photo and account info.</p>
      </div>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Profile Photo</h2>
        <AvatarUpload avatarUrl={auth.avatar} initials={initials} />
      </section>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span>{auth.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span>{[auth.firstName, auth.lastName].filter(Boolean).join(' ') || 'Not set'}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
