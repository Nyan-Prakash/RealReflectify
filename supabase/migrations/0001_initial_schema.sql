-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- Note: Supabase Auth users are stored in auth.users
-- This table extends auth.users with application-specific data
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX users_email_idx ON users(email);

-- ============================================================================
-- ENTRIES (Raw journal entries - source of truth)
-- ============================================================================

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  parse_status TEXT NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
  last_parsed_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX entries_user_id_idx ON entries(user_id);
CREATE INDEX entries_occurred_at_idx ON entries(occurred_at);
CREATE INDEX entries_parse_status_idx ON entries(parse_status);
CREATE INDEX entries_user_occurred_idx ON entries(user_id, occurred_at);

-- ============================================================================
-- PARSE RUNS (Audit trail of AI processing)
-- ============================================================================

CREATE TABLE parse_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  model TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,

  error_message TEXT,
  pipeline_version TEXT
);

CREATE INDEX parse_runs_entry_id_idx ON parse_runs(entry_id);

-- ============================================================================
-- EVENTS (Extracted happenings)
-- ============================================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  parse_run_id UUID REFERENCES parse_runs(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL CHECK (event_type IN ('meeting', 'task', 'deadline', 'milestone', 'appointment', 'social', 'work', 'exercise', 'meal', 'travel', 'other')),

  title TEXT NOT NULL,
  description TEXT,

  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT FALSE,

  extracted_text TEXT,
  confidence_score DECIMAL(3,2),

  is_user_confirmed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX events_user_id_idx ON events(user_id);
CREATE INDEX events_entry_id_idx ON events(entry_id);
CREATE INDEX events_start_date_idx ON events(start_date);
CREATE INDEX events_user_start_date_idx ON events(user_id, start_date);

-- ============================================================================
-- ENTITIES (Canonical People, Places, Organizations, etc.)
-- ============================================================================

CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'place', 'organization', 'food', 'activity', 'thing')),

  canonical_name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',

  metadata JSONB DEFAULT '{}'::jsonb,

  is_archived BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX entities_user_type_idx ON entities(user_id, entity_type);
CREATE INDEX entities_canonical_name_idx ON entities(canonical_name);
CREATE UNIQUE INDEX entities_unique_idx ON entities(user_id, entity_type, LOWER(canonical_name));

-- ============================================================================
-- MENTIONS (Links entities to text spans in entries)
-- ============================================================================

CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  parse_run_id UUID REFERENCES parse_runs(id) ON DELETE SET NULL,

  mentioned_as TEXT NOT NULL,
  context TEXT,

  role TEXT DEFAULT 'participant' CHECK (role IN ('subject', 'participant', 'object', 'location', 'food', 'activity', 'other')),

  confidence_score DECIMAL(3,2),
  is_user_confirmed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX mentions_user_id_idx ON mentions(user_id);
CREATE INDEX mentions_entry_id_idx ON mentions(entry_id);
CREATE INDEX mentions_entity_id_idx ON mentions(entity_id);
CREATE INDEX mentions_event_id_idx ON mentions(event_id);
CREATE UNIQUE INDEX mentions_unique_idx ON mentions(entry_id, entity_id);

-- ============================================================================
-- THREADS (Long-running story arcs)
-- ============================================================================

CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX threads_user_id_idx ON threads(user_id);
CREATE INDEX threads_status_idx ON threads(status);

-- ============================================================================
-- THREAD LINKS (Connects entries/events to threads)
-- ============================================================================

CREATE TABLE thread_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  parse_run_id UUID REFERENCES parse_runs(id) ON DELETE SET NULL,

  link_type TEXT DEFAULT 'auto' CHECK (link_type IN ('manual', 'suggested', 'auto')),

  link_reason JSONB,

  confidence_score DECIMAL(3,2),
  is_user_confirmed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX thread_links_thread_id_idx ON thread_links(thread_id);
CREATE INDEX thread_links_entry_id_idx ON thread_links(entry_id);
CREATE INDEX thread_links_event_id_idx ON thread_links(event_id);
CREATE INDEX thread_links_user_thread_idx ON thread_links(user_id, thread_id);
CREATE UNIQUE INDEX thread_links_unique_entry_idx ON thread_links(thread_id, entry_id);

-- ============================================================================
-- RELATIONSHIP MOMENTS (Significant interactions between people)
-- ============================================================================

CREATE TABLE relationship_moments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,

  person_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  other_person_entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,

  moment_type TEXT NOT NULL CHECK (moment_type IN ('conflict', 'support', 'celebration', 'boundary', 'milestone', 'collaboration', 'other')),

  summary TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  is_user_confirmed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX relationship_moments_user_id_idx ON relationship_moments(user_id);
CREATE INDEX relationship_moments_person_entity_idx ON relationship_moments(person_entity_id);
CREATE INDEX relationship_moments_other_person_entity_idx ON relationship_moments(other_person_entity_id);
CREATE INDEX relationship_moments_entry_id_idx ON relationship_moments(entry_id);

-- ============================================================================
-- TOPICS (Extracted themes)
-- ============================================================================

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  label TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX topics_user_id_idx ON topics(user_id);
CREATE UNIQUE INDEX topics_unique_idx ON topics(user_id, LOWER(label));

-- ============================================================================
-- ENTRY TOPIC LINKS
-- ============================================================================

CREATE TABLE entry_topic_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  parse_run_id UUID REFERENCES parse_runs(id) ON DELETE SET NULL,

  confidence_score DECIMAL(3,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX entry_topic_links_entry_id_idx ON entry_topic_links(entry_id);
CREATE INDEX entry_topic_links_topic_id_idx ON entry_topic_links(topic_id);
CREATE UNIQUE INDEX entry_topic_links_unique_idx ON entry_topic_links(entry_id, topic_id);

-- ============================================================================
-- ENTITY MERGES (User corrections when duplicates are merged)
-- ============================================================================

CREATE TABLE entity_merges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  source_entity_id UUID NOT NULL,
  target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,

  merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  merged_by UUID NOT NULL REFERENCES users(id),

  reason TEXT
);

CREATE INDEX entity_merges_target_idx ON entity_merges(target_entity_id);

-- ============================================================================
-- AUDIT LOGS (Track all significant user actions)
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  old_values JSONB,
  new_values JSONB,

  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by UUID NOT NULL REFERENCES users(id),

  ip_hash TEXT,
  metadata JSONB
);

CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_performed_at_idx ON audit_logs(performed_at);
CREATE INDEX audit_logs_entity_type_idx ON audit_logs(entity_type, entity_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically create user record when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
