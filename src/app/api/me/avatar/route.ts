import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getAuth } from '@/lib/auth-kit/server';
import { createAdminClient } from '@/lib/auth-kit/server/admin-client';
import { getUserMetadata, setUserMetadata } from '@/lib/auth-kit/admin';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const AVATAR_SIZE = 256;
const MAX_INPUT_DIMENSION = 8000;
const BUCKET = 'avatars';

function avatarPath(userId: string) {
  return `${userId}/avatar.webp`;
}

export async function PATCH(request: Request) {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPEG, GIF, WebP' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 10MB' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
    }
    if (metadata.width > MAX_INPUT_DIMENSION || metadata.height > MAX_INPUT_DIMENSION) {
      return NextResponse.json({ error: 'Image dimensions too large' }, { status: 400 });
    }

    const optimized = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const admin = createAdminClient();
    const path = avatarPath(auth.userId);

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, optimized, { contentType: 'image/webp', upsert: true });

    if (uploadError) {
      console.error('Avatar upload failed:', uploadError);
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const cleanUrl = urlData.publicUrl;

    const currentMeta = await getUserMetadata(auth.userId);
    await setUserMetadata(auth.userId, { ...currentMeta, avatar_url: cleanUrl });

    return NextResponse.json({ avatarUrl: `${cleanUrl}?v=${Date.now()}` });
  } catch (error) {
    console.error('Avatar processing failed:', error);
    return NextResponse.json({ error: 'Failed to process avatar' }, { status: 500 });
  }
}

export async function DELETE() {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const path = avatarPath(auth.userId);

    const { error: deleteError } = await admin.storage.from(BUCKET).remove([path]);
    if (deleteError) {
      console.error('Avatar delete failed:', deleteError);
      return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
    }

    const currentMeta = await getUserMetadata(auth.userId);
    await setUserMetadata(auth.userId, { ...currentMeta, avatar_url: null });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar removal failed:', error);
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}
