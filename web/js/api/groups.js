// 이 파일이 하는 일: 내 그룹 목록, 그룹 만들기·참여, 그룹 상세 정보를 제공한다.
import { supabase } from '../supabase.js';

export async function listMyGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, invite_code')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createGroup(name) {
  const { data, error } = await supabase.rpc('create_group', { p_name: name });
  if (error) throw error;
  return data;
}

export async function joinGroup(code) {
  const { data, error } = await supabase.rpc('join_group', { p_code: code });
  if (error) {
    if (error.code === 'P0002') throw new Error('초대 코드를 찾을 수 없어요.');
    throw error;
  }
  return data;
}

export async function getGroup(id) {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, invite_code, members:group_members(profile:profiles(display_name))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    invite_code: data.invite_code,
    members: data.members.map((member) => member.profile).filter(Boolean),
  };
}
