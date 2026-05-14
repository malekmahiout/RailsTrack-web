import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'
import RichEditor from '../components/RichEditor.jsx'
import AudioRecorder from '../components/AudioRecorder.jsx'
import { storageService } from '../services/storage.js'
import { groqService } from '../services/groq.js'
import { getStatutLabel, getStatutColor } from '../constants/avariesTypes.js'

const STATUT_CHIPS = {
  success: 'chip-success',
  warning: 'chip-warning',
  primary: 'bg-primary-50 text-primary-900 badge',
  default: 'badge bg-gray-100 text-gray-600',
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDateCourt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function RapportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const fromCreate = location.state?.fromCreate
  const openedFromCreate = searchParams.get('fromCreate') === '1'

  const [rapport, setRapport] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [vehicule, setVehicule] = useState('')
  const [statut, setStatut] = useState('')
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // ← useMemo AVANT les early returns
  const similaires = useMemo(
    () => rapport ? storageService.trouverSimilaires(rapport, 5) : [],
    [rapport]
  )

  useEffect(() => {
    const r = storageService.trouver(id)
    if (!r) { setNotFound(true); return }
    setRapport(r)
    setTitre(r.titre || '')
    setContenu(r.contenu || '')
    setVehicule(r.vehicule || '')
    setStatut(r.statut || 'WAPPR')
  }, [id])

  async function handleVoiceEdit(audioBlob) {
    const instructions = await groqService.transcribeAudio(audioBlob)
    const now = new Date()
    const ts = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const tsHtml = `<p><strong>Dictée du ${ts}</strong></p>`
    const updated = await groqService.editerContenuVocal(`${contenu}${tsHtml}`, instructions)
    setContenu(updated)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = storageService.modifier(id, { titre, contenu, vehicule, statut })
      setRapport(updated)
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    const description = rapport.contenu?.replace(/<\/?(ul|ol|li|p|br|div|h\d)[^>]*>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim()
    const subject = rapport.numero ? `${rapport.numero} – ${rapport.titre}` : rapport.titre
    const body = [
      rapport.titre,
      rapport.numero ? `Référence : ${rapport.numero}` : null,
      `Créé le : ${formatDate(rapport.createdAt)}${rapport.updatedAt !== rapport.createdAt ? `  /  Modifié le : ${formatDate(rapport.updatedAt)}` : ''}`,
      '',
      description,
    ].filter(l => l !== null).join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ title: subject, text: body })
        return
      } catch (e) {
        if (e.name === 'AbortError') return
      }
    }
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-12 text-center max-w-sm">
          <p className="text-gray-500 mb-4">Rapport introuvable</p>
          <button onClick={() => navigate('/rapports')} className="btn-primary">Retour à la liste</button>
        </div>
      </div>
    )
  }

  if (!rapport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" aria-live="polite" aria-busy="true">
        <div className="spinner w-8 h-8 border-primary-500" role="status">
          <span className="sr-only">Chargement...</span>
        </div>
      </div>
    )
  }

  const hasApiKey = !!groqService.getApiKey()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              if (openedFromCreate) {
                window.close()
              } else if (fromCreate) {
                navigate('/rapports')
              } else {
                navigate(-1)
              }
            }}
            className="btn-icon text-gray-500 hover:bg-gray-200"
            aria-label="Retour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-medium text-gray-400">{rapport.numero || `#${rapport.id}`}</span>
              <span className={STATUT_CHIPS[getStatutColor(rapport.statut)] || STATUT_CHIPS.default}>
                {getStatutLabel(rapport.statut)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 truncate mt-0.5">{rapport.titre || 'Sans titre'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="btn-icon text-gray-500 hover:bg-gray-100"
              aria-label="Partager ce rapport"
              title="Partager"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              onClick={() => { if (editMode && !confirm('Annuler les modifications ?')) return; setEditMode(e => !e) }}
              className={editMode ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
              aria-pressed={editMode}
            >
              {editMode ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Annuler
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier
                </>
              )}
            </button>
          </div>
        </div>

        {/* Meta infos */}
        <div className="card p-5 mb-5">
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="detail-titre" className="label">Titre</label>
                <input id="detail-titre" type="text" value={titre} onChange={e => setTitre(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="detail-vehicule" className="label">Véhicule</label>
                <input id="detail-vehicule" type="text" value={vehicule} onChange={e => setVehicule(e.target.value)} className="input" placeholder="Numéro ou nom du véhicule" />
              </div>
              <div>
                <label className="label">Statut</label>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Statut">
                  {[{ value: 'WAPPR', label: 'En attente' }, { value: 'INPRG', label: 'En cours' }, { value: 'COMP', label: 'Complété' }, { value: 'CLOSE', label: 'Clôturé' }].map(s => (
                    <label key={s.value} className="cursor-pointer">
                      <input type="radio" name="detail-statut" value={s.value} checked={statut === s.value} onChange={() => setStatut(s.value)} className="sr-only" />
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer
                        ${statut === s.value ? 'border-primary-700 bg-primary-50 text-primary-900' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                        {s.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Véhicule', value: rapport.vehicule },
                { label: 'Créé le', value: formatDate(rapport.createdAt) },
                { label: 'Modifié le', value: formatDate(rapport.updatedAt) },
              ].filter(f => f.value).map(f => (
                <div key={f.label}>
                  <dt className="text-xs text-gray-400 font-medium mb-0.5">{f.label}</dt>
                  <dd className="text-sm text-gray-800 font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Voice edit */}
        {editMode && hasApiKey && (
          <div className="card p-5 mb-5 text-center">
            <h2 className="section-title text-center text-sm mb-1">Édition vocale</h2>
            <p className="text-xs text-gray-500 mb-4">Dictez des instructions pour modifier le contenu</p>
            <AudioRecorder onTranscribed={handleVoiceEdit} />
          </div>
        )}

        {/* Content */}
        <div className="card p-6 mb-5">
          <h2 className="section-title">Contenu de l'intervention</h2>
          {editMode ? (
            <RichEditor value={contenu} onChange={setContenu} placeholder="Contenu de l'intervention..." />
          ) : (
            <RichEditor value={contenu} readOnly />
          )}
        </div>

        {/* Incidents similaires */}
        <div className="card p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Incidents similaires</h2>
            {similaires.length > 0 && (
              <Link
                to={`/rapports/${rapport.id}/similaires`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-700 hover:underline font-medium"
              >
                Voir tous →
              </Link>
            )}
          </div>
          {similaires.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun incident similaire trouvé.</p>
          ) : (
            <ul className="space-y-1">
              {similaires.map(r => (
                <li key={r.id}>
                  <Link
                    to={`/rapports/${r.id}`}
                    className="flex items-start justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      {r.numero && (
                        <span className="text-xs font-mono text-gray-400 block">{r.numero}</span>
                      )}
                      <p className="text-sm font-medium text-gray-800 group-hover:text-primary-700 truncate">{r.titre || 'Sans titre'}</p>
                      {r.vehicule && (
                        <p className="text-xs text-gray-400">Véhicule : {r.vehicule}</p>
                      )}
                    </div>
                    <time className="text-xs text-gray-400 shrink-0 pt-0.5">{formatDateCourt(r.createdAt)}</time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Save */}
        {editMode && (
          <div className="flex justify-end gap-3 pb-6">
            <button onClick={() => setEditMode(false)} className="btn-secondary">Annuler</button>
            <button onClick={handleSave} disabled={saving || !titre.trim()} className="btn-primary px-8">
              {saving ? (
                <><div className="spinner w-4 h-4 border-white" aria-hidden="true" /> Sauvegarde...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Sauvegarder</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
