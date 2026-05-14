import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { groqService } from '../services/groq.js'

describe('groqService', () => {
  beforeEach(() => {
    localStorage.clear()
    global.fetch = vi.fn()
    vi.stubEnv('VITE_GROQ_API_KEY', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('gestion de la clé API', () => {
    it('getApiKey retourne une chaîne vide par défaut', () => {
      expect(groqService.getApiKey()).toBe('')
    })

    it('setApiKey persiste la clé', () => {
      groqService.setApiKey('gsk_test_key_123')
      expect(groqService.getApiKey()).toBe('gsk_test_key_123')
    })

    it('setApiKey peut effacer la clé', () => {
      groqService.setApiKey('gsk_test_key_123')
      groqService.setApiKey('')
      expect(groqService.getApiKey()).toBe('')
    })
  })

  describe('transcribeAudio', () => {
    it('lance une erreur si pas de clé API', async () => {
      await expect(groqService.transcribeAudio(new Blob())).rejects.toThrow('Clé API Groq manquante')
    })

    it('appelle l\'API Groq avec la bonne URL', async () => {
      groqService.setApiKey('gsk_fake_key')
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Transcription test' }),
      })
      const result = await groqService.transcribeAudio(new Blob(['audio'], { type: 'audio/webm' }))
      expect(result).toBe('Transcription test')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/openai/v1/audio/transcriptions'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('gère les erreurs HTTP', async () => {
      groqService.setApiKey('gsk_fake_key')
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 })
      await expect(groqService.transcribeAudio(new Blob())).rejects.toThrow('Erreur transcription: 401')
    })
  })

  describe('reformulerEnTerpro', () => {
    it('lance une erreur si pas de clé API', async () => {
      await expect(groqService.reformulerEnTerpro('test')).rejects.toThrow('Clé API Groq manquante')
    })

    it('parse le JSON retourné', async () => {
      groqService.setApiKey('gsk_fake_key')
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ titre: 'Titre test', contenu: '<p>Contenu</p>' }) } }],
        }),
      })
      const result = await groqService.reformulerEnTerpro('fuite de gaz détectée')
      expect(result.titre).toBe('Titre test')
      expect(result.contenu).toBe('<p>Contenu</p>')
    })

    it('retourne un fallback si le JSON est invalide', async () => {
      groqService.setApiKey('gsk_fake_key')
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'texte brut non JSON' } }] }),
      })
      const result = await groqService.reformulerEnTerpro('test fallback')
      expect(result).toBeDefined()
    })

    it('inclut le contenu existant dans le message user quand fourni', async () => {
      groqService.setApiKey('gsk_fake_key')
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ titre: 'T', contenu: '<p>existant + nouveau</p>' }) } }],
        }),
      })
      await groqService.reformulerEnTerpro('nouveau texte dicté', '<p>contenu existant</p>')
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body.messages[1].content).toContain('contenu existant')
      expect(body.messages[1].content).toContain('nouveau texte dicté')
    })

    it('n\'inclut pas le contenu existant si vide', async () => {
      groqService.setApiKey('gsk_fake_key')
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ titre: 'T', contenu: '<p>test</p>' }) } }],
        }),
      })
      await groqService.reformulerEnTerpro('texte dicté', '')
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body.messages[1].content).toBe('texte dicté')
    })
  })

  describe('trouverTicketsSimilaires', () => {
    it('retourne un tableau vide sans clé API', async () => {
      const result = await groqService.trouverTicketsSimilaires('desc', [{ id: 1, titre: 'Test' }])
      expect(result).toEqual([])
    })

    it('retourne un tableau vide si liste vide', async () => {
      groqService.setApiKey('gsk_fake_key')
      const result = await groqService.trouverTicketsSimilaires('desc', [])
      expect(result).toEqual([])
    })

    it('retourne les rapports correspondant aux IDs similaires', async () => {
      groqService.setApiKey('gsk_fake_key')
      const rapports = [
        { id: 1, titre: 'Fuite gaz rue Victor Hugo' },
        { id: 2, titre: 'Coupure électrique secteur nord' },
        { id: 3, titre: 'Fuite gaz avenue de la Paix' },
      ]
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ similaires: [1, 3] }) } }],
        }),
      })
      const result = await groqService.trouverTicketsSimilaires('fuite gaz', rapports)
      expect(result).toHaveLength(2)
      expect(result.map(r => r.id)).toEqual(expect.arrayContaining([1, 3]))
    })

    it('gère les IDs retournés en string par le modèle', async () => {
      groqService.setApiKey('gsk_fake_key')
      const rapports = [
        { id: 1, titre: 'Fuite gaz rue Victor Hugo' },
        { id: 2, titre: 'Coupure électrique secteur nord' },
      ]
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ similaires: ['1'] }) } }],
        }),
      })
      const result = await groqService.trouverTicketsSimilaires('fuite gaz', rapports)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })

    it('retourne un tableau vide si la requête échoue', async () => {
      groqService.setApiKey('gsk_fake_key')
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 })
      const result = await groqService.trouverTicketsSimilaires('test', [{ id: 1, titre: 'Test' }])
      expect(result).toEqual([])
    })

    it('retourne un tableau vide si la réponse JSON est invalide', async () => {
      groqService.setApiKey('gsk_fake_key')
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'texte non JSON' } }] }),
      })
      const result = await groqService.trouverTicketsSimilaires('test', [{ id: 1, titre: 'Test' }])
      expect(result).toEqual([])
    })
  })
})
