const DB_NAME = 'railtrack_media'
const STORE_NAME = 'media'
const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('rapportId', 'rapportId', { unique: false })
      }
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = e => reject(e.target.error)
  })
}

export const mediaDbService = {
  async ajouter(rapportId, file) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const item = { rapportId: String(rapportId), name: file.name, type: file.type, data: reader.result, addedAt: new Date().toISOString() }
        const req = store.add(item)
        req.onsuccess = e => resolve({ ...item, id: e.target.result })
        req.onerror = e => reject(e.target.error)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  async listerPourRapport(rapportId) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const index = store.index('rapportId')
      const req = index.getAll(String(rapportId))
      req.onsuccess = e => resolve(e.target.result)
      req.onerror = e => reject(e.target.error)
    })
  },

  async supprimer(id) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(id)
      tx.oncomplete = () => resolve(true)
      tx.onerror = e => reject(e.target.error)
    })
  },

  async migrerVersRapport(tempId, rapportId) {
    const db = await openDb()
    const items = await this.listerPourRapport(tempId)
    return Promise.all(items.map(item => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put({ ...item, rapportId: String(rapportId) })
      tx.oncomplete = () => resolve(true)
      tx.onerror = e => reject(e.target.error)
    })))
  },
}
