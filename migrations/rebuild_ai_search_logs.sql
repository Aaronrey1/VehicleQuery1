-- Migration Script: Rebuild ai_search_logs from pending_vehicles
-- Purpose: Ensure all historical data is consistent between ai_search_logs and pending_vehicles
-- This fixes the issue where NULL sources in pending_vehicles weren't being counted correctly

-- Step 1: Backup existing ai_search_logs (optional but recommended)
-- You can skip this if you're confident, but it's good practice
CREATE TABLE IF NOT EXISTS ai_search_logs_backup AS 
SELECT * FROM ai_search_logs;

-- Step 2: Clear the ai_search_logs table
TRUNCATE TABLE ai_search_logs;

-- Step 3: Rebuild ai_search_logs from pending_vehicles
-- This ensures all searches that require approval are logged
INSERT INTO ai_search_logs (make, model, year, source, confidence, cost, timestamp)
SELECT 
  make,
  model,
  year,
  COALESCE(source, 'gemini_api') as source,  -- NULL sources default to gemini_api
  confidence,
  CASE 
    WHEN source = 'google_api' THEN 5        -- $0.005 per request
    WHEN source = 'gemini_api' OR source IS NULL THEN 10  -- $0.01 per request
    ELSE 0                                    -- database tiers are free
  END as cost,
  created_at as timestamp
FROM pending_vehicles;

-- Step 4: Verify the counts match
-- Run this to confirm everything is correct
SELECT 
  'ai_search_logs' as table_name,
  source,
  COUNT(*) as count
FROM ai_search_logs
WHERE source != 'exact'  -- Exclude exact matches as they don't need approval
GROUP BY source
ORDER BY source;

-- You should see counts that match your pending_vehicles table
-- If you want to double-check, uncomment and run this:
/*
SELECT 
  'pending_vehicles' as table_name,
  COALESCE(source, 'gemini_api') as source,
  COUNT(*) as count
FROM pending_vehicles
GROUP BY COALESCE(source, 'gemini_api')
ORDER BY source;
*/

-- Clean up backup (only run this after you've verified everything works)
-- DROP TABLE IF EXISTS ai_search_logs_backup;
