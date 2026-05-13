export const AVARIE_TYPES = [
  'Panne de moteur',
  'Défaillance de freinage',
  'Incident de signalisation',
  'Problème de pantographe',
  'Défaut de voie ferrée',
  'Panne électrique / caténaire',
  'Problème de porte',
  'Défaillance de climatisation',
  'Incident de couplage',
  'Déraillement',
  'Retard opérationnel',
  'Maintenance préventive',
  'Autre',
]

export const STATUTS = [
  { value: 'WAPPR', label: 'En attente', color: 'warning' },
  { value: 'INPRG', label: 'En cours', color: 'primary' },
  { value: 'COMP', label: 'Complété', color: 'success' },
  { value: 'CLOSE', label: 'Clôturé', color: 'default' },
]

export const getStatutLabel = value => STATUTS.find(s => s.value === value)?.label || value
export const getStatutColor = value => STATUTS.find(s => s.value === value)?.color || 'default'
