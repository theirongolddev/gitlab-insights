-- Add indexes for efficient file path prefix queries

-- Index for path prefix queries using text_pattern_ops
-- This enables efficient LIKE 'prefix%' queries
CREATE INDEX IF NOT EXISTS idx_file_path_prefix 
ON "File" USING btree ("userId", "projectId", path text_pattern_ops);

-- Index for directory lookups (already defined in schema but ensure it exists)
CREATE INDEX IF NOT EXISTS idx_file_directory_lookup 
ON "File" ("userId", "directory");

-- Index for extension filtering
CREATE INDEX IF NOT EXISTS idx_file_extension 
ON "File" ("userId", "extension") WHERE extension IS NOT NULL;
