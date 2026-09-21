// CSS imports
import '../styles/styles.css';

import App from './pages/app';
import { addStory } from './data/api';
import { deleteQueuedStory, getQueuedStories } from './data/database';

async function syncQueuedStories() {
  if (!navigator.onLine) return;
  const queuedStories = await getQueuedStories();
  for (const story of queuedStories) {
    try {
      const formData = new FormData();
      formData.append('description', story.description);
      formData.append('photo', story.photo);
      formData.append('lat', story.lat);
      formData.append('lon', story.lon);
      const result = await addStory(formData);
      if (!result.error) await deleteQueuedStory(story.localId);
    } catch (error) {
      console.error('Failed to synchronize queued story:', error);
    }
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}

window.addEventListener('online', syncQueuedStories);

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  await app.renderPage();
  await syncQueuedStories();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
});
