-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  status TEXT CHECK (status IN ('lobby', 'in_progress', 'finished')) DEFAULT 'lobby',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  prompt TEXT NOT NULL,
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Votes table
CREATE TABLE votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id),
  voted_for_submission_id UUID REFERENCES submissions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, voter_id)
);

-- Tournament participants junction table
CREATE TABLE tournament_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Tournaments policies
CREATE POLICY "Anyone can view tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Anyone can create tournaments" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tournaments" ON tournaments FOR UPDATE USING (true);

-- Matches policies
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Anyone can create matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update matches" ON matches FOR UPDATE USING (true);

-- Submissions policies
CREATE POLICY "Anyone can view submissions" ON submissions FOR SELECT USING (true);
CREATE POLICY "Users can create own submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON submissions FOR UPDATE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Anyone can view votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Users can create own votes" ON votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Tournament participants policies
CREATE POLICY "Anyone can view participants" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "Users can join tournaments" ON tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for tournament management
CREATE OR REPLACE FUNCTION get_tournament_participants(tournament_uuid UUID)
RETURNS TABLE(id UUID, username TEXT, created_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.created_at
  FROM tournament_participants tp
  JOIN users u ON tp.user_id = u.id
  WHERE tp.tournament_id = tournament_uuid
  ORDER BY tp.joined_at;
END;
$$ LANGUAGE plpgsql;

-- Function to create tournament matches
CREATE OR REPLACE FUNCTION create_tournament_matches(tournament_uuid UUID, participants UUID[])
RETURNS VOID AS $$
DECLARE
  i INTEGER;
  match_prompt TEXT;
  num_participants INTEGER;
  num_matches INTEGER;
  prompts TEXT[] := ARRAY[
    'A magical forest at sunset with glowing mushrooms',
    'A cyberpunk city street in the rain at night',
    'A cozy cabin in the mountains during winter',
    'An underwater palace with colorful coral gardens',
    'A steampunk airship floating above the clouds',
    'A desert oasis with ancient ruins in the background',
    'A space station orbiting a distant planet',
    'A medieval castle on a cliff overlooking the ocean'
  ];
BEGIN
  num_participants := array_length(participants, 1);
  num_matches := num_participants / 2;
  
  -- Create first round matches based on number of participants
  FOR i IN 1..num_matches LOOP
    -- Select random prompt
    match_prompt := prompts[1 + (random() * (array_length(prompts, 1) - 1))::INTEGER];
    
    INSERT INTO matches (tournament_id, round, player1_id, player2_id, prompt)
    VALUES (
      tournament_uuid,
      1,
      participants[i * 2 - 1],
      participants[i * 2],
      match_prompt
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
