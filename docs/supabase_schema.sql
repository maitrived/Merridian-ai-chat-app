-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canvases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nodes JSONB DEFAULT '[]'::jsonb,
  edges JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 3. Cleanup existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can only see their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can only insert their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can only update their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can only delete their own sessions" ON sessions;

DROP POLICY IF EXISTS "Users can only see messages from their own sessions" ON messages;
DROP POLICY IF EXISTS "Users can only insert messages into their own sessions" ON messages;

DROP POLICY IF EXISTS "Users can only see their own canvases" ON canvases;
DROP POLICY IF EXISTS "Users can only update their own canvases" ON canvases;
DROP POLICY IF EXISTS "Users can only insert their own canvases" ON canvases;

DROP POLICY IF EXISTS "Users can only see their own documents" ON documents;
DROP POLICY IF EXISTS "Users can only insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can only delete their own documents" ON documents;

-- 4. Create Policies for 'sessions'
CREATE POLICY "Users can only see their own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

-- 5. Create Policies for 'messages'
CREATE POLICY "Users can only see messages from their own sessions" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = messages.session_id AND sessions.user_id = auth.uid()));
CREATE POLICY "Users can only insert messages into their own sessions" ON messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = messages.session_id AND sessions.user_id = auth.uid()));

-- 6. Create Policies for 'canvases'
CREATE POLICY "Users can only see their own canvases" ON canvases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only update their own canvases" ON canvases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own canvases" ON canvases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Create Policies for 'documents'
CREATE POLICY "Users can only see their own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own documents" ON documents FOR DELETE USING (auth.uid() = user_id);
