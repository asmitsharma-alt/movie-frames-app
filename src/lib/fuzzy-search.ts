import type { MovieInfo } from './types';

/**
 * Damerau-Levenshtein distance (insertions, deletions, substitutions, and transpositions).
 */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));

  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,        // deletion
        matrix[i][j - 1] + 1,        // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      );

      // Transposition check
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[al][bl];
}

/**
 * Phonetic & orthographic normalizer for film queries.
 * Normalizes silent letters, diphthongs, and common English spelling mistakes.
 */
export function phoneticNormalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/^kn/, 'n')          // knight -> night
    .replace(/^wr/, 'r')          // write -> rite
    .replace(/^ps/, 's')          // psycho -> sycho
    .replace(/ph/g, 'f')          // christopher -> cristofer
    .replace(/ight/g, 'ite')      // night -> nite, fight -> fite
    .replace(/ck/g, 'k')
    .replace(/sch/g, 'sh')
    .replace(/dg/g, 'j')
    .replace(/qu/g, 'kw')
    .replace(/x/g, 'ks')
    .replace(/(.)\1+/g, '$1');    // collapse double letters (oppenheimer -> openheimer, jurassic -> jurasic)
}

/**
 * Computes composite similarity & relevance score (0 - 100) between user query and candidate movie.
 * Balances text similarity with TMDB community vote weight and popularity.
 */
export function computeMovieMatchScore(
  userQuery: string,
  targetTitle: string,
  popularity = 0,
  voteCount = 0,
  hasPoster = true,
  hasYear = true
): number {
  const qClean = userQuery.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const tClean = targetTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  let textScore = 0;

  if (qClean === tClean) {
    textScore = 100;
  } else {
    const qNorm = qClean.replace(/^(the|a|an)\s+/, '');
    const tNorm = tClean.replace(/^(the|a|an)\s+/, '');

    if (qNorm === tNorm) {
      textScore = 98;
    } else {
      const dist = damerauLevenshtein(qNorm, tNorm);
      const maxLen = Math.max(qNorm.length, tNorm.length);
      const editSim = Math.max(0, 1 - dist / maxLen);

      // Substring bonus (e.g. "dark knight" inside "The Dark Knight Rises")
      let subBonus = 0;
      if (tNorm.includes(qNorm) || qNorm.includes(tNorm)) {
        subBonus = 0.20;
      }

      // Word-level token match
      const qWords = qNorm.split(/\s+/).filter(Boolean);
      const tWords = tNorm.split(/\s+/).filter(Boolean);
      let wordMatches = 0;
      for (const qw of qWords) {
        if (tWords.some(tw => tw === qw || damerauLevenshtein(phoneticNormalize(qw), phoneticNormalize(tw)) <= 1)) {
          wordMatches++;
        }
      }
      const tokenSim = qWords.length > 0 ? wordMatches / qWords.length : 0;

      textScore = Math.min(1.0, (editSim * 0.45) + (tokenSim * 0.35) + subBonus) * 100;
    }
  }

  // Popularity & vote count score (0 - 100)
  // High vote count is the #1 indicator of user intent for famous films
  const voteScore = Math.min(65, (Math.log10(voteCount + 1) / 4.5) * 65);
  const popScore = Math.min(35, (popularity / 2.5));
  const popularityScore = Math.min(100, voteScore + popScore);

  let finalScore = (textScore * 0.55) + (popularityScore * 0.45);

  // Quality adjustments
  if (!hasPoster) finalScore -= 25; // Heavily penalize movies without posters
  if (voteCount === 0 && !hasYear) finalScore -= 30; // Dead / empty TMDB placeholder
  if (voteCount < 5 && popularity < 2) finalScore -= 15; // Obscure micro-entry

  return Math.max(0, finalScore);
}

/**
 * Curated dictionary of top-tier iconic films with known TMDB IDs and spellings.
 */
