-- ============================================================================
-- Enable pgvector extension for semantic search
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Add vector columns to tables
-- ============================================================================

-- Embeddings for entries (for semantic search)
ALTER TABLE entries ADD COLUMN embedding vector(1536);

-- Embeddings for entities (for entity resolution)
ALTER TABLE entities ADD COLUMN embedding vector(1536);

-- Embeddings for threads (for thread linking)
ALTER TABLE threads ADD COLUMN embedding vector(1536);

-- Embeddings for topics
ALTER TABLE topics ADD COLUMN embedding vector(1536);

-- ============================================================================
-- Vector similarity indexes (using IVFFLAT)
-- ============================================================================

-- Create vector indexes for fast similarity search
-- Lists parameter: sqrt(total_rows) is a good starting point
-- We'll use 100 for entries (expecting ~10k entries per user)

CREATE INDEX entries_embedding_idx ON entries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX entities_embedding_idx ON entities
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

CREATE INDEX threads_embedding_idx ON threads
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

CREATE INDEX topics_embedding_idx ON topics
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ============================================================================
-- Full-text search setup
-- ============================================================================

-- Add tsvector column for full-text search on entries
ALTER TABLE entries ADD COLUMN content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create GIN index for full-text search
CREATE INDEX entries_content_tsv_idx ON entries USING GIN(content_tsv);

-- Full-text search on event titles and descriptions
ALTER TABLE events ADD COLUMN search_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', title) ||
    to_tsvector('english', COALESCE(description, ''))
  ) STORED;

CREATE INDEX events_search_tsv_idx ON events USING GIN(search_tsv);

-- Full-text search on entity names
ALTER TABLE entities ADD COLUMN name_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', canonical_name)) STORED;

CREATE INDEX entities_name_tsv_idx ON entities USING GIN(name_tsv);

-- ============================================================================
-- Helper functions for similarity search
-- ============================================================================

-- Function to find similar entries using vector search
CREATE OR REPLACE FUNCTION find_similar_entries(
  query_embedding vector(1536),
  user_id_param UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  occurred_at TIMESTAMPTZ,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    e.occurred_at,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM entries e
  WHERE
    e.user_id = user_id_param
    AND e.embedding IS NOT NULL
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar entities for deduplication
CREATE OR REPLACE FUNCTION find_similar_entities(
  query_embedding vector(1536),
  user_id_param UUID,
  entity_type_param TEXT,
  match_threshold FLOAT DEFAULT 0.85,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  canonical_name TEXT,
  entity_type TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.canonical_name,
    e.entity_type,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM entities e
  WHERE
    e.user_id = user_id_param
    AND e.entity_type = entity_type_param
    AND e.embedding IS NOT NULL
    AND e.is_archived = FALSE
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
