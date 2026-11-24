// 이 파일이 하는 일: 글쓰기 화면 (제목, 본문, 공유할 그룹 체크). 저장하면 #/my 로 이동한다.
import { listMyGroups } from '../api/groups.js';
import { createEntry } from '../api/entries.js';
import { el, showError } from '../ui.js';

export async function render(container, params) {
  container.className = 'write-page';
  const groups = await listMyGroups();

  const title = el('input', { type: 'text', maxlength: 100, required: true });
  const body = el('textarea', { maxlength: 2000, required: true });
  const button = el('button', { type: 'submit' }, '저장');
  // 그룹마다 체크박스 하나. 아무것도 체크하지 않으면 "나만 보기".
  const checks = groups.map((g) => ({ group: g, box: el('input', { type: 'checkbox' }) }));

  const form = el('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      showError(container, null);
      const t = title.value.trim();
      const b = body.value.trim();
      if (!t || !b) return showError(container, '제목과 본문을 입력해 주세요.'); // 공백만 있는 글 막기
      button.disabled = true;
      try {
        await createEntry({ title: t, body: b, groupIds: checks.filter((c) => c.box.checked).map((c) => c.group.id) });
        location.hash = '#/my';
      } catch (err) {
        showError(container, err); // 입력 내용 유지
        button.disabled = false;
      }
    },
  },
    el('label', {}, '제목 (1~100자)', title),
    el('label', {}, '본문 (1~2000자)', body),
    el('h2', {}, '공유할 그룹'),
    groups.length
      ? checks.map((c) => el('label', { class: 'share-item' }, c.box, c.group.name))
      : el('p', { class: 'empty' }, '속한 그룹이 없어서 나만 보는 글로 저장돼요.'),
    button);

  container.append(el('h1', {}, '글쓰기'), form);
}
