import { queryString, readTmdbToken, tmdbGet } from './_tmdb';

type Request = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};
type Response = {
  status(code: number): Response;
  json(body: unknown): void;
};
type TmdbVideo = {
  key: string;
  site: string;
  type: string;
  official?: boolean;
  name?: string;
};

export default async function handler(request: Request, response: Response) {
  if (request.method && request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const token = readTmdbToken();
  if (!token) return response.status(200).json({ configured: false, key: '' });

  const mediaType = queryString(request.query.type) === 'tv' ? 'tv' : 'movie';
  const tmdbId = Number(queryString(request.query.id));
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return response.status(400).json({ error: 'A valid title ID is required.' });
  }

  try {
    const tmdbResponse = await tmdbGet('/' + mediaType + '/' + tmdbId + '/videos?language=en-US', token);
    if (!tmdbResponse.ok) {
      return response.status(502).json({ error: 'The trailer lookup failed.' });
    }
    const payload = await tmdbResponse.json() as { results?: TmdbVideo[] };
    const videos = (payload.results || [])
      .filter(video => video.site === 'YouTube' && video.key && ['Trailer', 'Teaser'].includes(video.type))
      .sort((a, b) => Number(Boolean(b.official)) - Number(Boolean(a.official)));
    return response.status(200).json({ key: videos[0]?.key || '', results: videos });
  } catch {
    console.warn('TMDB trailer lookup failed.');
    return response.status(502).json({ error: 'The trailer service is temporarily unavailable.' });
  }
}
