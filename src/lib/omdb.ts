// BACKEND INTEGRATION POINT: This service calls OMDb API
// In production, proxy through your backend to protect the API key

export interface OMDbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OMDbSearchResponse {
  Search?: OMDbSearchResult[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

export interface OMDbMovieDetail {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Language: string;
  Poster: string;
  imdbRating: string;
  imdbID: string;
  Response: string;
  Error?: string;
}

export async function searchOMDb(
  query: string,
  apiKey: string
): Promise<OMDbSearchResponse> {
  // BACKEND INTEGRATION POINT: Replace with backend proxy call
  const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network error');
  return response.json();
}

export async function getMovieDetails(
  imdbID: string,
  apiKey: string
): Promise<OMDbMovieDetail> {
  // BACKEND INTEGRATION POINT: Replace with backend proxy call
  const url = `https://www.omdbapi.com/?i=${imdbID}&plot=full&apikey=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network error');
  return response.json();
}