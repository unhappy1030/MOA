// 이 파일이 하는 일: 내 그룹 목록, 그룹 만들기, 초대 코드로 참여 화면.
import { listMyGroups, createGroup, joinGroup } from '../api/groups.js';
import { el, showError } from '../ui.js';

export async function render(container, params) {
  container.className = 'groups-page';
  const groups = await listMyGroups();

  const list = groups.length
    ? el('ul', { class: 'group-list' }, groups.map((g) =>
        el('li', {}, el('a', { href: `#/group/${encodeURIComponent(g.id)}` }, g.name))))
    : el('p', { class: 'empty' }, '아직 속한 그룹이 없어요. 아래에서 만들거나 코드로 참여해 보세요.');

  // 입력창 + 버튼 폼을 만들고, 성공하면 action 의 결과 그룹 피드로 이동한다.
  function makeForm(placeholder, buttonText, action) {
    const input = el('input', { type: 'text', placeholder, required: true });
    const button = el('button', { type: 'submit' }, buttonText);
    return el('form', {
      onsubmit: async (e) => {
        e.preventDefault();
        showError(container, null);
        const value = input.value.trim();
        if (!value) return showError(container, '내용을 입력해 주세요.');
        button.disabled = true;
        try {
          const group = await action(value);
          location.hash = `#/group/${encodeURIComponent(group.id)}`;
        } catch (err) {
          showError(container, err);
          button.disabled = false;
        }
      },
    }, input, button);
  }

  container.append(
    el('h1', {}, '내 그룹'),
    list,
    el('h2', {}, '그룹 만들기'),
    makeForm('그룹 이름', '만들기', createGroup),
    el('h2', {}, '코드로 참여'),
    makeForm('초대 코드', '참여', joinGroup));
}
