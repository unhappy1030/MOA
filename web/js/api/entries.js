// 이 파일이 하는 일: 그룹 공유 글과 내 글을 조회하고 새 일기를 저장한다.
import { getSession } from './auth.js';
import { supabase } from '../supabase.js';

export async function listGroupEntries(groupId) {
  const { data, error } = await supabase
    .from('entries')
    .select('id, title, body, created_at, author:profiles(display_name), entry_shares!inner(group_id)')
    .eq('entry_shares.group_id', groupId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  return data.map(({ entry_shares, ...entry }) => entry);
}

export async function listMyEntries() {
  const session = await getSession();
  if (!session) throw new Error('로그인이 필요해요.');

  const { data, error } = await supabase
    .from('entries')
    .select('id, title, body, created_at, author:profiles(display_name)')
    .eq('author_id', session.user.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createEntry({ title, body, groupIds }) {
  const { data, error } = await supabase.rpc('create_entry', {
    p_title: title,
    p_body: body,
    p_group_ids: groupIds,
  });
  if (error) throw error;
  return data;
}
