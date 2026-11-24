// 이 파일이 하는 일: 로그인 화면. 성공하면 #/groups 로 이동한다.
import { signIn } from '../api/auth.js';
import { el, showError } from '../ui.js';

export async function render(container, params) {
  const email = el('input', { type: 'email', required: true, autocomplete: 'email' });
  const password = el('input', { type: 'password', required: true, autocomplete: 'current-password' });
  const button = el('button', { type: 'submit' }, '로그인');

  const form = el('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      showError(container, null);
      button.disabled = true; // 저장 중에는 버튼 잠금
      try {
        await signIn({ email: email.value.trim(), password: password.value });
        location.hash = '#/groups';
      } catch (err) {
        showError(container, err); // 입력 내용은 그대로 둔다
        button.disabled = false;
      }
    },
  },
    el('label', {}, '이메일', email),
    el('label', {}, '비밀번호', password),
    button);

  container.className = 'login-page';
  container.append(el('h1', {}, '로그인'), form, el('p', {}, '계정이 없나요? ', el('a', { href: '#/signup' }, '회원가입')));
}
