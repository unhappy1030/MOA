// 이 파일이 하는 일: 모든 화면이 같이 쓰는 도우미 함수 (el, formatDate, showError, entryCard).
// 사용자가 입력한 글은 항상 textContent 로만 넣는다 (innerHTML 금지).

// el('div', { class: 'card' }, '글자', 다른요소) → 요소를 만들어 돌려준다.
// attrs 에서 on으로 시작하는 키(onclick 등)는 이벤트, value/checked/disabled 는 속성값, 나머지는 HTML 속성.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs || {})) {
    if (val == null || val === false) continue;
    if (key.startsWith('on') && typeof val === 'function') node.addEventListener(key.slice(2), val);
    else if (['value', 'checked', 'disabled'].includes(key)) node[key] = val;
    else node.setAttribute(key, val === true ? '' : val);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

// ISO 시각 문자열 → 기기 현지 시간 "2025. 1. 5. 오후 3:07"
export function formatDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
}

// container 안에 오류 문구를 보여준다. err 가 비어 있으면(null) 기존 오류를 지운다.
export function showError(container, err) {
  container.querySelector(':scope > .error')?.remove();
  if (!err) return;
  const message = typeof err === 'string' ? err : (err.message || '알 수 없는 오류가 났어요.');
  container.prepend(el('p', { class: 'error', role: 'alert' }, message));
}

// 글 한 개를 카드로 만든다. entry = { title, body, created_at, author: { display_name } }
export function entryCard(entry) {
  const author = entry.author?.display_name || '알 수 없음';
  return el('article', { class: 'card' },
    el('div', { class: 'meta' }, `${author} · ${formatDate(entry.created_at)}`),
    el('h3', {}, entry.title),
    el('p', { class: 'body' }, entry.body));
}