export const POPULAR_CINEMA_MAP: Record<string, { id: string; canonical: string; year: string }> = {
  'interstellar': { id: '157336', canonical: 'Interstellar', year: '2014' },
  'inception': { id: '27205', canonical: 'Inception', year: '2010' },
  'oppenheimer': { id: '872585', canonical: 'Oppenheimer', year: '2023' },
  'gladiator': { id: '98', canonical: 'Gladiator', year: '2000' },
  'blade runner': { id: '78', canonical: 'Blade Runner', year: '1982' },
  'blade runner 2049': { id: '335984', canonical: 'Blade Runner 2049', year: '2017' },
  'the godfather': { id: '238', canonical: 'The Godfather', year: '1972' },
  'fight club': { id: '550', canonical: 'Fight Club', year: '1999' },
  'pulp fiction': { id: '680', canonical: 'Pulp Fiction', year: '1994' },
  'the dark knight': { id: '155', canonical: 'The Dark Knight', year: '2008' },
  'the matrix': { id: '603', canonical: 'The Matrix', year: '1999' },
  'shutter island': { id: '11324', canonical: 'Shutter Island', year: '2010' },
  'jurassic park': { id: '329', canonical: 'Jurassic Park', year: '1993' },
  'the shawshank redemption': { id: '278', canonical: 'The Shawshank Redemption', year: '1994' },
  'forrest gump': { id: '13', canonical: 'Forrest Gump', year: '1994' },
  'the avengers': { id: '24428', canonical: 'The Avengers', year: '2012' },
  'spider-man': { id: '557', canonical: 'Spider-Man', year: '2002' },
  'dune': { id: '438631', canonical: 'Dune', year: '2021' },
  'dune: part two': { id: '693134', canonical: 'Dune: Part Two', year: '2024' },
  '2001: a space odyssey': { id: '62', canonical: '2001: A Space Odyssey', year: '1968' },
  'whiplash': { id: '244786', canonical: 'Whiplash', year: '2014' },
  'parasite': { id: '496243', canonical: 'Parasite', year: '2019' },
  'spirited away': { id: '129', canonical: 'Spirited Away', year: '2001' },
  'inglourious basterds': { id: '16869', canonical: 'Inglourious Basterds', year: '2009' },
  'django unchained': { id: '68718', canonical: 'Django Unchained', year: '2012' },
  'apocalypse now': { id: '28', canonical: 'Apocalypse Now', year: '1979' },
  'goodfellas': { id: '769', canonical: 'GoodFellas', year: '1990' },
  'the silence of the lambs': { id: '274', canonical: 'The Silence of the Lambs', year: '1991' },
  'se7en': { id: '807', canonical: 'Se7en', year: '1995' },
  'the prestige': { id: '1124', canonical: 'The Prestige', year: '2006' },
  'memento': { id: '77', canonical: 'Memento', year: '2000' },
  'star wars': { id: '11', canonical: 'Star Wars', year: '1977' },
  'the terminator': { id: '218', canonical: 'The Terminator', year: '1984' },
  'terminator 2: judgment day': { id: '280', canonical: 'Terminator 2: Judgment Day', year: '1991' },
  'alien': { id: '348', canonical: 'Alien', year: '1979' },
  'aliens': { id: '679', canonical: 'Aliens', year: '1986' },
  'titanic': { id: '597', canonical: 'Titanic', year: '1997' },
  'back to the future': { id: '105', canonical: 'Back to the Future', year: '1985' },
  'the departed': { id: '1422', canonical: 'The Departed', year: '2006' },
  'saving private ryan': { id: '857', canonical: 'Saving Private Ryan', year: '1998' },
  'the green mile': { id: '497', canonical: 'The Green Mile', year: '1999' },
  'la la land': { id: '313369', canonical: 'La La Land', year: '2016' },
  'arrival': { id: '329865', canonical: 'Arrival', year: '2016' },
  'mad max: fury road': { id: '76341', canonical: 'Mad Max: Fury Road', year: '2015' },
  'the grand budapest hotel': { id: '120467', canonical: 'The Grand Budapest Hotel', year: '2014' },
  'no country for old men': { id: '6977', canonical: 'No Country for Old Men', year: '2007' },
  'there will be blood': { id: '7345', canonical: 'There Will Be Blood', year: '2007' },
  'everything everywhere all at once': { id: '545611', canonical: 'Everything Everywhere All at Once', year: '2022' },
  'poor things': { id: '792307', canonical: 'Poor Things', year: '2023' },
  'barbie': { id: '346698', canonical: 'Barbie', year: '2023' }
};

