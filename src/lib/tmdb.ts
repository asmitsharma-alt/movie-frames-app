import type { MovieInfo } from './types';

// Pre-seeded database for when no TMDB key is configured yet
const FALLBACK_MOVIES: Record<string, MovieInfo> = {
  '157336': {
    tmdbId: '157336',
    title: 'Interstellar',
    year: '2014',
    director: 'Christopher Nolan',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
    aspectRatio: '2.39:1 / 70mm IMAX'
  },
  '335984': {
    tmdbId: '335984',
    title: 'Blade Runner 2049',
    year: '2017',
    director: 'Denis Villeneuve',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/sAtoMqDVhNDQBc3QJL3RF6hl7qB.jpg',
    overview: 'Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret.',
    aspectRatio: '2.39:1 Anamorphic'
  },
  '62': {
    tmdbId: '62',
    title: '2001: A Space Odyssey',
    year: '1968',
    director: 'Stanley Kubrick',
    posterUrl: 'https://image.tmdb.org/t/p/w500/ve72VxNqjGM69UmKAdORE9VJIRP.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/m5VO3rIeL0wO0gYlQxXp1C7uB5f.jpg',
    overview: 'Humanity finds a mysterious object buried beneath the lunar surface and sets off to find its origins with the help of HAL 9000.',
    aspectRatio: '2.20:1 Super Panavision 70'
  },
  '438631': {
    tmdbId: '438631',
    title: 'Dune',
    year: '2021',
    director: 'Denis Villeneuve',
    posterUrl: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg',
    overview: 'Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet.',
    aspectRatio: '2.39:1 / IMAX 1.43:1'
  },
  '27205': {
    tmdbId: '27205',
    title: 'Inception',
    year: '2010',
    director: 'Christopher Nolan',
    posterUrl: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life.',
    aspectRatio: '2.39:1 Panavision'
  },
  '872585': {
    tmdbId: '872585',
    title: 'Oppenheimer',
    year: '2023',
    director: 'Christopher Nolan',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.',
    aspectRatio: '2.20:1 / 70mm IMAX'
  }
};

/**
 * Searches TMDB for movies matching the query string
 */
export async function searchTmdbMovies(query: string, apiKey?: string): Promise<MovieInfo[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  // If real TMDB key is provided, query the real TMDB API
  if (apiKey) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(cleanQuery)}&include_adult=false`);
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).slice(0, 8).map((m: any) => ({
          tmdbId: String(m.id),
          title: m.title,
          year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
          posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : undefined,
          backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
          overview: m.overview
        }));
      }
    } catch (err) {
      console.warn('TMDB API fetch error, falling back to local catalog:', err);
    }
  }

  // Fallback search over curated offline catalog
  return Object.values(FALLBACK_MOVIES).filter(m => 
    m.title.toLowerCase().includes(cleanQuery) || 
    (m.director && m.director.toLowerCase().includes(cleanQuery))
  );
}

/**
 * Gets movie metadata for a specific TMDB ID
 */
export async function getTmdbMovieDetails(tmdbId: string, apiKey?: string): Promise<MovieInfo> {
  if (apiKey) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits`);
      if (res.ok) {
        const m = await res.json();
        const director = (m.credits?.crew || []).find((c: any) => c.job === 'Director')?.name || 'Unknown';
        return {
          tmdbId: String(m.id),
          title: m.title,
          year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
          director,
          posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : undefined,
          backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
          overview: m.overview,
          aspectRatio: '35mm / Anamorphic'
        };
      }
    } catch (err) {
      console.warn('TMDB details fetch error:', err);
    }
  }

  if (FALLBACK_MOVIES[tmdbId]) {
    return FALLBACK_MOVIES[tmdbId];
  }

  return {
    tmdbId,
    title: `Film Archive #${tmdbId}`,
    year: 'N/A',
    director: 'Independent Cinema Archive',
    overview: 'Community-curated cinematography stills and frames.'
  };
}

/**
 * Fetches official high-res backdrops and production stills from TMDB
 */
export async function getTmdbMovieBackdrops(tmdbId: string, apiKey?: string): Promise<any[]> {
  if (!apiKey) return [];
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/images?api_key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      const backdrops = data.backdrops || [];
      return backdrops.slice(0, 9).map((b: any, index: number) => ({
        id: `tmdb-still-${tmdbId}-${index}`,
        url: `https://image.tmdb.org/t/p/w1280${b.file_path}`,
        timestamp: `Still #${index + 1}`,
        tag: 'Official 35mm Still',
        aspectRatio: b.aspect_ratio ? `${(b.aspect_ratio).toFixed(2)}:1` : '2.39:1',
        uploadedAt: new Date().toISOString()
      }));
    }
  } catch (err) {
    console.warn('Failed to fetch TMDB movie images:', err);
  }
  return [];
}
