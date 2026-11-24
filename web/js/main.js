// 이 파일이 하는 일: 주소(#/...)에 맞는 화면을 그리는 라우터. 로그인 확인과 상단바(로그아웃)도 여기서 처리한다.
import { getSession, signOut } from './api/auth.js';
import { el, showError } from './ui.js';

const app = document.getElementById('app');
const topbar = document.getElementById('topbar');

// 경로 → 화면 파일. :id 같은 부분은 params 로 넘어간다.
const routes = {
  '/login': 'login',
  '/signup': 'signup',
  '/groups': 'groups',
  '/group/:id': 'group',
  '/write': 'write',
  '/my': 'my',
};
const publicPaths = ['/login', '/signup'];

function matchRoute(path) {
  for (const pattern of Object.keys(routes)) {
    const names = [];
    const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, n) => (names.push(n), '([^/]+)')) + '$');
    const m = path.match(regex);
    if (m) return { pattern, params: Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

let seq = 0; // 화면 이동이 빠르게 겹칠 때 늦게 끝난 이전 화면이 덮어쓰지 않게 한다

async function route() {
  const mine = ++seq;
  const path = location.hash.slice(1) || '/groups';
  let session = null;
  try { session = await getSession(); } catch (e) { /* 세션을 못 읽으면 비로그인으로 본다 */ }
  if (mine !== seq) return;

  topbar.hidden = !session;
  const isPublic = publicPaths.includes(path);
  if (!session && !isPublic) { location.hash = '#/login'; return; }
  if (session && isPublic) { location.hash = '#/groups'; return; }

  const found = matchRoute(path);
  if (!found) { location.hash = session ? '#/groups' : '#/login'; return; }

  const container = el('div', {});
  try {
    const page = await import(`./pages/${routes[found.pattern]}.js`);
    await page.render(container, found.params);
  } catch (e) {
    showError(container, e);
  }
  if (mine !== seq) return;
  app.replaceChildren(container);
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await signOut();
    location.hash = '#/login';
    route();
  } catch (e) {
    showError(app, e);
  }
});

window.addEventListener('hashchange', route);
route();
