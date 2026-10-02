-- Cinema App Backend Migration
-- Tables: movies, showtimes, bookings

-- 1. Movies table
CREATE TABLE IF NOT EXISTS public.movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  poster_url TEXT,
  plot TEXT,
  runtime TEXT,
  genre TEXT,
  year TEXT,
  rating TEXT,
  director TEXT,
  cast_members TEXT,
  language TEXT,
  certificate TEXT,
  status TEXT DEFAULT 'NOW_SHOWING',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Showtimes table
CREATE TABLE IF NOT EXISTS public.showtimes (
  id TEXT PRIMARY KEY,
  movie_id TEXT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  show_date TEXT NOT NULL,
  show_time TEXT NOT NULL,
  blocked_seats JSONB DEFAULT '[]'::jsonb,
  locked_seats JSONB DEFAULT '[]'::jsonb,
  total_seats INTEGER DEFAULT 197,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  showtime_id TEXT NOT NULL REFERENCES public.showtimes(id) ON DELETE CASCADE,
  seats JSONB NOT NULL DEFAULT '[]'::jsonb,
  employee_id TEXT,
  movie_snapshot JSONB,
  showtime_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_showtimes_movie_id ON public.showtimes(movie_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_showtime_id ON public.bookings(showtime_id);

-- 5. Enable RLS
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies — open access (app uses localStorage auth, not Supabase auth)
DROP POLICY IF EXISTS "open_access_movies" ON public.movies;
CREATE POLICY "open_access_movies" ON public.movies FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_showtimes" ON public.showtimes;
CREATE POLICY "open_access_showtimes" ON public.showtimes FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_bookings" ON public.bookings;
CREATE POLICY "open_access_bookings" ON public.bookings FOR ALL TO public USING (true) WITH CHECK (true);
