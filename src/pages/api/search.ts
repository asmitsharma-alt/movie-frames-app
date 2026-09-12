import type { APIRoute } from 'astro';
import { searchTmdbMovies } from '../../lib/tmdb';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const query = url.searchParams.get('q') || '';
  
  if (!query.trim()) {
    return new Response(JSON.stringify({ status: 'success', results: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = (locals?.runtime?.env as any)?.TMDB_API_KEY || process.env.TMDB_API_KEY;
  const results = await searchTmdbMovies(query, apiKey);

  return new Response(JSON.stringify({
    status: 'success',
    query,
    total: results.length,
    results
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
