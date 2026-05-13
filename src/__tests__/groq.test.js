import { describe, it, expect, beforeEach, vi } from 'vitest'
import { groqService } from '../services/groq.js'

describe('groqService', () => {
  beforeEach(() => {
    localStorage.clear()
    global.fetch = vi.fn()
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
  })
})
