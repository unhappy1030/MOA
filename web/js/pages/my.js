// 이 파일이 하는 일: 내가 쓴 일기 전체를 최신순 카드로 보여주는 화면.
import { listMyEntries } from '../api/entries.js';
import { el, entryCard } from '../ui.js';

export async function render(container, params) {
  container.className = 'my-page';
  const entries = await listMyEntries();
  container.append(
    el('h1', {}, '내 일기'),
    entries.length ? entries.map(entryCard) : el('p', { class: 'empty' }, '아직 쓴 글이 없어요.'));
}
