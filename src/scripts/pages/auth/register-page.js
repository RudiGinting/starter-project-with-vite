import { registerUser, setAuthToken, loginUser } from '../../data/api';

function showNotice(element, type, message) {
  if (!element) return;
  element.textContent = message;
  element.className = `notice ${type} show`;
}

export default class RegisterPage {
  async render() {
    return `
      <section class="container auth-grid" aria-labelledby="register-title">
        <div class="auth-panel">
          <p class="story-meta">StoryMap</p>
          <h1 id="register-title">Buat akun baru</h1>
          <p>Gabung dengan komunitas storytellers untuk membagikan momen penting.</p>

          <div id="register-message" class="notice" aria-live="polite"></div>

          <form id="register-form" novalidate>
            <div class="form-grid">
              <div class="form-row">
                <label for="register-name">Nama lengkap</label>
                <input
                  id="register-name"
                  class="form-input"
                  type="text"
                  name="name"
                  placeholder="Nama Anda"
                  autocomplete="name"
                  required
                />
              </div>

              <div class="form-row">
                <label for="register-email">Email</label>
                <input
                  id="register-email"
                  class="form-input"
                  type="email"
                  name="email"
                  placeholder="contoh@email.com"
                  autocomplete="email"
                  required
                />
              </div>

              <div class="form-row">
                <label for="register-password">Password</label>
                <input
                  id="register-password"
                  class="form-input"
                  type="password"
                  name="password"
                  placeholder="Minimal 8 karakter"
                  autocomplete="new-password"
                  required
                />
              </div>

              <button type="submit" class="primary-btn" id="register-submit">
                Daftar
              </button>
            </div>
          </form>

          <p class="story-meta" style="margin-top: 1rem;">
            Sudah punya akun?
            <a href="#/login" class="inline-link">Masuk di sini</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.querySelector('#register-form');
    const message = document.querySelector('#register-message');
    const submitButton = document.querySelector('#register-submit');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.querySelector('#register-name').value.trim();
      const email = document.querySelector('#register-email').value.trim();
      const password = document.querySelector('#register-password').value.trim();

      if (!name || !email || !password) {
        showNotice(message, 'error', 'Semua kolom wajib diisi.');
        return;
      }

      if (password.length < 8) {
        showNotice(message, 'error', 'Password minimal 8 karakter.');
        return;
      }

      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="submit-loading"><span class="spinner"></span> Menyiapkan akun...</span>';

      try {
        const registerResult = await registerUser({ name, email, password });

        if (registerResult.error) {
          showNotice(message, 'error', registerResult.message || 'Pendaftaran gagal.');
          submitButton.disabled = false;
          submitButton.textContent = 'Daftar';
          return;
        }

        const loginResult = await loginUser({ email, password });

        if (!loginResult.error) {
          setAuthToken(loginResult.loginResult.token);
          showNotice(message, 'success', 'Akun berhasil dibuat. Mengalihkan ke beranda...');
          setTimeout(() => {
            location.hash = '#/';
          }, 600);
        } else {
          showNotice(message, 'success', 'Akun berhasil dibuat. Silakan login.');
          setTimeout(() => {
            location.hash = '#/login';
          }, 700);
        }
      } catch (error) {
        showNotice(message, 'error', 'Terjadi kesalahan saat mendaftar.');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Daftar';
      }
    });
  }
}
