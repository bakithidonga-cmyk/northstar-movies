import { queryString, readTmdbToken, tmdbGet } from './_tmdb';

type Request = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};
type Response = {
  status(code: number): Response;
  json(body: unknown): void;
};
type TmdbItem = {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
};

const genreNames: Record<number, string> = {
  12: 'Adventure', 14: 'Fantasy', 16: 'Animation', 18: 'Drama', 27: 'Horror',
  28: 'Action', 35: 'Comedy', 36: 'History', 37: 'Western', 53: 'Thriller',
  80: 'Crime', 878: 'Sci-Fi', 9648: 'Mystery', 10749: 'Romance', 10751: 'Family',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
  10770: 'TV Movie', 99: 'Documentary', 10402: 'Music',
};

export default async function handler(request: Request, response: Response) {
  if (request.method && request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const token = readTmdbToken();
  if (!token) return response.status(200).json({ configured: false, results: [] });

  const term = queryString(request.query.q).trim();
  const requestedType = queryString(request.query.type);
  const type = requestedType === 'movie' || requestedType === 'tv' ? requestedType : 'all';
  const route = term
    ? '/search/multi'
    : type === 'all'
      ? '/trending/all/week'
      : '/trending/' + type + '/week';
  const params = new URLSearchParams({ language: 'en-US' });
  if (term) {
    params.set('query', term);
    params.set('include_adult', 'false');
    params.set('page', '1');
  }

  try {
    const tmdbResponse = await tmdbGet(route + '?' + params.toString(), token);
    if (!tmdbResponse.ok) {
      console.warn('TMDB catalog request returned status ' + tmdbResponse.status);
      return response.status(502).json({ error: 'The catalog request failed. Check the TMDB token and retry.' });
    }

    const payload = await tmdbResponse.json() as { results?: TmdbItem[] };
    const results = (payload.results || [])
      .filter(item => item.media_type !== 'person' && item.id && (item.title || item.name))
      .map(item => {
        const mediaType = item.media_type === 'tv' || type === 'tv' ? 'tv' : 'movie';
        const imagePath = item.backdrop_path || item.poster_path || '';
        return {
          id: mediaType + ':' + item.id,
          tmdbId: item.id,
          mediaType,
          name: item.title || item.name || 'Untitled',
          kind: mediaType,
          year: (item.release_date || item.first_air_date || '').slice(0, 4) || '—',
          rating: typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : '—',
          synopsis: item.overview || 'No synopsis is available yet.',
          image: imagePath ? 'https://image.tmdb.org/t/p/w780' + imagePath : '',
          accent: item.genre_ids?.map(id => genreNames[id]).find(Boolean) || '',
        };
      });
    return response.status(200).json({ configured: true, results });
  } catch {
    console.warn('TMDB catalog request failed.');
    return response.status(502).json({ error: 'The movie catalog is temporarily unavailable. Please retry.' });
  }
}
