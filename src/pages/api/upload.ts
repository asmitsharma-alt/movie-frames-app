import type { APIRoute } from 'astro';
import { uploadToCatbox } from '../../lib/catbox';
import { addFrameToMovie } from '../../lib/storage';
import type { Frame } from '../../lib/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('frame') as File | null;
    const tmdbId = (formData.get('tmdb_id') as string)?.trim();
    const timestamp = (formData.get('timestamp') as string)?.trim() || '00:00:00';
    const tag = (formData.get('tag') as string)?.trim() || 'Film Still';
    const aspectRatio = (formData.get('aspect_ratio') as string)?.trim() || '2.39:1';

    if (!file || !(file instanceof File) || file.size === 0) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'No image file uploaded or file is empty.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!tmdbId) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing "tmdb_id" field.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Upload frame to Catbox.moe (Zero bytes on our hosting!)
    const directUrl = await uploadToCatbox(file);

    // 2. Build frame object
    const newFrame: Frame = {
      id: `frame-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: directUrl,
      timestamp,
      tag,
      aspectRatio,
      uploadedAt: new Date().toISOString()
    };

    // 3. Save into Cloudflare KV (or local dev storage)
    await addFrameToMovie(tmdbId, newFrame, locals);

    return new Response(JSON.stringify({
      status: 'success',
      message: 'Frame successfully uploaded to Catbox and pinned to archive.',
      tmdbId,
      frame: newFrame
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('Upload handler failed:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error?.message || 'Internal server error during upload.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
