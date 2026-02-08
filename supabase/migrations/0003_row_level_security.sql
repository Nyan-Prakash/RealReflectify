-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
-- This ensures users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE parse_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_topic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS table policies
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- ENTRIES table policies
-- ============================================================================

-- Users can view their own entries
CREATE POLICY "Users can view own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can create entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PARSE RUNS table policies
-- ============================================================================

CREATE POLICY "Users can view own parse runs"
  ON parse_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create parse runs"
  ON parse_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parse runs"
  ON parse_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- EVENTS table policies
-- ============================================================================

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ENTITIES table policies
-- ============================================================================

CREATE POLICY "Users can view own entities"
  ON entities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create entities"
  ON entities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entities"
  ON entities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entities"
  ON entities FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MENTIONS table policies
-- ============================================================================

CREATE POLICY "Users can view own mentions"
  ON mentions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create mentions"
  ON mentions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mentions"
  ON mentions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mentions"
  ON mentions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- THREADS table policies
-- ============================================================================

CREATE POLICY "Users can view own threads"
  ON threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create threads"
  ON threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threads"
  ON threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own threads"
  ON threads FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- THREAD LINKS table policies
-- ============================================================================

CREATE POLICY "Users can view own thread links"
  ON thread_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create thread links"
  ON thread_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thread links"
  ON thread_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own thread links"
  ON thread_links FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RELATIONSHIP MOMENTS table policies
-- ============================================================================

CREATE POLICY "Users can view own relationship moments"
  ON relationship_moments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create relationship moments"
  ON relationship_moments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationship moments"
  ON relationship_moments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own relationship moments"
  ON relationship_moments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TOPICS table policies
-- ============================================================================

CREATE POLICY "Users can view own topics"
  ON topics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create topics"
  ON topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topics"
  ON topics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topics"
  ON topics FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ENTRY TOPIC LINKS table policies
-- ============================================================================

CREATE POLICY "Users can view own entry topic links"
  ON entry_topic_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create entry topic links"
  ON entry_topic_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entry topic links"
  ON entry_topic_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entry topic links"
  ON entry_topic_links FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ENTITY MERGES table policies
-- ============================================================================

CREATE POLICY "Users can view own entity merges"
  ON entity_merges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create entity merges"
  ON entity_merges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- AUDIT LOGS table policies
-- ============================================================================

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================

-- Grant authenticated users access to public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant access to all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant access to sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
