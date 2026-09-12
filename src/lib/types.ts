export interface Frame {
  id: string;
  url: string;             // Direct Catbox link (e.g. https://files.catbox.moe/xxxx.webp)
  timestamp: string;       // e.g. "01:42:15"
  tag?: string;            // e.g. "Gargantua Accretion Disk"
  aspectRatio?: string;    // e.g. "2.39:1"
  uploadedAt: string;      // ISO string
}

export interface MovieInfo {
  tmdbId: string;
  title: string;
  year: string;
  director?: string;
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  aspectRatio?: string;
}

export interface MovieFramesResponse {
  status: 'success' | 'error';
  tmdbId: string;
  movie: MovieInfo;
  totalFrames: number;
  frames: Frame[];
}
