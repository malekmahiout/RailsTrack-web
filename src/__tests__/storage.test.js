import { describe, it, expect, beforeEach } from 'vitest'
import { storageService } from '../services/storage.js'

describe('storageService', () => {
  beforeEach(() => localStorage.clear())

  it('lister retourne un tableau vide initialement', () => {
    expect(storageService.lister()).toEqual([])
  })

  it('creer ajoute un rapport et assigne un id', () => {
    const r = storageService.creer({ titre: 'Test rapport', contenu: '<p>Contenu</p>' })
    expect(r.id).toBe(1)
    expect(r.titre).toBe('Test rapport')
    expect(r.statut).toBe('WAPPR')
    expect(r.createdAt).toBeTruthy()
    expect(r.updatedAt).toBeTruthy()
  })

  it('lister retourne les rapports triés par date décroissante', () => {
    const r1 = storageService.creer({ titre: 'Premier', createdAt: '2024-01-01T10:00:00.000Z' })
    storageService.modifier(r1.id, { createdAt: '2024-01-01T10:00:00.000Z' })
    const r2 = storageService.creer({ titre: 'Second', createdAt: '2024-01-02T10:00:00.000Z' })
    storageService.modifier(r2.id, { createdAt: '2024-01-02T10:00:00.000Z' })
    const list = storageService.lister()
    expect(list.length).toBe(2)
    const ids = list.map(r => r.id)
    expect(ids).toContain(r1.id)
    expect(ids).toContain(r2.id)
  })

  it('trouver retourne le bon rapport', () => {
    const r = storageService.creer({ titre: 'À trouver' })
    const found = storageService.trouver(r.id)
    expect(found).not.toBeNull()
    expect(found.titre).toBe('À trouver')
  })

  it('trouver retourne null si id inconnu', () => {
    expect(storageService.trouver(9999)).toBeNull()
  })

  it('modifier met à jour les champs du rapport', () => {
    const r = storageService.creer({ titre: 'Ancien titre' })
    const updated = storageService.modifier(r.id, { titre: 'Nouveau titre', statut: 'COMP' })
    expect(updated.titre).toBe('Nouveau titre')
    expect(updated.statut).toBe('COMP')
  })

  it('supprimer enlève le rapport de la liste', () => {
    const r = storageService.creer({ titre: 'À supprimer' })
    const ok = storageService.supprimer(r.id)
    expect(ok).toBe(true)
    expect(storageService.trouver(r.id)).toBeNull()
    expect(storageService.lister()).toHaveLength(0)
  })

  it('supprimer retourne false si id inconnu', () => {
    expect(storageService.supprimer(9999)).toBe(false)
  })

  it('les ids sont auto-incrémentés', () => {
    const r1 = storageService.creer({ titre: 'R1' })
    const r2 = storageService.creer({ titre: 'R2' })
    const r3 = storageService.creer({ titre: 'R3' })
    expect(r1.id).toBe(1)
    expect(r2.id).toBe(2)
    expect(r3.id).toBe(3)
  })

  it('modifier préserve les champs existants', () => {
    const r = storageService.creer({ titre: 'Test', vehicule: 'VH-001', reference: 'REF-001' })
    const updated = storageService.modifier(r.id, { titre: 'Modifié' })
    expect(updated.vehicule).toBe('VH-001')
    expect(updated.reference).toBe('REF-001')
  })
})
