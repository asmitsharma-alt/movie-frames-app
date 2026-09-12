import type { MovieInfo } from './types';
import { generateCandidateQueries, computeMovieMatchScore, POPULAR_CINEMA_MAP } from './fuzzy-search';

// Pre-seeded database for when no TMDB key is configured or offline
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
  },
  '550': {
    tmdbId: '550',
    title: 'Fight Club',
    year: '1999',
    director: 'David Fincher',
    posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
    aspectRatio: '2.39:1 Super 35'
  },
  '680': {
    tmdbId: '680',
    title: 'Pulp Fiction',
    year: '1994',
    director: 'Quentin Tarantino',
    posterUrl: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in four tales of violence and redemption.',
    aspectRatio: '2.35:1 Panavision'
  },
  '155': {
    tmdbId: '155',
    title: 'The Dark Knight',
    year: '2008',
    director: 'Christopher Nolan',
    posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.',
    aspectRatio: '2.39:1 / 70mm IMAX'
  },
  '603': {
    tmdbId: '603',
    title: 'The Matrix',
    year: '1999',
    director: 'The Wachowskis',
    posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/l4QHerTSbflqI9ifnvSTqW5WwI.jpg',
    overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers.',
    aspectRatio: '2.39:1 Panavision'
  },
  '98': {
    tmdbId: '98',
    title: 'Gladiator',
    year: '2000',
    director: 'Ridley Scott',
    posterUrl: 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/h7hgtvj0ZpIuh4e4gq9h0W7c7mJ.jpg',
    overview: 'In the year 180, the death of emperor Marcus Aurelius throws the Roman Empire into turmoil.',
    aspectRatio: '2.39:1 Super 35'
  },
  '11324': {
    tmdbId: '11324',
    title: 'Shutter Island',
    year: '2010',
    director: 'Martin Scorsese',
    posterUrl: 'https://image.tmdb.org/t/p/w500/4GDy0PHYX3VRXUtwK5ysagvk2Te.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/cCTScg1uI4g60L46jFkG9tHqT6G.jpg',
    overview: 'World War II soldier-turned-U.S. Marshal Teddy Daniels investigates the disappearance of a patient from Boston\'s Shutter Island Ashecliffe Hospital.',
    aspectRatio: '2.39:1 Panavision'
  }
};

/**
 * Searches TMDB for movies matching the query string with intelligent typo-tolerance,
 * phonetic normalization, candidate generation, and popularity re-ranking.
 */
export async function searchTmdbMovies(query: string, apiKey?: string): Promise<MovieInfo[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  // Generate typo permutations, phonetic variations, and prefix stems
  const candidateQueries = generateCandidateQueries(cleanQuery);
  const candidatesMap = new Map<string, any>();

  if (apiKey) {
    // Execute search requests in parallel across candidate variations
    await Promise.all(
      candidateQueries.map(async (cq) => {
        try {
          const res = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(cq)}&include_adult=false`
          );
          if (res.ok) {
            const data = await res.json();
            for (const m of (data.results || [])) {
              if (!candidatesMap.has(String(m.id))) {
                candidatesMap.set(String(m.id), m);
              }
            }
          }
        } catch (err) {
          console.warn(`TMDB search error for variation "${cq}":`, err);
        }
      })
    );
  }

  // If TMDB provided candidates, score and rerank them
  if (candidatesMap.size > 0) {
    const scoredList: (MovieInfo & { matchScore: number })[] = [];

    for (const m of candidatesMap.values()) {
      const hasPoster = Boolean(m.poster_path);
      const hasYear = Boolean(m.release_date);
      const popularity = Number(m.popularity) || 0;
      const voteCount = Number(m.vote_count) || 0;

      const score = computeMovieMatchScore(
        cleanQuery,
        m.title || '',
        popularity,
        voteCount,
        hasPoster,
        hasYear
      );

      // Only include candidates that meet the quality threshold
      if (score >= 25) {
        scoredList.push({
          tmdbId: String(m.id),
          title: m.title,
          year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
          posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : undefined,
          backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
          overview: m.overview,
          aspectRatio: '35mm Widescreen',
          matchScore: score
        });
      }
    }

    // Sort descending: highest relevance + popularity first
    scoredList.sort((a, b) => b.matchScore - a.matchScore);

    if (scoredList.length > 0) {
      return scoredList.slice(0, 12);
    }
  }

  // Fallback: Score against offline curated catalog if offline or 0 TMDB matches
  const offlineScored: (MovieInfo & { matchScore: number })[] = [];
  for (const movie of Object.values(FALLBACK_MOVIES)) {
    const score = computeMovieMatchScore(cleanQuery, movie.title, 50, 20000, true, true);
    if (score >= 25) {
      offlineScored.push({
        ...movie,
        matchScore: score
      });
    }
  }

  offlineScored.sort((a, b) => b.matchScore - a.matchScore);
  return offlineScored;
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
