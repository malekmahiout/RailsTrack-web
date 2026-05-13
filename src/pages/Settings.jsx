import { useState } from 'react'
import { groqService } from '../services/groq.js'

export default function Settings() {
  const [apiKey, setApiKey] = useState(groqService.getApiKey())
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    groqService.setApiKey(apiKey.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleClear() {
    if (!confirm('Supprimer la clé API Groq ?')) return
    groqService.setApiKey('')
    setApiKey('')
  }

  const isValid = apiKey.trim().startsWith('gsk_')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-content">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configuration de l'application RailTrack</p>
        </div>

        {/* Groq API */}
        <div className="card p-6 mb-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Groq API — Intelligence Artificielle</h2>
              <p className="text-sm text-gray-500">Utilisée pour la transcription vocale (Whisper) et la reformulation automatique des rapports (LLaMA 3.3).</p>
            </div>
          </div>

          <form onSubmit={handleSave} noValidate>
            <div className="mb-4">
              <label htmlFor="groq-key" className="label">Clé API Groq</label>
              <div className="relative">
                <input
                  id="groq-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setSaved(false) }}
                  className="input pr-12 font-mono text-sm"
                  placeholder="gsk_..."
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="groq-key-hint"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-0.5"
                  aria-label={showKey ? 'Masquer la clé' : 'Afficher la clé'}
                  aria-pressed={showKey}
                >
                  {showKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p id="groq-key-hint" className="text-xs text-gray-400 mt-1.5">
                Format: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 font-mono">gsk_...</code> — Obtenez votre clé sur console.groq.com
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!apiKey.trim()}
                className={`btn-primary ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
                aria-label="Sauvegarder la clé API"
              >
                {saved ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sauvegardé !
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Sauvegarder
                  </>
                )}
              </button>
              {apiKey && (
                <button type="button" onClick={handleClear} className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-700">
                  Supprimer la clé
                </button>
              )}
            </div>

            {apiKey && (
              <div className={`mt-3 flex items-center gap-2 text-sm ${isValid ? 'text-green-700' : 'text-amber-700'}`} role="status">
                <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-amber-500'}`} aria-hidden="true" />
                {isValid ? 'Format de clé valide' : 'Format de clé invalide (doit commencer par gsk_)'}
              </div>
            )}
          </form>
        </div>

        {/* App info */}
        <div className="card p-6 mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">À propos de RailTrack</h2>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Application', value: 'RailTrack – TERPRO' },
              { label: 'Version', value: '1.0.0' },
              { label: 'Modèle IA', value: 'LLaMA 3.3-70B (Groq)' },
              { label: 'Transcription', value: 'Whisper large-v3 (Groq)' },
              { label: 'Stockage', value: 'LocalStorage + IndexedDB (local)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                <dt className="text-gray-500 font-medium">{label}</dt>
                <dd className="text-gray-800 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Danger zone */}
        <div className="card p-6 border-red-100">
          <h2 className="text-base font-bold text-red-700 mb-2">Zone de danger</h2>
          <p className="text-sm text-gray-500 mb-4">Ces actions sont irréversibles.</p>
          <button
            onClick={() => {
              if (!confirm('Supprimer TOUS les rapports ? Cette action est irréversible.')) return
              localStorage.removeItem('railtrack_rapports')
              alert('Tous les rapports ont été supprimés.')
            }}
            className="btn-danger text-sm"
            aria-label="Supprimer tous les rapports"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer tous les rapports
          </button>
        </div>
      </div>
    </div>
  )
}
