'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const MAX_AVATAR_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

interface AvatarUploadProps {
  avatarUrl?: string;
  initials: string;
}

export function AvatarUpload({ avatarUrl: initialUrl, initials }: AvatarUploadProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a PNG, JPEG, GIF, or WebP image.' });
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setMessage({ type: 'error', text: 'Please choose an image under 10MB.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/me/avatar', { method: 'PATCH', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Upload failed');
      }
      const { avatarUrl: newUrl } = await res.json();
      setAvatarUrl(newUrl);
      setMessage({ type: 'success', text: 'Photo updated.' });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemove() {
    setIsUploading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/me/avatar', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove photo');
      setAvatarUrl(undefined);
      setMessage({ type: 'success', text: 'Photo removed.' });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Remove failed.' });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-100">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile photo" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-gray-400">
            {initials}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Change Photo'}
        </button>
        {avatarUrl && (
          <button
            type="button"
            disabled={isUploading}
            onClick={handleRemove}
            className="rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Remove Photo
          </button>
        )}
        {message && (
          <p className={`text-xs ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
