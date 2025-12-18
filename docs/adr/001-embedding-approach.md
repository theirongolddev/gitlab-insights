# ADR-001: Embedding Approach for Similarity Detection

## Status

Accepted

## Context

GitLab Insights needs vector embeddings to enable:
- Duplicate/similar issue detection
- Semantic search across events
- Related discussion discovery
- Decision archaeology queries

We need to choose between local embedding generation vs API-based solutions.

## Decision Drivers

- **Cost**: Self-hosted product, recurring API costs are problematic
- **Privacy**: User data should not be sent to third-party APIs
- **Performance**: Embeddings generated during sync should not bottleneck
- **Quality**: Embeddings must be good enough for semantic similarity
- **Complexity**: Setup and maintenance burden for users

## Options Considered

### Option 1: pgvector + sentence-transformers (Local)

**Approach**: Use PostgreSQL's pgvector extension with a local sentence-transformers model.

**Pros**:
- Free - no per-token costs
- Private - data stays local
- Fast inference with cached model
- Good quality for short text (titles, descriptions)
- pgvector is mature and well-supported

**Cons**:
- Requires pgvector extension in PostgreSQL
- Model file size (~90MB for MiniLM)
- Initial model download on first use
- CPU-only inference (no GPU acceleration without setup)

**Model Choice**: `all-MiniLM-L6-v2`
- 384 dimensions (small, efficient)
- ~90MB model size
- Excellent for semantic similarity
- Fast inference (~5-10ms per embedding on CPU)

### Option 2: OpenAI Embeddings API

**Approach**: Use OpenAI's text-embedding-ada-002 or text-embedding-3-small.

**Pros**:
- No local setup required
- High quality embeddings
- Simple API integration

**Cons**:
- Recurring costs ($0.0001/1K tokens for ada-002)
- Privacy concerns - data sent to OpenAI
- Requires API key management
- Rate limits and latency
- Vendor lock-in

### Option 3: Hugging Face Inference API

**Approach**: Use HF's free inference API for embeddings.

**Pros**:
- Free tier available
- Many model choices
- No local setup

**Cons**:
- Rate limits on free tier
- Latency higher than local
- Still sends data externally
- Less reliable than paid APIs

## Decision

**Selected: Option 1 - pgvector + sentence-transformers with all-MiniLM-L6-v2**

### Rationale

1. **Cost-effective**: Zero marginal cost per embedding, critical for a self-hosted tool
2. **Privacy-first**: User's GitLab data never leaves their infrastructure
3. **Performance**: Local inference is faster than API calls once model is loaded
4. **Quality**: MiniLM-L6-v2 provides excellent quality for our use case (short text similarity)
5. **Portability**: pgvector is available on most PostgreSQL providers (Supabase, Railway, Neon, etc.)

### Implementation Path

1. **Database**: Add pgvector extension and vector column to Event model
2. **Embedding Service**: Create service using `@xenova/transformers` (ONNX runtime for Node.js)
3. **Generation**: Generate embeddings during event sync (batch processing)
4. **Querying**: Use pgvector's cosine similarity for nearest-neighbor search

### Technical Details

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column (384 dimensions for MiniLM)
ALTER TABLE "Event" ADD COLUMN embedding vector(384);

-- Create index for fast similarity search
CREATE INDEX ON "Event" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

```typescript
// Embedding service using @xenova/transformers
import { pipeline } from '@xenova/transformers';

const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

async function generateEmbedding(text: string): Promise<number[]> {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
```

### Migration Strategy

- Embeddings generated lazily on first similarity query
- Background job to backfill existing events
- New events get embeddings during sync

## Consequences

### Positive

- No recurring API costs
- User data remains private
- Fast local inference
- Works offline after initial model download

### Negative

- First-time model download (~90MB)
- pgvector extension required (may not be available on all hosts)
- Slightly more complex deployment than API approach

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| pgvector not available | Document supported PostgreSQL providers; fall back to no-embeddings mode |
| Model download fails | Cache model in project; provide manual download option |
| Embedding quality insufficient | Can upgrade to larger model (MiniLM-L12-v2) or switch to API later |

## References

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [sentence-transformers](https://www.sbert.net/)
- [Xenova/transformers.js](https://github.com/xenova/transformers.js)
- [all-MiniLM-L6-v2 on HuggingFace](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
