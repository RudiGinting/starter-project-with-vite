import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { getAuthToken, clearAuthToken } from '../data/api';
import { disablePushNotifications, enablePushNotifications, getPushSubscription } from '../utils/push';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #logoutButton = null;
  #pushToggle = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#logoutButton = document.querySelector('#logout-button');
    this.#pushToggle = document.querySelector('#push-toggle');

    this.#setupDrawer();
    this.#setupLogout();
    this.#setupPushToggle();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', String(isOpen));
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
          this.#drawerButton.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  #setupLogout() {
    if (!this.#logoutButton) return;

    this.#logoutButton.addEventListener('click', (event) => {
      event.preventDefault();
      clearAuthToken();
      location.hash = '#/login';
      this.renderPage();
    });
  }

  #setupPushToggle() {
    if (!this.#pushToggle) return;

    this.#pushToggle.addEventListener('click', async () => {
      this.#pushToggle.disabled = true;
      try {
        const subscription = await getPushSubscription();
        if (subscription) {
          await disablePushNotifications();
        } else {
          await enablePushNotifications();
        }
        await this.#updatePushToggle();
      } catch (error) {
        window.alert(error.message);
      } finally {
        this.#pushToggle.disabled = false;
      }
    });
  }

  async #updatePushToggle() {
    if (!this.#pushToggle) return;
    const subscription = await getPushSubscription();
    this.#pushToggle.textContent = subscription ? 'Nonaktifkan notifikasi' : 'Aktifkan notifikasi';
  }

  #updateNavigation() {
    const isAuthenticated = Boolean(getAuthToken());
    const loginLink = document.querySelector('#nav-login');
    const registerLink = document.querySelector('#nav-register');
    const homeLink = document.querySelector('#nav-home');
    const addStoryLink = document.querySelector('#nav-add-story');
    const logoutLink = document.querySelector('#logout-button');

    [homeLink, addStoryLink, logoutLink].forEach((element) => {
      if (element) {
        element.hidden = !isAuthenticated;
      }
    });

    if (loginLink) loginLink.hidden = isAuthenticated;
    if (registerLink) registerLink.hidden = isAuthenticated;
    if (this.#pushToggle) this.#pushToggle.hidden = !isAuthenticated;
    if (isAuthenticated) this.#updatePushToggle();
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url] || routes['/'];

    if (!getAuthToken() && url !== '/login' && url !== '/register') {
      location.hash = '#/login';
      return;
    }

    try {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      this.#updateNavigation();
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }
}

export default App;
