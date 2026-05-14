import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { storageService } from '../services/storage.js'
import { getStatutLabel } from '../constants/avariesTypes.js'

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateLong(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function stripHtml(html) {
  return (html || '').replace(/<\/?(ul|ol|li|p|br|div|h\d)[^>]*>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getWeekNumber(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

function getVSDDates() {
  const today = new Date()
  const day = today.getDay()
  const daysBack = (day - 5 + 7) % 7
  const friday = new Date(today)
  friday.setDate(today.getDate() - daysBack)
  const sunday = new Date(friday)
  sunday.setDate(friday.getDate() + 2)
  return { debut: toDateStr(friday), fin: toDateStr(sunday) }
}

function isPlageValide(debut, fin) {
  if (!debut || !fin) return true
  const d = new Date(debut)
  const f = new Date(fin)
  const limite = new Date(d)
  limite.setMonth(d.getMonth() + 3)
  return f <= limite
}

function groupParVehicule(rapports) {
  const groups = []
  const map = {}
  for (const r of rapports) {
    const v = r.vehicule?.trim() || ''
    if (!map[v]) {
      map[v] = []
      groups.push({ vehicule: v, incidents: map[v] })
    }
    map[v].push(r)
  }
  return groups
}

function buildReportBodyHtml(rapports, labelPeriode, semaine) {
  const semaineLabel = semaine ? `Semaine ${semaine} — ` : ''
  const groups = groupParVehicule(rapports)

  const groupsHtml = groups.map(g => {
    const vehiculeHtml = g.vehicule
      ? `<p style="font-weight:bold;color:#dc2626;text-align:center;font-size:1em;margin:0 0 14px 0;">${escHtml(g.vehicule)}</p>`
      : ''

    const incidentsHtml = g.incidents.map(r => {
      const desc = stripHtml(r.contenu)
      const modifie = r.updatedAt && r.updatedAt !== r.createdAt
        ? `<p style="margin:0 0 2px 0;">Modifié le : ${formatDateLong(r.updatedAt)}</p>`
        : ''
      const descHtml = desc
        ? `<p style="margin:6px 0 0 0;white-space:pre-wrap;">${escHtml(desc)}</p>`
        : ''
      return `<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #e5e7eb;">
  <p style="font-weight:bold;margin:0 0 4px 0;">${escHtml(r.titre || 'Sans titre')}${r.numero ? ` <span style="font-weight:normal;color:#9ca3af;font-size:0.85em;">(${escHtml(r.numero)})</span>` : ''}</p>
  <p style="margin:0 0 2px 0;">Statut : ${escHtml(getStatutLabel(r.statut))}</p>
  <p style="margin:0 0 2px 0;">Créé le : ${formatDateLong(r.createdAt)}</p>${modifie}${descHtml}
</div>`
    }).join('\n')

    return `${vehiculeHtml}${incidentsHtml}`
  }).join('<br style="display:block;margin:8px 0;">')

  return `<div style="text-align:center;margin-bottom:4px;">
  <p style="font-weight:bold;font-size:1.15em;margin:0 0 4px 0;">Rapport d'intervention M7-SNCB</p>
  <p style="font-weight:bold;margin:0;">${escHtml(semaineLabel + labelPeriode)}</p>
</div>
<br><br>
${groupsHtml}`
}

function buildRapportHtml(rapports, labelPeriode, semaine) {
  const body = buildReportBodyHtml(rapports, labelPeriode, semaine)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Rapport d'intervention M7-SNCB</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; font-size: 14px; color: #111; line-height: 1.5; }
  </style>
</head>
<body>${body}</body>
</html>`
}

export default function RapportShare() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('quotidien')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [sharing, setSharing] = useState(false)

  const today = toDateStr(new Date())
  const vsd = getVSDDates()
  const plageErreur = !isPlageValide(dateDebut, dateFin)

  const rapportsFiltres = useMemo(() => {
    if (mode === 'quotidien') return storageService.listerActifsLeJour(today)
    if (mode === 'vsd') return storageService.listerParPlageDates(vsd.debut, vsd.fin)
    if (mode === 'plage') {
      if (!dateDebut && !dateFin) return []
      if (plageErreur) return []
      return storageService.listerParPlageDates(dateDebut || null, dateFin || null)
    }
    return []
  }, [mode, dateDebut, dateFin, today, vsd.debut, vsd.fin, plageErreur])

  const incidentsIncomplets = useMemo(() =>
    rapportsFiltres.filter(r => !stripHtml(r.contenu)),
    [rapportsFiltres]
  )

  const semaine = useMemo(() => {
    if (mode === 'quotidien') return getWeekNumber(today)
    if (mode === 'vsd') return getWeekNumber(vsd.debut)
    if (mode === 'plage' && dateDebut) return getWeekNumber(dateDebut)
    return null
  }, [mode, today, vsd.debut, dateDebut])

  function labelPeriode() {
    if (mode === 'quotidien') return `Journée du ${formatDateLong(today)}`
    if (mode === 'vsd') return `Week-end du ${formatDateLong(vsd.debut)} au ${formatDateLong(vsd.fin)}`
    const parts = []
    if (dateDebut) parts.push(`du ${formatDateLong(dateDebut)}`)
    if (dateFin) parts.push(`au ${formatDateLong(dateFin)}`)
    return parts.length ? parts.join(' ') : 'Toute la période'
  }

  async function handleShare() {
    if (!rapportsFiltres.length) return
    if (incidentsIncomplets.length) {
      const noms = incidentsIncomplets.map(r => r.titre).join('\n• ')
      const continuer = confirm(
        `⚠️ ${incidentsIncomplets.length} incident${incidentsIncomplets.length > 1 ? 's' : ''} sans description :\n• ${noms}\n\nVous avez peut-être oublié de traiter ${incidentsIncomplets.length > 1 ? 'ces incidents' : 'cet incident'}.\n\nPartager quand même ?`
      )
      if (!continuer) return
    }
    setSharing(true)
    try {
      const label = labelPeriode()
      const html = buildRapportHtml(rapportsFiltres, label, semaine)
      const subject = `Rapport d'intervention M7-SNCB — ${label}`
      const blob = new Blob([html], { type: 'text/html' })
      const file = new File([blob], 'rapport-intervention.html', { type: 'text/html' })

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: subject })
          return
        } catch (e) {
          if (e.name === 'AbortError') return
        }
      }

      // Fallback : ouvre le rapport dans un nouvel onglet (impression possible)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } finally {
      setSharing(false)
    }
  }

  const MODES = [
    { value: 'quotidien', label: 'Quotidien', sub: `Aujourd'hui — ${formatDate(today)}` },
    { value: 'vsd', label: 'VSD', sub: `${formatDate(vsd.debut)} → ${formatDate(vsd.fin)}` },
    { value: 'plage', label: 'Plage de dates', sub: 'Max 3 mois' },
  ]

  const previewHtml = useMemo(() =>
    rapportsFiltres.length ? buildReportBodyHtml(rapportsFiltres, labelPeriode(), semaine) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rapportsFiltres, semaine]
  )

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
            <h1 className="text-xl font-bold text-gray-900">Rapport d'intervention</h1>
            <p className="text-sm text-gray-500">Générez et partagez le rapport M7-SNCB</p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="card p-5 mb-5">
          <h2 className="section-title mb-4">Type de rapport</h2>
          <div className="grid grid-cols-3 gap-2 mb-5" role="radiogroup" aria-label="Type de rapport">
            {MODES.map(m => (
              <label key={m.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="mode-rapport"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                  className="sr-only"
                />
                <span className={`flex flex-col items-center text-center px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer
                  ${mode === m.value ? 'border-primary-700 bg-primary-50 text-primary-900' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                  <span className="font-semibold">{m.label}</span>
                  <span className="text-xs mt-0.5 opacity-70 font-normal">{m.sub}</span>
                </span>
              </label>
            ))}
          </div>

          {mode === 'quotidien' && (
            <p className="text-sm text-gray-500">
              Tous les incidents <strong>créés ou modifiés</strong> aujourd'hui ({formatDateLong(today)}).
            </p>
          )}

          {mode === 'vsd' && (
            <p className="text-sm text-gray-500">
              Tous les incidents du week-end : du <strong>vendredi {formatDateLong(vsd.debut)}</strong> au <strong>dimanche {formatDateLong(vsd.fin)}</strong>.
            </p>
          )}

          {mode === 'plage' && (
            <div>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label htmlFor="date-debut" className="label">Date de début</label>
                  <input
                    id="date-debut"
                    type="date"
                    value={dateDebut}
                    max={today}
                    onChange={e => setDateDebut(e.target.value)}
                    className="input w-44"
                  />
                </div>
                <span className="text-gray-400 pb-2" aria-hidden="true">–</span>
                <div>
                  <label htmlFor="date-fin" className="label">Date de fin</label>
                  <input
                    id="date-fin"
                    type="date"
                    value={dateFin}
                    min={dateDebut}
                    max={today}
                    onChange={e => setDateFin(e.target.value)}
                    className="input w-44"
                  />
                </div>
              </div>
              {plageErreur && (
                <p role="alert" className="text-xs text-red-600 mt-2">
                  La plage ne peut pas dépasser 3 mois.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Aperçu */}
        <div className="card p-5 mb-5">
          <h2 className="section-title mb-3">
            Aperçu
            {rapportsFiltres.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({rapportsFiltres.length} incident{rapportsFiltres.length > 1 ? 's' : ''})
              </span>
            )}
          </h2>

          {incidentsIncomplets.length > 0 && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">
                  {incidentsIncomplets.length} incident{incidentsIncomplets.length > 1 ? 's' : ''} sans description — vous avez peut-être oublié de {incidentsIncomplets.length > 1 ? 'les traiter' : 'le traiter'} :
                </p>
                <ul className="space-y-0.5">
                  {incidentsIncomplets.map(r => (
                    <li key={r.id} className="truncate">• {r.titre || `#${r.id}`}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {rapportsFiltres.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              {mode === 'plage' && !dateDebut && !dateFin
                ? 'Sélectionnez une période pour voir les incidents'
                : plageErreur
                  ? 'Plage de dates invalide'
                  : 'Aucun incident trouvé pour cette période'}
            </p>
          ) : (
            <div
              className="border border-gray-100 rounded-xl p-5 bg-white text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>

        {/* Action */}
        <div className="flex justify-end pb-6">
          <button
            onClick={handleShare}
            disabled={!rapportsFiltres.length || sharing}
            className="btn-primary px-8"
            aria-label="Partager le rapport"
          >
            {sharing ? (
              <>
                <div className="spinner w-4 h-4 border-white" aria-hidden="true" />
                Partage...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Partager le rapport
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
