-- ============================================
-- DISABLE RLS FOR TESTING
-- Run this in Supabase SQL Editor to allow the app to work without authentication
-- ⚠️ WARNING: This removes security. Only use for development/testing!
-- ============================================

-- Disable RLS on all tables
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'tickets', 'knowledge_base', 'profiles');

-- You should see rowsecurity = false for all tables
