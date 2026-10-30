
export function queryString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export function readTmdbToken(): string {
  return process.env.TMDB_READ_ACCESS_TOKEN || '';
}

export async function tmdbGet(path: string, token: string): Promise<Response> {
  return fetch('https://api.themoviedb.org/3' + path, {
    headers: { Authorization: 'Bearer ' + token, accept: 'application/json' },
  });
}
