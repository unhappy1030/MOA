// 이 파일이 하는 일: Supabase SDK를 한 번 초기화해 앱 전체에서 공유한다.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/+esm';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
