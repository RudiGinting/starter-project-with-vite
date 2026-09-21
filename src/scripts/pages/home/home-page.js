import { getStories, getAuthToken } from '../../data/api';
import { deleteSavedStory, getSavedStories, saveStories } from '../../data/database';

const defaultCenter = [-2.5489, 118.0156];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default class HomePage {
  async render() {
    return `
      <section class="container page-shell" aria-labelledby="home-title">
        <div class="hero">
          <div>
            <p class="story-meta" style="color: rgba(255,255,255,0.75);">Komunitas pembagiar cerita</p>
            <h1 id="home-title">Jelajahi kisah dari berbagai titik Indonesia.</h1>
            <p>
              Temukan momen paling berkesan, tempat favorit, dan pengalaman unik dari para penulis di seluruh penjuru negeri.
            </p>
            <div class="hero-meta">
              <span class="hero-pill">StoryMap</span>
              <span class="hero-pill">API terverifikasi</span>
              <span class="hero-pill">Lokasi real-time</span>
            </div>
          </div>
          <div class="hero-cta">
            <a href="#/add-story" class="primary-btn">Bagikan cerita</a>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="story-panel">
            <div class="panel-header">
              <h2>Daftar Cerita</h2>
              <div class="filter-controls">
                <label for="story-search" class="sr-only">Cari cerita</label>
                <input id="story-search" class="story-filter" type="search" placeholder="Cari cerita" />
                <label for="location-filter" class="sr-only">Filter lokasi cerita</label>
                <select id="location-filter" class="story-filter" aria-label="Filter lokasi cerita">
                  <option value="0">Semua cerita</option>
                  <option value="1">Hanya dengan lokasi</option>
                </select>
              </div>
            </div>
            <ul id="story-list" class="story-list" aria-live="polite"></ul>
            <div class="offline-library">
              <div class="panel-header">
                <h2>Perpustakaan offline</h2>
                <span id="saved-story-count" class="story-meta">0 tersimpan</span>
              </div>
              <ul id="saved-story-list" class="story-list" aria-live="polite"></ul>
            </div>
          </div>

          <div class="map-panel">
            <div id="story-map" aria-label="Peta cerita dari API"></div>
            <div class="map-caption">
              Klik marker di peta atau item di daftar untuk melihat detail cerita.
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const token = getAuthToken();
    if (!token) {
      location.hash = '#/login';
      return;
    }

    const listElement = document.querySelector('#story-list');
    const savedListElement = document.querySelector('#saved-story-list');
    const savedCountElement = document.querySelector('#saved-story-count');
    const filterElement = document.querySelector('#location-filter');
    const searchElement = document.querySelector('#story-search');

    let map = null;
    let markerLayer = null;
    if (window.L) {
      map = L.map('story-map').setView(defaultCenter, 5);
      const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
      });

      L.control.layers(
        {
          'Standard': standardLayer,
          'Satelit': satelliteLayer,
        },
        null,
        { position: 'topright' }
      ).addTo(map);
      markerLayer = L.layerGroup().addTo(map);
    } else {
      document.querySelector('#story-map').innerHTML = '<p class="map-caption">Peta tersedia kembali saat koneksi internet tersedia.</p>';
    }
    let selectedStoryId = null;

    let currentStories = [];

    const renderList = (stories) => {
      if (!stories.length) {
        listElement.innerHTML = '<li class="empty-state">Belum ada cerita yang tersedia untuk filter ini.</li>';
        return;
      }

      listElement.innerHTML = stories
        .map((story) => {
          const activeClass = story.id === selectedStoryId ? 'story-item active' : 'story-item';
          const storyDate = formatDate(story.createdAt);
          const storyDescription = story.description || 'Tidak ada deskripsi.';

          return `
            <li class="${activeClass}">
              <button type="button" data-story-id="${story.id}" aria-label="Lihat detail cerita ${story.name}">
                <article class="story-card">
                  <img src="${story.photoUrl}" alt="${story.name} - ${storyDescription}" />
                  <div class="story-card-body">
                    <span class="story-meta">${storyDate}</span>
                    <h3 class="story-title">${story.name}</h3>
                    <p class="story-description">${storyDescription}</p>
                    <span class="story-meta">${story.lat && story.lon ? 'Memiliki lokasi' : 'Tanpa lokasi'}</span>
                  </div>
                </article>
              </button>
            </li>
          `;
        })
        .join('');

      listElement.querySelectorAll('[data-story-id]').forEach((button) => {
        button.addEventListener('click', () => {
          const targetStory = stories.find((story) => story.id === button.dataset.storyId);
          if (!targetStory) return;

          selectedStoryId = targetStory.id;
          renderList(stories);

          if (targetStory.lat && targetStory.lon) {
            if (!map) return;
            map.flyTo([targetStory.lat, targetStory.lon], 10, { animate: true, duration: 1.4 });
            const popup = L.popup().setLatLng([targetStory.lat, targetStory.lon]).setContent(`
              <div>
                <strong>${targetStory.name}</strong><br />
                <span>${targetStory.description}</span>
              </div>
            `);
            popup.openOn(map);
          }
        });
      });
    };

    const renderSavedStories = async () => {
      const savedStories = await getSavedStories();
      savedCountElement.textContent = `${savedStories.length} tersimpan`;
      savedListElement.innerHTML = savedStories.length
        ? savedStories.map((story) => `
          <li class="saved-story-row">
            <span>${story.name}</span>
            <button class="btn-ghost" type="button" data-delete-story="${story.id}">Hapus</button>
          </li>
        `).join('')
        : '<li class="empty-state">Belum ada cache cerita. Cerita yang berhasil dimuat akan tersimpan di sini.</li>';

      savedListElement.querySelectorAll('[data-delete-story]').forEach((button) => {
        button.addEventListener('click', async () => {
          await deleteSavedStory(button.dataset.deleteStory);
          await renderSavedStories();
        });
      });
    };

    const renderFilteredStories = () => {
      const query = searchElement.value.trim().toLowerCase();
      const filteredStories = currentStories.filter((story) => {
        const matchesSearch = !query || `${story.name} ${story.description}`.toLowerCase().includes(query);
        const matchesLocation = filterElement.value === '0' || (story.lat && story.lon);
        return matchesSearch && matchesLocation;
      });
      renderList(filteredStories);
      renderMap(filteredStories);
    };

    const renderMap = (stories) => {
      if (!map || !markerLayer) return;
      markerLayer.clearLayers();

      const validStories = stories.filter((story) => Number.isFinite(story.lat) && Number.isFinite(story.lon));

      if (!validStories.length) {
        map.setView(defaultCenter, 5);
        return;
      }

      const bounds = validStories.map((story) => [story.lat, story.lon]);
      map.fitBounds(bounds, { padding: [30, 30] });

      validStories.forEach((story) => {
        const marker = L.marker([story.lat, story.lon]).addTo(markerLayer);

        marker.bindPopup(`
          <div style="max-width: 220px;">
            <strong>${story.name}</strong>
            <p>${story.description}</p>
            <img src="${story.photoUrl}" alt="${story.name} - ${story.description}" style="width: 100%; border-radius: 8px; margin-top: 0.6rem;" />
          </div>
        `);

        marker.on('click', () => {
          selectedStoryId = story.id;
          renderList(stories);
        });
      });
    };

    const fetchStories = async (location) => {
      const response = await getStories({ page: 1, size: 20, location });
      currentStories = response.listStory ?? [];
      await saveStories(currentStories);
      renderFilteredStories();
      await renderSavedStories();
    };

    const loadCachedStories = async () => {
      currentStories = await getSavedStories();
      renderFilteredStories();
      await renderSavedStories();
    };

    filterElement.addEventListener('change', async (event) => {
      const location = Number(event.target.value);
      if (navigator.onLine) await fetchStories(location);
      else renderFilteredStories();
    });
    searchElement.addEventListener('input', renderFilteredStories);

    try {
      if (navigator.onLine) await fetchStories(0);
      else await loadCachedStories();
    } catch (error) {
      await loadCachedStories();
    }
  }
}

