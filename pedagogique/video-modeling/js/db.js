(function () {
  'use strict';
  let database;
  window.VideoDB = {
    async open() {
      database = await new Promise((resolve, reject) => {
        const request = indexedDB.open('routine-video-modeling', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('activities', { keyPath: 'id' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Fermez les autres onglets de cette application.'));
      });
      database.onversionchange = () => database.close();
    },
    all() {
      return new Promise((resolve, reject) => {
        const request = database.transaction('activities').objectStore('activities').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    save(activity) {
      return new Promise((resolve, reject) => {
        const transaction = database.transaction('activities', 'readwrite');
        transaction.objectStore('activities').put(activity);
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error || new Error('Enregistrement interrompu.'));
        transaction.onerror = () => reject(transaction.error);
      });
    }
  };
})();
