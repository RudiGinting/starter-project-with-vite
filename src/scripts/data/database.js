const DATABASE_NAME = 'storymap-database';
const DATABASE_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('stories')) {
        database.createObjectStore('stories', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('pendingStories')) {
        database.createObjectStore('pendingStories', { keyPath: 'localId', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runTransaction(storeName, mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function saveStories(stories) {
  return runTransaction('stories', 'readwrite', (store) => {
    stories.forEach((story) => store.put(story));
    return store.getAll();
  });
}

export function getSavedStories() {
  return runTransaction('stories', 'readonly', (store) => store.getAll());
}

export function deleteSavedStory(storyId) {
  return runTransaction('stories', 'readwrite', (store) => store.delete(storyId));
}

export function queueStory(story) {
  return runTransaction('pendingStories', 'readwrite', (store) => store.add(story));
}

export function getQueuedStories() {
  return runTransaction('pendingStories', 'readonly', (store) => store.getAll());
}

export function deleteQueuedStory(localId) {
  return runTransaction('pendingStories', 'readwrite', (store) => store.delete(localId));
}