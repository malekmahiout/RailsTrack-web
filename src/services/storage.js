const STORAGE_KEY = 'railtrack_rapports'

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAll(rapports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rapports))
}

function nextId(rapports) {
  return rapports.length ? Math.max(...rapports.map(r => r.id)) + 1 : 1
}

export const storageService = {
  lister() {
    return loadAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  trouver(id) {
    return loadAll().find(r => r.id === Number(id)) || null
  },

  creer(data) {
    const rapports = loadAll()
    const rapport = {
      ...data,
      id: nextId(rapports),
      statut: data.statut || 'WAPPR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    rapports.push(rapport)
    saveAll(rapports)
    return rapport
  },

  modifier(id, data) {
    const rapports = loadAll()
    const idx = rapports.findIndex(r => r.id === Number(id))
    if (idx === -1) return null
    rapports[idx] = { ...rapports[idx], ...data, updatedAt: new Date().toISOString() }
    saveAll(rapports)
    return rapports[idx]
  },

  supprimer(id) {
    const rapports = loadAll()
    const filtered = rapports.filter(r => r.id !== Number(id))
    saveAll(filtered)
    return filtered.length < rapports.length
  },
}
