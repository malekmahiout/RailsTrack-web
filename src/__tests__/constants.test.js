import { describe, it, expect } from 'vitest'
import { AVARIE_TYPES, STATUTS, getStatutLabel, getStatutColor } from '../constants/avariesTypes.js'

describe('constants', () => {
  describe('AVARIE_TYPES', () => {
    it('contient 8 types d\'avarie', () => {
      expect(AVARIE_TYPES).toHaveLength(8)
    })

    it('contient Fuite de gaz', () => {
      expect(AVARIE_TYPES).toContain('Fuite de gaz')
    })

    it('contient Panne de compteur', () => {
      expect(AVARIE_TYPES).toContain('Panne de compteur')
    })

    it('contient Autre', () => {
      expect(AVARIE_TYPES).toContain('Autre')
    })
  })

  describe('STATUTS', () => {
    it('contient 4 statuts', () => {
      expect(STATUTS).toHaveLength(4)
    })

    it('contient WAPPR, INPRG, COMP, CLOSE', () => {
      const values = STATUTS.map(s => s.value)
      expect(values).toContain('WAPPR')
      expect(values).toContain('INPRG')
      expect(values).toContain('COMP')
      expect(values).toContain('CLOSE')
    })
  })

  describe('getStatutLabel', () => {
    it('retourne le label pour WAPPR', () => {
      expect(getStatutLabel('WAPPR')).toBe('En attente')
    })

    it('retourne le label pour INPRG', () => {
      expect(getStatutLabel('INPRG')).toBe('En cours')
    })

    it('retourne le label pour COMP', () => {
      expect(getStatutLabel('COMP')).toBe('Complété')
    })

    it('retourne le label pour CLOSE', () => {
      expect(getStatutLabel('CLOSE')).toBe('Clôturé')
    })

    it('retourne la valeur brute pour un statut inconnu', () => {
      expect(getStatutLabel('UNKNOWN')).toBe('UNKNOWN')
    })
  })

  describe('getStatutColor', () => {
    it('retourne warning pour WAPPR', () => {
      expect(getStatutColor('WAPPR')).toBe('warning')
    })

    it('retourne success pour COMP', () => {
      expect(getStatutColor('COMP')).toBe('success')
    })

    it('retourne default pour un statut inconnu', () => {
      expect(getStatutColor('UNKNOWN')).toBe('default')
    })
  })
})
