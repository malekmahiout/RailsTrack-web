import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RichEditor from '../components/RichEditor.jsx'
import MediaGallery from '../components/MediaGallery.jsx'
import AudioRecorder from '../components/AudioRecorder.jsx'
import { groqService } from '../services/groq.js'
import { storageService } from '../services/storage.js'
import { mediaDbService } from '../services/mediaDb.js'
import { AVARIE_TYPES } from '../constants/avariesTypes.js'

const TEMP_RAPPORT_ID = 'temp_new'
const SESSION_KEY = 'railtrack_create_session'

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}
function saveSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export default function RapportCreate() {
  const session = loadSession()
  const [titre, setTitre] = useState(session?.titre || '')
  const [contenu, setContenu] = useState(session?.contenu || '')
  const [typeAvarie, setTypeAvarie] = useState(session?.typeAvarie || '')
  const [statut, setStatut] = useState(session?.statut || 'WAPPR')
  const [similaires, setSimilaires] = useState([])
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    saveSession({ titre, contenu, typeAvarie, statut })
  }, [titre, contenu, typeAvarie, statut])

  async function handleTranscription(audioBlob) {
    const rawText = await groqService.transcribeAudio(audioBlob)
    const parsed = await groqService.reformulerEnTerpro(rawText)
    if (parsed.titre) setTitre(parsed.titre)
    if (parsed.contenu) setContenu(parsed.contenu)
    if (parsed.typeAvarie) setTypeAvarie(parsed.typeAvarie)

    const all = storageService.lister()
    if (parsed.titre || rawText) {
      const sims = await groqService.trouverTicketsSimilaires(parsed.titre || rawText, all)
      setSimilaires(sims)
    }
  }

  async function handleSave() {
    if (!titre.trim()) return
    setSaving(true)
    try {
      const rapport = storageService.creer({ titre: titre.trim(), contenu, typeAvarie, statut })
      await mediaDbService.migrerVersRapport(TEMP_RAPPORT_ID, rapport.id)
      clearSession()
      navigate(`/rapports/${rapport.id}`, { state: { fromCreate: true } })
    } finally {
      setSaving(false)
    }
  }

  const hasApiKey = !!groqService.getApiKey()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/rapports')}
            className="btn-icon text-gray-500 hover:bg-gray-200"
            aria-label="Retour à la liste"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nouveau rapport</h1>
            <p className="text-sm text-gray-500">Rapport d'intervention TERPRO</p>
          </div>
        </div>

        {/* Groq warning */}
        {!hasApiKey && (
          <div role="alert" className="card p-4 mb-5 border-l-4 border-amber-400 bg-amber-50 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Clé API Groq manquante</p>
              <p>Configurez votre clé dans <a href="/parametres" className="underline hover:text-amber-900">Paramètres</a> pour utiliser la transcription vocale et l'IA.</p>
            </div>
          </div>
        )}

        {/* Similar tickets warning */}
        {similaires.length > 0 && (
          <div role="alert" className="card p-4 mb-5 border-l-4 border-orange-400 bg-orange-50">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-orange-800">
                <p className="font-semibold mb-1">{similaires.length} ticket(s) similaire(s) détecté(s)</p>
                <ul className="space-y-1">
                  {similaires.map(s => (
                    <li key={s.id}>
                      <a href={`/rapports/${s.id}`} className="underline hover:text-orange-900">#{s.id} — {s.titre}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => setSimilaires([])}
              className="mt-3 text-xs text-orange-600 hover:text-orange-800 cursor-pointer underline focus:outline-none"
              aria-label="Ignorer les doublons potentiels"
            >
              Ignorer
            </button>
          </div>
        )}

        {/* Audio Recording */}
        <div className="card p-6 mb-5 text-center">
          <h2 className="section-title text-center">Enregistrement vocal</h2>
          <p className="text-sm text-gray-500 mb-5">Dictez votre rapport — l'IA le transcrit et structure automatiquement</p>
          <AudioRecorder onTranscribed={handleTranscription} disabled={!hasApiKey} />
        </div>

        {/* Form */}
        <div className="card p-6 mb-5 space-y-5">
          <h2 className="section-title">Informations du rapport</h2>

          <div>
            <label htmlFor="titre" className="label">Titre <span className="text-red-500" aria-hidden="true">*</span></label>
            <input
              id="titre"
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              className="input"
              placeholder="Titre de l'intervention"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="typeAvarie" className="label">Type d'avarie</label>
            <select id="typeAvarie" value={typeAvarie} onChange={e => setTypeAvarie(e.target.value)} className="input">
              <option value="">Sélectionner...</option>
              {AVARIE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Statut</label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Statut du rapport">
              {[
                { value: 'WAPPR', label: 'En attente' },
                { value: 'INPRG', label: 'En cours' },
                { value: 'COMP', label: 'Complété' },
                { value: 'CLOSE', label: 'Clôturé' },
              ].map(s => (
                <label key={s.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="statut"
                    value={s.value}
                    checked={statut === s.value}
                    onChange={() => setStatut(s.value)}
                    className="sr-only"
                  />
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer
                    ${statut === s.value ? 'border-primary-700 bg-primary-50 text-primary-900' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="card p-6 mb-5">
          <h2 className="section-title">Contenu de l'intervention</h2>
          <RichEditor value={contenu} onChange={setContenu} placeholder="Décrivez les actions effectuées..." />
        </div>

        {/* Media */}
        <div className="card p-6 mb-6">
          <h2 className="section-title">Photos et vidéos</h2>
          <MediaGallery rapportId={TEMP_RAPPORT_ID} readOnly={false} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button onClick={() => navigate('/rapports')} className="btn-secondary">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !titre.trim()}
            className="btn-primary px-8"
            aria-label="Enregistrer le rapport"
          >
            {saving ? (
              <>
                <div className="spinner w-4 h-4 border-white" aria-hidden="true" />
                Enregistrement...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
