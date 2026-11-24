// 이 파일이 하는 일: 회원가입 화면 (표시 이름·이메일·비밀번호). 성공하면 바로 로그인 상태로 #/groups 로 이동한다.
import { signUp } from '../api/auth.js';
import { el, showError } from '../ui.js';

export async function render(container, params) {
  const name = el('input', { type: 'text', required: true, maxlength: 20, autocomplete: 'nickname' });
  const email = el('input', { type: 'email', required: true, autocomplete: 'email' });
  const password = el('input', { type: 'password', required: true, minlength: 6, autocomplete: 'new-password' });
  const button = el('button', { type: 'submit' }, '가입하기');

  const form = el('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      showError(container, null);
      const displayName = name.value.trim();
      if (displayName.length < 1 || displayName.length > 20) return showError(container, '표시 이름은 1~20자로 입력해 주세요.');
      if (password.value.length < 6) return showError(container, '비밀번호는 6자 이상이어야 해요.');
      button.disabled = true;
      try {
        await signUp({ email: email.value.trim(), password: password.value, displayName });
        location.hash = '#/groups';
      } catch (err) {
        showError(container, err);
        button.disabled = false;
      }
    },
  },
    el('label', {}, '표시 이름 (1~20자)', name),
    el('label', {}, '이메일', email),
    el('label', {}, '비밀번호 (6자 이상)', password),
    button);

  container.className = 'signup-page';
  container.append(el('h1', {}, '회원가입'), form, el('p', {}, '이미 계정이 있나요? ', el('a', { href: '#/login' }, '로그인')));
}
