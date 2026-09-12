import type { APIRoute } from 'astro';
import { getFramesForMovie } from '../../lib/storage';
import { getTmdbMovieDetails, getTmdbMovieBackdrops } from '../../lib/tmdb';
import { getAppEnv } from '../../lib/env';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const tmdbId = url.searchParams.get('movie_id') || url.searchParams.get('id');
  
  if (!tmdbId) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Missing required query parameter "movie_id". Example: /api/frames?movie_id=157336'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const appEnv = getAppEnv();
  const apiKey = appEnv?.TMDB_API_KEY || (typeof process !== 'undefined' ? process.env?.TMDB_API_KEY : undefined);
  
  const [movie, userFrames] = await Promise.all([
    getTmdbMovieDetails(tmdbId, apiKey),
    getFramesForMovie(tmdbId)
  ]);

  let frames = userFrames;
  if (frames.length === 0) {
    frames = await getTmdbMovieBackdrops(tmdbId, apiKey);
  }

  return new Response(JSON.stringify({
    status: 'success',
    storage: 'Catbox.moe + Cloudflare KV (Zero DB)',
    movie: {
      tmdbId: movie.tmdbId,
      title: movie.title,
      year: movie.year,
      director: movie.director,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl
    },
    totalFrames: frames.length,
    frames: frames.map(f => ({
      id: f.id,
      url: f.url,
      timestamp: f.timestamp,
      tag: f.tag || null,
      aspectRatio: f.aspectRatio || '2.39:1',
      uploadedAt: f.uploadedAt
    }))
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, s-maxage=300'
    }
  });
};
