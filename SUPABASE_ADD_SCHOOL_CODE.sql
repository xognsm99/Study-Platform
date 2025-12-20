-- ============================================
-- student_profiles 테이블에 school_code 컬럼 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================

ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS school_code TEXT;

