// 이 파일이 하는 일: Supabase 인증과 내 프로필 조회를 제공한다.
import { supabase } from '../supabase.js';

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

export async function signUp({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { data, error } = await supabase.auth.signOut();
  if (error) throw error;
  return data;
}

export async function getMyProfile() {
  const session = await getSession();
  if (!session) throw new Error('로그인이 필요해요.');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', session.user.id)
    .single();
  if (error) throw error;
  return data;
}
