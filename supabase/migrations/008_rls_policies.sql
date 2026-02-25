-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, users can update own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Spots: anyone can read, authenticated can insert
CREATE POLICY "Spots are viewable by everyone"
  ON spots FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create spots"
  ON spots FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reports: anyone can read, authenticated can insert
CREATE POLICY "Reports are viewable by everyone"
  ON reports FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
