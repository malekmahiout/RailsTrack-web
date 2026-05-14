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

function genNumero(id, date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const j = String(d.getDate()).padStart(2, '0')
  return `INC-${y}${m}${j}-${String(id).padStart(4, '0')}`
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
    const id = nextId(rapports)
    const createdAt = new Date().toISOString()
    const rapport = {
      ...data,
      id,
      numero: genNumero(id, createdAt),
      statut: data.statut || 'WAPPR',
      createdAt,
      updatedAt: createdAt,
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

  trouverSimilaires(rapport, limit = null) {
    const tous = loadAll()
    const vehicule = rapport.vehicule?.toLowerCase().trim() || ''

    const mots = str =>
      new Set((str || '').toLowerCase().split(/[\s\-_.,;:!?/()\[\]]+/).filter(m => m.length > 2))

    const motsCourants = mots(rapport.titre)

    const scored = tous
      .filter(r => r.id !== rapport.id)
      .map(r => {
        const sameVehicule = vehicule && r.vehicule?.toLowerCase().trim() === vehicule ? 2 : 0
        const motsR = mots(r.titre)
        const inter = [...motsCourants].filter(m => motsR.has(m)).length
        const union = new Set([...motsCourants, ...motsR]).size
        const titleScore = union > 0 ? inter / union : 0
        return { rapport: r, score: sameVehicule + titleScore }
      })
      .sort((a, b) => b.score - a.score)

    const result = limit ? scored.slice(0, limit) : scored
    return result.map(s => s.rapport)
  },

  listerActifsLeJour(dateStr) {
    const debut = new Date(dateStr)
    const fin = new Date(dateStr + 'T23:59:59')
    return loadAll()
      .filter(r => {
        const created = r.createdAt ? new Date(r.createdAt) : null
        const updated = r.updatedAt ? new Date(r.updatedAt) : null
        return (created && created >= debut && created <= fin) ||
               (updated && updated >= debut && updated <= fin)
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  },

  listerParPlageDates(dateDebut, dateFin) {
    const debut = dateDebut ? new Date(dateDebut) : null
    const fin = dateFin ? new Date(dateFin + 'T23:59:59') : null
    return loadAll()
      .filter(r => {
        const d = r.createdAt ? new Date(r.createdAt) : null
        if (!d) return false
        if (debut && d < debut) return false
        if (fin && d > fin) return false
        return true
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  },

  trouverParTitre(titre) {
    if (!titre) return null
    const t = titre.trim().toLowerCase()
    return loadAll().find(r => (r.titre || '').trim().toLowerCase() === t) || null
  },

  existeAvecTitre(titre) {
    return !!this.trouverParTitre(titre)
  },

  supprimer(id) {
    const rapports = loadAll()
    const filtered = rapports.filter(r => r.id !== Number(id))
    saveAll(filtered)
    return filtered.length < rapports.length
  },
}
