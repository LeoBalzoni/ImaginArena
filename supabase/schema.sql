-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users for real users, standalone for bots)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  status TEXT CHECK (status IN ('lobby', 'in_progress', 'finished')) DEFAULT 'lobby',
  tournament_size INTEGER CHECK (tournament_size IN (2, 4, 8, 16, 32)) DEFAULT 16,
  language TEXT CHECK (language IN ('en', 'it')) DEFAULT 'en',
  admin_ended BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
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
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id AND is_bot = false);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id AND is_bot = false);
CREATE POLICY "Admins can create bot users" ON users FOR INSERT WITH CHECK (
  is_bot = true AND EXISTS (
    SELECT 1 FROM users admin_user
    WHERE admin_user.id = auth.uid() 
    AND admin_user.is_admin = true
  )
);
CREATE POLICY "Admins can update bot users" ON users FOR UPDATE USING (
  is_bot = true AND EXISTS (
    SELECT 1 FROM users admin_user
    WHERE admin_user.id = auth.uid() 
    AND admin_user.is_admin = true
  )
);
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users admin_user
    WHERE admin_user.id = auth.uid() 
    AND admin_user.is_admin = true
  )
);

-- Tournaments policies
CREATE POLICY "Anyone can view tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Anyone can create tournaments" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tournaments" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Admins can delete tournaments" ON tournaments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

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
CREATE POLICY "Users can join tournaments" ON tournament_participants FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM users WHERE id = user_id AND is_bot = false
  )
);
CREATE POLICY "Admins can add bot users to tournaments" ON tournament_participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users bot_user WHERE bot_user.id = user_id AND bot_user.is_bot = true
  ) AND EXISTS (
    SELECT 1 FROM users admin_user
    WHERE admin_user.id = auth.uid() 
    AND admin_user.is_admin = true
  )
);

-- Functions for tournament management
CREATE OR REPLACE FUNCTION get_tournament_participants(tournament_uuid UUID)
RETURNS TABLE(id UUID, username TEXT, is_bot BOOLEAN, is_admin BOOLEAN, created_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.is_bot, u.is_admin, u.created_at
  FROM tournament_participants tp
  JOIN users u ON tp.user_id = u.id
  WHERE tp.tournament_id = tournament_uuid
  ORDER BY tp.joined_at;
END;
$$ LANGUAGE plpgsql;

-- Migration: Add is_admin column to existing users (if not already added)
-- This will set all existing users to is_admin = false by default
DO $$ 
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Update any existing users that don't have the is_admin field set
    UPDATE users SET is_admin = FALSE WHERE is_admin IS NULL;
END $$;

-- Function to make a user admin (for initial setup)
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET is_admin = TRUE 
    WHERE id IN (
        SELECT id FROM auth.users WHERE email = user_email
    );
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
END;
$$ LANGUAGE plpgsql;
