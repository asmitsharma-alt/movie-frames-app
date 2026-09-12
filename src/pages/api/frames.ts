import type { APIRoute } from 'astro';
import { getFramesForMovie } from '../../lib/storage';
import { getTmdbMovieDetails } from '../../lib/tmdb';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
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

  const apiKey = (locals?.runtime?.env as any)?.TMDB_API_KEY || process.env.TMDB_API_KEY;
  const [movie, frames] = await Promise.all([
    getTmdbMovieDetails(tmdbId, apiKey),
    getFramesForMovie(tmdbId, locals)
  ]);

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
