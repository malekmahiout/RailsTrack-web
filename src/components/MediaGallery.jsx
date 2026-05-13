import { useState, useEffect, useRef } from 'react'
import { mediaDbService } from '../services/mediaDb.js'

function MediaThumb({ item, onDelete, readOnly }) {
  const isVideo = item.type?.startsWith('video')
  return (
    <div className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square">
      {isVideo ? (
        <video src={item.data} className="w-full h-full object-cover" preload="metadata" aria-label={`Vidéo: ${item.name}`} />
      ) : (
        <img src={item.data} alt={item.name || 'Média'} className="w-full h-full object-cover" loading="lazy" />
      )}
      {!readOnly && (
        <button
          onClick={() => onDelete(item.id)}
          className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer focus:outline-none focus:opacity-100 hover:bg-red-600"
          aria-label={`Supprimer ${item.name}`}
          title="Supprimer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {isVideo && (
        <div className="absolute bottom-1 left-1 bg-black/50 rounded px-1.5 py-0.5 text-white text-xs flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          Vidéo
        </div>
      )}
    </div>
  )
}

export default function MediaGallery({ rapportId, readOnly = false }) {
  const [medias, setMedias] = useState([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (rapportId) loadMedias()
  }, [rapportId])

  async function loadMedias() {
    try {
      const items = await mediaDbService.listerPourRapport(rapportId)
      setMedias(items)
    } catch (e) {
      console.error('Erreur chargement médias:', e)
    }
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setLoading(true)
    try {
      for (const file of files) {
        await mediaDbService.ajouter(rapportId, file)
      }
      await loadMedias()
    } catch (e) {
      console.error('Erreur ajout médias:', e)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce média ?')) return
    await mediaDbService.supprimer(id)
    await loadMedias()
  }

  return (
    <div>
      {!readOnly && (
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="btn-secondary text-sm"
            aria-label="Ajouter des photos ou vidéos"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {loading ? 'Ajout...' : 'Ajouter photos / vidéos'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
          {medias.length > 0 && (
            <span className="text-sm text-gray-500">{medias.length} fichier{medias.length > 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {medias.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="list" aria-label="Galerie médias">
          {medias.map(item => (
            <div key={item.id} role="listitem">
              <MediaThumb item={item} onDelete={handleDelete} readOnly={readOnly} />
            </div>
          ))}
        </div>
      ) : (
        !readOnly && (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Aucun média</p>
          </div>
        )
      )}
    </div>
  )
}
