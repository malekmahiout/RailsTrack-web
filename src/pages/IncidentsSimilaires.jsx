import { useParams, useNavigate, Link } from 'react-router-dom'
import { storageService } from '../services/storage.js'
import { getStatutLabel, getStatutColor } from '../constants/avariesTypes.js'

const STATUT_CHIPS = {
  success: 'chip-success',
  warning: 'chip-warning',
  primary: 'bg-primary-50 text-primary-900 badge',
  default: 'badge bg-gray-100 text-gray-600',
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function IncidentsSimilaires() {
  const { id } = useParams()
  const navigate = useNavigate()

  const rapport = storageService.trouver(id)
  if (!rapport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-12 text-center max-w-sm">
          <p className="text-gray-500 mb-4">Incident introuvable</p>
          <button onClick={() => navigate('/rapports')} className="btn-primary">Retour</button>
        </div>
      </div>
    )
  }

  const similaires = storageService.trouverSimilaires(rapport)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/rapports/${id}`)}
            className="btn-icon text-gray-500 hover:bg-gray-200"
            aria-label="Retour à l'incident"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Incidents similaires</h1>
            <p className="text-sm text-gray-500 truncate max-w-xs">
              {rapport.vehicule ? `Véhicule : ${rapport.vehicule} — ` : ''}{rapport.titre}
            </p>
          </div>
        </div>

        {/* Résultats */}
        {similaires.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">Aucun incident similaire trouvé</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{similaires.length} incident{similaires.length > 1 ? 's' : ''} trouvé{similaires.length > 1 ? 's' : ''}</p>
            <div className="space-y-3" role="list">
              {similaires.map(r => {
                const color = getStatutColor(r.statut)
                return (
                  <article key={r.id} className="card hover:shadow-lg transition-shadow duration-200 group animate-fade-in">
                    <Link
                      to={`/rapports/${r.id}`}
                      className="block p-5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 rounded-xl"
                      aria-label={`Ouvrir l'incident : ${r.titre}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex-1 min-w-0">
                          {r.numero && (
                            <span className="text-xs font-mono text-gray-400 block mb-0.5">{r.numero}</span>
                          )}
                          <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
                            {r.titre || 'Sans titre'}
                          </h3>
                          {r.vehicule && (
                            <p className="text-xs text-gray-400 mt-0.5">Véhicule : {r.vehicule}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={STATUT_CHIPS[color] || STATUT_CHIPS.default}>{getStatutLabel(r.statut)}</span>
                          <time className="text-xs text-gray-400">{formatDate(r.createdAt)}</time>
                        </div>
                      </div>
                    </Link>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
