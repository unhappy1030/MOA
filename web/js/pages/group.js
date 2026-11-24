// 이 파일이 하는 일: 그룹 피드 화면 (그룹 이름, 초대 코드, 멤버, 공유된 글 목록).
import { getGroup } from '../api/groups.js';
import { listGroupEntries } from '../api/entries.js';
import { el, entryCard } from '../ui.js';

export async function render(container, params) {
  container.className = 'group-page';
  const [group, entries] = await Promise.all([getGroup(params.id), listGroupEntries(params.id)]);

  const feed = entries.length
    ? entries.map(entryCard)
    : el('p', { class: 'empty' }, '아직 공유된 글이 없어요.');

  container.append(
    el('h1', {}, group.name),
    el('p', {}, '초대 코드: ', el('span', { class: 'code' }, group.invite_code)),
    el('p', { class: 'members' }, '멤버: ', group.members.map((m) => m.display_name).join(', ')),
    el('h2', {}, '공유된 글'),
    feed);
}
