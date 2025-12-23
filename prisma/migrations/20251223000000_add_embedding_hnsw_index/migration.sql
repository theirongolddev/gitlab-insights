-- Add HNSW index for efficient vector similarity search on Event embeddings
-- This dramatically improves performance for vector similarity queries (cosine distance)
-- Without this index, queries perform full table scans which is O(n) complexity
-- With HNSW index, queries are approximately O(log n) with high recall

-- HNSW parameters:
-- m = 16: Number of bi-directional links per node (default 16, higher = more accurate but slower build)
-- ef_construction = 64: Size of dynamic candidate list during construction (default 64)

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Event_embedding_hnsw_idx" 
ON "Event" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Note: CONCURRENTLY allows the index to be built without locking the table for writes
-- This is important for production databases with ongoing traffic
