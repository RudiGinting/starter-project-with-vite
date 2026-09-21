import { getStoryById } from '../../data/api';
import { parseActivePathname } from '../../routes/url-parser';

export default class StoryDetailPage {
  async render() {
    return `
      <section class="container page-shell" aria-labelledby="story-detail-title">
        <div id="story-detail-content" class="form-panel" aria-live="polite">
          <p>Memuat detail cerita...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const content = document.querySelector('#story-detail-content');
    const { id } = parseActivePathname();

    try {
      const response = await getStoryById(id);
      if (response.error || !response.story) {
        content.innerHTML = '<p class="empty-state">Cerita tidak ditemukan.</p>';
        return;
      }

      const story = response.story;
      content.innerHTML = `
        <a class="inline-link" href="#/">&larr; Kembali ke beranda</a>
        <h1 id="story-detail-title">${story.name}</h1>
        <p class="story-meta">${new Date(story.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
        <img class="story-detail-image" src="${story.photoUrl}" alt="${story.name}" />
        <p class="story-detail-description">${story.description}</p>
        <p class="story-meta">${story.lat && story.lon ? `Lokasi: ${story.lat}, ${story.lon}` : 'Cerita tanpa lokasi'}</p>
      `;
    } catch (error) {
      content.innerHTML = '<p class="empty-state">Detail belum tersedia saat offline.</p>';
    }
  }
}