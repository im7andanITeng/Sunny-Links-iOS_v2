CREATE TABLE public.players (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT 'Golfer' CHECK (char_length(name) BETWEEN 1 AND 24),
  tag text NOT NULL DEFAULT '' CHECK (char_length(tag) <= 24),
  levels_passed integer NOT NULL DEFAULT 0 CHECK (levels_passed >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Anyone can add a player" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update a player" ON public.players FOR UPDATE USING (true) WITH CHECK (true);
CREATE INDEX players_levels_idx ON public.players (levels_passed DESC);