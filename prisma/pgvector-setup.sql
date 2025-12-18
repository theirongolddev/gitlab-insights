-- pgvector extension setup for GitLab Insights
-- Run this script once to enable vector similarity search

-- Enable pgvector extension (requires superuser or rds_superuser on AWS)
CREATE EXTENSION IF NOT EXISTS vector;

-- After running this script, use `npx prisma db push` to add the embedding column
-- Then create the IVFFlat index for fast similarity search:
--
-- CREATE INDEX idx_event_embedding ON "Event"
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);
--
-- Note: The IVFFlat index should be created after the table has some data
-- (at least 100 rows recommended for lists = 100)
