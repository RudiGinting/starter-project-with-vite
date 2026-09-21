import { getAuthToken, loginUser, setAuthToken } from '../../data/api';

function showNotice(element, type, message) {
  if (!element) return;
  element.textContent = message;
  element.className = `notice ${type} show`;
}

export default class LoginPage {
  async render() {
    return `
      <section class="container auth-grid" aria-labelledby="login-title">
        <div class="auth-panel">
          <p class="story-meta">StoryMap</p>
          <h1 id="login-title">Masuk ke akun Anda</h1>
          <p>Bagikan kisah dan lihat cerita dari berbagai lokasi di Indonesia.</p>

          <div id="login-message" class="notice" aria-live="polite"></div>

          <form id="login-form" novalidate>
            <div class="form-grid">
              <div class="form-row">
                <label for="login-email">Email</label>
                <input
                  id="login-email"
                  class="form-input"
                  type="email"
                  name="email"
                  placeholder="contoh@email.com"
                  autocomplete="email"
                  required
                />
              </div>

              <div class="form-row">
                <label for="login-password">Password</label>
                <input
                  id="login-password"
                  class="form-input"
                  type="password"
                  name="password"
                  placeholder="Minimal 8 karakter"
                  autocomplete="current-password"
                  required
                />
              </div>

              <button type="submit" class="primary-btn" id="login-submit">
                Masuk
              </button>
            </div>
          </form>

          <p class="story-meta" style="margin-top: 1rem;">
            Belum punya akun?
            <a href="#/register" class="inline-link">Daftar di sini</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const token = getAuthToken();
    if (token) {
      location.hash = '#/';
      return;
    }

    const form = document.querySelector('#login-form');
    const message = document.querySelector('#login-message');
    const submitButton = document.querySelector('#login-submit');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.querySelector('#login-email').value.trim();
      const password = document.querySelector('#login-password').value.trim();

      if (!email || !password) {
        showNotice(message, 'error', 'Email dan password wajib diisi.');
        return;
      }

      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="submit-loading"><span class="spinner"></span> Memproses...</span>';

      try {
        const result = await loginUser({ email, password });

        if (result.error) {
          showNotice(message, 'error', result.message || 'Login gagal.');
          submitButton.disabled = false;
          submitButton.textContent = 'Masuk';
          return;
        }

        setAuthToken(result.loginResult.token);
        showNotice(message, 'success', 'Login berhasil. Mengalihkan ke halaman utama...');
        setTimeout(() => {
          location.hash = '#/';
        }, 600);
      } catch (error) {
        showNotice(message, 'error', 'Terjadi kesalahan saat login. Coba lagi nanti.');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Masuk';
      }
    });
  }
}
