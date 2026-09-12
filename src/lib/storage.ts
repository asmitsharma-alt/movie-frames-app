import type { Frame } from './types';
import { getAppEnv } from './env';

// Pre-seeded high quality movie frames for demonstration
const INITIAL_DEMO_FRAMES: Record<string, Frame[]> = {
  // Interstellar (157336)
  '157336': [
    {
      id: 'frame-int-1',
      url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1800&q=85',
      timestamp: '01:42:15.04',
      tag: 'Approaching Gargantua',
      aspectRatio: '2.39:1',
      uploadedAt: new Date().toISOString()
    },
    {
      id: 'frame-int-2',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1800&q=85',
      timestamp: '00:54:10.12',
      tag: 'Wormhole Orbit Event',
      aspectRatio: '70mm IMAX',
      uploadedAt: new Date().toISOString()
    },
    {
      id: 'frame-int-3',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
      timestamp: '01:08:33.20',
      tag: 'The Tidal Surge on Miller\'s Planet',
      aspectRatio: '2.39:1',
      uploadedAt: new Date().toISOString()
    },
    {
      id: 'frame-int-4',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1800&q=85',
      timestamp: '02:14:02.18',
      tag: 'No Time For Caution (Endurance Spin)',
      aspectRatio: '70mm IMAX',
      uploadedAt: new Date().toISOString()
    },
    {
      id: 'frame-int-5',
      url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1800&q=85',
      timestamp: '00:31:45.09',
      tag: 'Ranger Separation Earth Orbit',
      aspectRatio: '35mm Panavision',
      uploadedAt: new Date().toISOString()
    }
  ],
  // Blade Runner 2049 (335984)
  '335984': [
    {
      id: 'frame-br-1',
      url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1800&q=85',
      timestamp: '00:15:20.10',
      tag: 'Approaching the Tyrell Ruins in Amber Fog',
      aspectRatio: '2.39:1',
      uploadedAt: new Date().toISOString()
    },
    {
      id: 'frame-br-2',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1800&q=85',
      timestamp: '01:32:44.02',
      tag: 'Neon Street of Neo Los Angeles',
      aspectRatio: '2.39:1',
      uploadedAt: new Date().toISOString()
    }
  ],
  // 2001: A Space Odyssey (62)
  '62': [
    {
      id: 'frame-2001-1',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1800&q=85',
      timestamp: '00:52:14.00',
      tag: 'The Stargate Slit-Scan Journey',
      aspectRatio: '2.20:1 Super Panavision',
      uploadedAt: new Date().toISOString()
    }
  ]
};

// In-memory local cache for dev
let memoryCache: Record<string, Frame[]> = { ...INITIAL_DEMO_FRAMES };

/**
 * Retrieves frames for a specific TMDB Movie ID.
 * Reads from Cloudflare KV if present, otherwise uses dev cache.
 */
export async function getFramesForMovie(tmdbId: string): Promise<Frame[]> {
  try {
    const env = getAppEnv();
    const kv = env?.FRAMES_KV;
    
    if (kv) {
      const data = await kv.get(`movie:${tmdbId}`, { type: 'json' });
      if (data && Array.isArray(data)) {
        return data as Frame[];
      }
    }
  } catch (err) {
    console.error('Failed to read from Cloudflare KV:', err);
  }

  // Fallback to local memory/demo store
  return memoryCache[tmdbId] || [];
}

/**
 * Saves a new frame under the TMDB Movie ID.
 * Writes to Cloudflare KV if present, otherwise updates local store.
 */
export async function addFrameToMovie(tmdbId: string, frame: Frame): Promise<void> {
  try {
    const env = getAppEnv();
    const kv = env?.FRAMES_KV;

    if (kv) {
      const existing = (await kv.get(`movie:${tmdbId}`, { type: 'json' })) || [];
      const updated = Array.isArray(existing) ? [frame, ...existing] : [frame];
      await kv.put(`movie:${tmdbId}`, JSON.stringify(updated));
      return;
    }
  } catch (err) {
    console.error('Failed to write to Cloudflare KV:', err);
  }

  // Fallback update
  if (!memoryCache[tmdbId]) {
    memoryCache[tmdbId] = [];
  }
  memoryCache[tmdbId].unshift(frame);
}

/**
 * Returns a list of all movie IDs that have stored frames
 */
export async function getCuratedMovieIds(): Promise<string[]> {
  try {
    const env = getAppEnv();
    const kv = env?.FRAMES_KV;
    if (kv) {
      const list = await kv.list({ prefix: 'movie:' });
      if (list && list.keys.length > 0) {
        return list.keys.map((k: { name: string }) => k.name.replace('movie:', ''));
      }
    }
  } catch (err) {
    console.error('Failed to list keys from Cloudflare KV:', err);
  }

  return Object.keys(memoryCache);
}
