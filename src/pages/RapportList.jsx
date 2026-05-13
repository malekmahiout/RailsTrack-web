import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { storageService } from '../services/storage.js'
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
          </div>
          <StatutBadge statut={rapport.statut} />
        </div>

        {rapport.typeAvarie && (
          <p className="text-xs text-accent-dark font-semibold mb-2">{rapport.typeAvarie}</p>
        )}

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
  const navigate = useNavigate()

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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filtered.length} rapport{filtered.length > 1 ? 's' : ''}
              {hasFilters ? ' (filtré)' : ''}
            </p>
          </div>
          <Link to="/rapports/nouveau" className="btn-primary hidden sm:inline-flex" aria-label="Créer un nouveau rapport">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau rapport
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <label htmlFor="search-rapports" className="sr-only">Rechercher un rapport</label>
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
          <div className="space-y-3" role="list" aria-label="Liste des rapports">
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
              {hasFilters ? 'Aucun résultat' : 'Aucun rapport'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {hasFilters ? 'Modifiez vos filtres' : 'Créez votre premier rapport d\'intervention'}
            </p>
            {!hasFilters && (
              <Link to="/rapports/nouveau" className="btn-primary inline-flex">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créer un rapport
              </Link>
            )}
          </div>
        )}
      </div>

      {/* FAB mobile */}
      <Link
        to="/rapports/nouveau"
        className="fab sm:hidden"
        aria-label="Créer un nouveau rapport"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  )
}
