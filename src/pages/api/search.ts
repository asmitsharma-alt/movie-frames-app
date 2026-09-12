import type { APIRoute } from 'astro';
import { searchTmdbMovies } from '../../lib/tmdb';
import { getAppEnv } from '../../lib/env';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q') || '';
  
  if (!query.trim()) {
    return new Response(JSON.stringify({ status: 'success', results: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const appEnv = getAppEnv();
  const apiKey = appEnv?.TMDB_API_KEY || (typeof process !== 'undefined' ? process.env?.TMDB_API_KEY : undefined);
  const results = await searchTmdbMovies(query, apiKey);

  return new Response(JSON.stringify({
    status: 'success',
    query,
    topMatch: results[0]?.title || null,
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
