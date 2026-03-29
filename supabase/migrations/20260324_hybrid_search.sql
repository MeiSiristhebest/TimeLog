-- 20260324_hybrid_search.sql
-- Enable pgvector and add embedding column for Hybrid Semantic Search

CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to stories table (Gemini text-embedding-004 is 768 dimensions)
ALTER TABLE public.stories 
ADD COLUMN embedding vector(768);

-- Create an index for faster similarity search
CREATE INDEX ON public.stories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to match stories based on embedding
CREATE OR REPLACE FUNCTION match_stories(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  user_id_filter uuid DEFAULT null
)
RETURNS TABLE (
  id text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    stories.id,
    1 - (stories.embedding <=> query_embedding) AS similarity
  FROM public.stories
  WHERE stories.embedding IS NOT NULL
    AND (user_id_filter IS NULL OR stories.user_id = user_id_filter)
    AND 1 - (stories.embedding <=> query_embedding) > match_threshold
  ORDER BY stories.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
