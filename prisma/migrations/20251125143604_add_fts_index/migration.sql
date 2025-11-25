-- Migration: add_fts_index
-- Creates GIN index for PostgreSQL Full-Text Search on events table
-- Enables <1s search performance on 10k+ events

-- Create GIN index on the to_tsvector of title and body columns
-- This enables efficient full-text search with ts_rank for relevance scoring
CREATE INDEX events_fts_idx ON "Event"
USING gin(to_tsvector('english', title || ' ' || COALESCE(body, '')));