/**
 * Generates intelligent candidate search queries from a potentially misspelled raw query.
 */
export function generateCandidateQueries(rawQuery: string): string[] {
  const list: string[] = [];
  const clean = rawQuery.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  list.push(clean);

  // 1. Direct typo dictionary & known phonetics
  const directMap: Record<string, string> = {
    'intersteller': 'interstellar',
    'interstelar': 'interstellar',
    'inceptoin': 'inception',
    'inceptin': 'inception',
    'oppenhimer': 'oppenheimer',
    'oppenhiemer': 'oppenheimer',
    'openheimer': 'oppenheimer',
    'gladiater': 'gladiator',
    'gladiatr': 'gladiator',
    'shutter iland': 'shutter island',
    'fite club': 'fight club',
    'godfater': 'godfather',
    'the dark nite': 'the dark knight',
    'dark nite': 'the dark knight',
    'jurasic park': 'jurassic park',
    'bladerunner': 'blade runner',
    'shawshnk': 'shawshank redemption',
    'avangers': 'the avengers',
    'avanger': 'the avengers',
    'spiderman': 'spider-man',
    'bat man': 'batman',
    'matrx': 'matrix',
    'pulp fictin': 'pulp fiction',
    'forst gump': 'forrest gump',
    'inglorius basterds': 'inglourious basterds',
    'apocolypse now': 'apocalypse now',
    'sprited away': 'spirited away',
    'duen': 'dune',
    'duen 2': 'dune part two',
    'casablanka': 'casablanca',
    'whiplsh': 'whiplash',
    'terminater': 'terminator'
  };

  if (directMap[clean]) {
    list.push(directMap[clean]);
  }

  // 2. Curated Cinema index fuzzy match check
  for (const [key, val] of Object.entries(POPULAR_CINEMA_MAP)) {
    const dist = damerauLevenshtein(clean.replace(/^(the|a|an)\s+/, ''), key.replace(/^(the|a|an)\s+/, ''));
    if (dist <= 2 || clean.includes(key) || key.includes(clean)) {
      list.push(val.canonical);
      break;
    }
  }

  // 3. Suffix variations (er / or / ar)
  if (clean.endsWith('er')) {
    list.push(clean.slice(0, -2) + 'or');
    list.push(clean.slice(0, -2) + 'ar');
  } else if (clean.endsWith('or')) {
    list.push(clean.slice(0, -2) + 'er');
  } else if (clean.endsWith('ar')) {
    list.push(clean.slice(0, -2) + 'er');
    list.push(clean.slice(0, -2) + 'or');
  }

  // 4. Phonetic diphthong substitutions
  if (clean.includes('ite')) list.push(clean.replace(/ite/g, 'ight'));
  if (clean.includes('ight')) list.push(clean.replace(/ight/g, 'ite'));
  if (clean.includes('ie')) list.push(clean.replace(/ie/g, 'ei'));
  if (clean.includes('ei')) list.push(clean.replace(/ei/g, 'ie'));
  if (clean.includes('ph')) list.push(clean.replace(/ph/g, 'f'));

  // 5. Double letter deduplication
  const dedup = clean.replace(/(.)\1+/g, '$1');
  if (dedup !== clean) list.push(dedup);

  // 6. Multi-word individual components
  const words = clean.split(' ').filter(w => w.length >= 4 && !['the', 'and', 'part', 'movie', 'film'].includes(w));
  for (const w of words) {
    list.push(w);
  }

  // 7. Stems (truncation by 1 and 2 characters)
  if (clean.length > 5) {
    list.push(clean.slice(0, -1));
    list.push(clean.slice(0, -2));
  }

  // Return deduplicated list, bounded to top 6 queries for parallel speed
  return Array.from(new Set(list)).slice(0, 6);
}
