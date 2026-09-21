import { addStory } from '../../data/api';
import { queueStory } from '../../data/database';

let selectedPhotoFile = null;
let cameraStream = null;

function showNotice(element, type, message) {
  if (!element) return;
  element.textContent = message;
  element.className = `notice ${type} show`;
}

function formatCoordinate(value) {
  if (value === '' || value === null || value === undefined) return '';
  return Number(value).toFixed(5);
}

export default class AddStoryPage {
  async render() {
    return `
      <section class="container page-shell" aria-labelledby="add-story-title">
        <div class="story-form-layout">
          <div class="form-panel">
            <h1 id="add-story-title">Tambah Cerita Baru</h1>
            <p class="story-meta">Ceritakan pengalaman Anda dengan lokasi yang relevan.</p>

            <div id="story-form-message" class="notice" aria-live="polite"></div>

            <form id="add-story-form" novalidate>
              <div class="form-grid">
                <div class="form-row">
                  <label for="story-description">Deskripsi</label>
                  <textarea
                    id="story-description"
                    class="form-textarea"
                    name="description"
                    placeholder="Ceritakan pengalaman, momen, atau tempat favorit Anda..."
                    required
                  ></textarea>
                </div>

                <div class="form-row">
                  <label for="story-photo">Upload foto</label>
                  <input
                    id="story-photo"
                    class="form-input"
                    type="file"
                    name="photo"
                    accept="image/*"
                    capture="environment"
                    required
                  />
                </div>

                <div class="form-row">
                  <label>Pratinjau foto</label>
                  <img
                    id="story-preview"
                    src=""
                    alt="Pratinjau foto cerita"
                    style="display: none; width: 100%; min-height: 240px; border-radius: 16px; object-fit: cover; background: #e9eef8;"
                  />
                </div>

                <div class="form-row two-col">
                  <div>
                    <label for="story-lat">Latitude</label>
                    <input id="story-lat" class="form-input" type="number" step="any" name="lat" placeholder="-6.2088" />
                  </div>
                  <div>
                    <label for="story-lon">Longitude</label>
                    <input id="story-lon" class="form-input" type="number" step="any" name="lon" placeholder="106.8456" />
                  </div>
                </div>

                <div class="form-actions">
                  <button type="button" class="secondary-btn" id="open-camera-btn">
                    Gunakan kamera
                  </button>
                  <button type="submit" class="primary-btn" id="story-submit">
                    Kirim cerita
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div class="map-panel">
            <div id="add-story-map" aria-label="Peta untuk memilih lokasi cerita"></div>
            <div class="map-caption">
              Klik pada peta untuk menentukan latitude dan longitude. Lokasi ditampilkan di sini.
            </div>
          </div>
        </div>

        <div class="feature-card" style="margin-top: 1.5rem;">
          <h2>Kamera langsung</h2>
          <video id="camera-preview" autoplay playsinline muted style="display: none; width: 100%; border-radius: 16px; background: #0f172a;"></video>
          <div class="form-actions">
            <button type="button" class="btn-ghost secondary-btn" id="capture-photo-btn" style="display: none;">
              Ambil foto
            </button>
            <button type="button" class="btn-ghost" id="close-camera-btn" style="display: none;">
              Tutup kamera
            </button>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.querySelector('#add-story-form');
    const message = document.querySelector('#story-form-message');
    const photoInput = document.querySelector('#story-photo');
    const photoPreview = document.querySelector('#story-preview');
    const latitudeInput = document.querySelector('#story-lat');
    const longitudeInput = document.querySelector('#story-lon');
    const submitButton = document.querySelector('#story-submit');
    const cameraPreview = document.querySelector('#camera-preview');
    const openCameraButton = document.querySelector('#open-camera-btn');
    const capturePhotoButton = document.querySelector('#capture-photo-btn');
    const closeCameraButton = document.querySelector('#close-camera-btn');

    const map = L.map('add-story-map', { zoomControl: true }).setView([-2.5489, 118.0156], 4);
    const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
    });

    const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    });

    L.control.layers(
      {
        'Standard': standardLayer,
        'Satelit': satelliteLayer,
        'Light': lightLayer,
      },
      null,
      { position: 'topright' }
    ).addTo(map);

    const marker = L.marker([-2.5489, 118.0156], { draggable: true }).addTo(map);

    const moveMarker = (lat, lon) => {
      marker.setLatLng([lat, lon]);
      latitudeInput.value = formatCoordinate(lat);
      longitudeInput.value = formatCoordinate(lon);
      map.flyTo([lat, lon], 10, { animate: true, duration: 1.5 });
    };

    map.on('click', (event) => {
      moveMarker(event.latlng.lat, event.latlng.lng);
    });

    marker.on('dragend', (event) => {
      const position = event.target.getLatLng();
      moveMarker(position.lat, position.lng);
    });

    photoInput.addEventListener('change', (event) => {
      const [file] = event.target.files;
      if (!file) return;

      selectedPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        photoPreview.src = loadEvent.target.result;
        photoPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });

    const stopCamera = () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        cameraStream = null;
      }
      cameraPreview.srcObject = null;
      cameraPreview.style.display = 'none';
      capturePhotoButton.style.display = 'none';
      closeCameraButton.style.display = 'none';
    };

    openCameraButton.addEventListener('click', async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotice(message, 'error', 'Browser Anda tidak mendukung kamera digital.');
        return;
      }

      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        cameraPreview.srcObject = cameraStream;
        cameraPreview.style.display = 'block';
        capturePhotoButton.style.display = 'inline-flex';
        closeCameraButton.style.display = 'inline-flex';
      } catch (error) {
        showNotice(message, 'error', 'Tidak dapat mengakses kamera. Pastikan izin kamera sudah Anda izinkan.');
      }
    });

    capturePhotoButton.addEventListener('click', () => {
      if (!cameraStream) return;

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = cameraPreview.videoWidth || 1280;
      canvas.height = cameraPreview.videoHeight || 720;
      context.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) return;

        selectedPhotoFile = new File([blob], 'story-camera-photo.png', { type: 'image/png' });
        const reader = new FileReader();
        reader.onload = (event) => {
          photoPreview.src = event.target.result;
          photoPreview.style.display = 'block';
          const dt = new DataTransfer();
          dt.items.add(selectedPhotoFile);
          photoInput.files = dt.files;
        };
        reader.readAsDataURL(blob);
        stopCamera();
      }, 'image/png');
    });

    closeCameraButton.addEventListener('click', stopCamera);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const description = document.querySelector('#story-description').value.trim();
      const selectedFile = selectedPhotoFile || photoInput.files[0];
      const lat = latitudeInput.value;
      const lon = longitudeInput.value;

      if (!description || !selectedFile) {
        showNotice(message, 'error', 'Deskripsi dan foto wajib diisi.');
        return;
      }

      if (!lat || !lon) {
        showNotice(message, 'error', 'Pilih lokasi dengan mengeklik peta terlebih dahulu.');
        return;
      }

      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="submit-loading"><span class="spinner"></span> Mengirim...</span>';

      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', selectedFile);
      formData.append('lat', Number(lat));
      formData.append('lon', Number(lon));

      try {
        const result = await addStory(formData);

        if (result.error) {
          showNotice(message, 'error', result.message || 'Gagal menambahkan cerita.');
          submitButton.disabled = false;
          submitButton.textContent = 'Kirim cerita';
          return;
        }

        showNotice(message, 'success', 'Cerita berhasil ditambahkan. Mengalihkan ke beranda...');
        form.reset();
        selectedPhotoFile = null;
        photoPreview.src = '';
        photoPreview.style.display = 'none';
        stopCamera();
        setTimeout(() => {
          location.hash = '#/';
        }, 700);
      } catch (error) {
        if (!navigator.onLine) {
          await queueStory({ description, photo: selectedFile, lat: Number(lat), lon: Number(lon) });
          showNotice(message, 'success', 'Anda sedang offline. Cerita disimpan dan akan dikirim saat online.');
          form.reset();
          selectedPhotoFile = null;
          photoPreview.src = '';
          photoPreview.style.display = 'none';
          stopCamera();
        } else {
          showNotice(message, 'error', 'Terjadi kesalahan saat mengirim cerita.');
        }
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Kirim cerita';
      }
    });
  }
}
