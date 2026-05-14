import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { storageService } from '../services/storage.js'
import { groqService } from '../services/groq.js'
import { getStatutLabel, getStatutColor } from '../constants/avariesTypes.js'

const STATUT_CHIPS = {
  success: 'chip-success',
  warning: 'chip-warning',
  primary: 'bg-primary-50 text-primary-900 badge',
  default: 'badge bg-gray-100 text-gray-600',
}

function StatutBadge({ statut }) {
  const color = getStatutColor(statut)
  return <span className={STATUT_CHIPS[color] || STATUT_CHIPS.default}>{getStatutLabel(statut)}</span>
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function RapportCard({ rapport, onDelete }) {
  return (
    <article className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer group animate-fade-in">
      <Link to={`/rapports/${rapport.id}`} className="block p-5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 rounded-xl" aria-label={`Voir le rapport: ${rapport.titre}`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            {rapport.numero && (
              <span className="text-xs font-mono text-gray-400 block mb-0.5">{rapport.numero}</span>
            )}
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
              {rapport.titre || 'Sans titre'}
            </h3>
            {rapport.vehicule && (
              <p className="text-xs text-gray-400 mt-0.5">Véhicule : {rapport.vehicule}</p>
            )}
          </div>
          <StatutBadge statut={rapport.statut} />
        </div>

        {rapport.contenu && (
          <p
            className="text-sm text-gray-500 line-clamp-2 mb-3"
            dangerouslySetInnerHTML={{ __html: rapport.contenu.replace(/<[^>]*>/g, ' ') }}
          />
        )}

        <div className="flex items-center justify-end text-xs text-gray-400">
          <time dateTime={rapport.createdAt}>{formatDate(rapport.createdAt)}</time>
        </div>
      </Link>

      <div className="px-5 pb-4 flex justify-end border-t border-gray-50 pt-3">
        <button
          onClick={e => { e.stopPropagation(); onDelete(rapport.id) }}
          className="btn-ghost text-xs text-red-500 hover:bg-red-50 hover:text-red-700"
          aria-label={`Supprimer le rapport ${rapport.titre}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Supprimer
        </button>
      </div>
    </article>
  )
}

export default function RapportList() {
  const [rapports, setRapports] = useState([])
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [scanError, setScanError] = useState('')
  const cameraInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const hasApiKey = !!groqService.getApiKey()

  useEffect(() => { loadRapports() }, [])

  function loadRapports() {
    setRapports(storageService.lister())
  }

  function handleDelete(id) {
    const r = rapports.find(x => x.id === id)
    if (!confirm(`Supprimer le rapport "${r?.titre || id}" ?`)) return
    storageService.supprimer(id)
    loadRapports()
  }

  async function processImage(file) {
    if (!file) return
    setScanError('')
    setScanResult(null)
    setScanning(true)
    try {
      const imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = ev => resolve(ev.target.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const result = await groqService.analyserImageIncidents(imageBase64)
      if (!result.incidents?.length) {
        setScanError('Aucun incident trouvé dans la section Action de l\'image.')
        return
      }
      const vehicule = result.vehicule?.trim() || ''
      let createdCount = 0
      const doublons = []
      for (const inc of result.incidents) {
        const num = inc.numero.trim()
        const desc = inc.description?.trim() || ''
        const titre = desc ? `${num} - ${desc}` : num
        const existant = storageService.trouverParTitre(titre)
        if (existant) {
          doublons.push(existant)
          continue
        }
        storageService.creer({ titre, contenu: '', vehicule, statut: 'WAPPR' })
        createdCount++
      }
      setScanResult({ count: createdCount, doublons, vehicule })
      loadRapports()
    } catch (err) {
      setScanError(`Erreur : ${err.message}`)
    } finally {
      setScanning(false)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const filtered = useMemo(() => {
    return rapports.filter(r => {
      const q = search.toLowerCase()
      const matchSearch = !q || (r.titre || '').toLowerCase().includes(q) || (r.contenu || '').toLowerCase().includes(q) || (r.vehicule || '').toLowerCase().includes(q) || (r.reference || '').toLowerCase().includes(q)
      const d = r.createdAt ? new Date(r.createdAt) : null
      const matchFrom = !dateFrom || (d && d >= new Date(dateFrom))
      const matchTo = !dateTo || (d && d <= new Date(dateTo + 'T23:59:59'))
      return matchSearch && matchFrom && matchTo
    })
  }, [rapports, search, dateFrom, dateTo])

  const hasFilters = search || dateFrom || dateTo

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-content">
        {/* Hidden file inputs */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={e => processImage(e.target.files?.[0])} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0])} className="hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filtered.length} incident{filtered.length > 1 ? 's' : ''}
              {hasFilters ? ' (filtré)' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setScanResult(null); setScanError(''); cameraInputRef.current?.click() }}
              disabled={!hasApiKey || scanning}
              className="btn-secondary"
              title="Scanner avec la caméra"
              aria-label="Scanner avec la caméra"
            >
              {scanning ? (
                <div className="spinner w-4 h-4 border-gray-500" aria-hidden="true" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              <span className="hidden sm:inline">Scanner</span>
            </button>
            <button
              onClick={() => { setScanResult(null); setScanError(''); fileInputRef.current?.click() }}
              disabled={!hasApiKey || scanning}
              className="btn-secondary"
              title="Importer une photo"
              aria-label="Importer une photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Importer</span>
            </button>
            <Link to="/rapport-partage" className="btn-secondary inline-flex" aria-label="Générer un rapport">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Rapport</span>
            </Link>
            <Link to="/rapports/nouveau" className="btn-primary hidden sm:inline-flex" aria-label="Créer un incident">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer un incident
            </Link>
          </div>
        </div>

        {/* Feedback scan */}
        {(scanError || scanResult || scanning) && (
          <div className="mb-4">
            {scanning && <p className="text-xs text-gray-500 animate-pulse">Analyse de l'image en cours...</p>}
            {scanError && <p role="alert" className="text-xs text-red-600">{scanError}</p>}
            {scanResult && (
              <div role="status" className="text-sm">
                {scanResult.count > 0 && (
                  <div className="flex items-center gap-2 font-medium text-green-700 mb-1">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {scanResult.count} incident{scanResult.count > 1 ? 's' : ''} créé{scanResult.count > 1 ? 's' : ''}
                    {scanResult.vehicule ? ` — véhicule : ${scanResult.vehicule}` : ''}
                  </div>
                )}
                {scanResult.doublons.length > 0 && (
                  <div className="mt-1 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="text-amber-800">
                        <p className="font-semibold mb-1">
                          {scanResult.doublons.length} incident{scanResult.doublons.length > 1 ? 's' : ''} déjà existant{scanResult.doublons.length > 1 ? 's' : ''} — non recréé{scanResult.doublons.length > 1 ? 's' : ''} :
                        </p>
                        <ul className="space-y-0.5">
                          {scanResult.doublons.map(r => (
                            <li key={r.id}>
                              <Link
                                to={`/rapports/${r.id}`}
                                className="inline-flex items-center gap-1 font-mono text-xs text-amber-700 underline hover:text-amber-900"
                              >
                                {r.numero || `#${r.id}`}
                                <span className="font-sans font-normal text-amber-600 truncate max-w-[200px]">— {r.titre}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <label htmlFor="search-rapports" className="sr-only">Rechercher un incident</label>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="search-rapports"
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Titre, contenu, véhicule..."
                className="input pl-9"
              />
            </div>
            <div className="flex gap-2 items-center">
              <div>
                <label htmlFor="date-from" className="sr-only">Date de début</label>
                <input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="input text-sm w-36"
                  aria-label="Date de début"
                />
              </div>
              <span className="text-gray-400 text-sm" aria-hidden="true">–</span>
              <div>
                <label htmlFor="date-to" className="sr-only">Date de fin</label>
                <input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="input text-sm w-36"
                  aria-label="Date de fin"
                />
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
                  className="btn-ghost text-sm text-gray-500 hover:text-gray-700"
                  aria-label="Effacer les filtres"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        {filtered.length > 0 ? (
          <div className="space-y-3" role="list" aria-label="Liste des incidents">
            {filtered.map(r => (
              <div key={r.id} role="listitem">
                <RapportCard rapport={r} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {hasFilters ? 'Aucun résultat' : 'Aucun incident'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {hasFilters ? 'Modifiez vos filtres' : 'Scannez un document ou créez un incident manuellement'}
            </p>
            {!hasFilters && (
              <Link to="/rapports/nouveau" className="btn-primary inline-flex">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créer un incident
              </Link>
            )}
          </div>
        )}
      </div>

      {/* FAB mobile */}
      <Link
        to="/rapports/nouveau"
        className="fab sm:hidden"
        aria-label="Créer un incident"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  )
}
