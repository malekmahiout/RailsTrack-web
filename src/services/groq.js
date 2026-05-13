const API_KEY_STORAGE = 'railtrack_groq_api_key'
const GROQ_BASE = 'https://api.groq.com'

export const groqService = {
  getApiKey: () => localStorage.getItem(API_KEY_STORAGE) || import.meta.env.VITE_GROQ_API_KEY || '',
  setApiKey: key => localStorage.setItem(API_KEY_STORAGE, key),

  async transcribeAudio(audioBlob) {
    const apiKey = groqService.getApiKey()
    if (!apiKey) throw new Error('Clé API Groq manquante. Configurez-la dans les paramètres.')

    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.webm')
    formData.append('model', 'whisper-large-v3')
    formData.append('language', 'fr')
    formData.append('response_format', 'json')

    const res = await fetch(`${GROQ_BASE}/openai/v1/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    })
    if (!res.ok) throw new Error(`Erreur transcription: ${res.status}`)
    const data = await res.json()
    return data.text || ''
  },

  async reformulerEnTerpro(text) {
    const apiKey = groqService.getApiKey()
    if (!apiKey) throw new Error('Clé API Groq manquante.')

    const res = await fetch(`${GROQ_BASE}/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant technique pour GRDF. Reformule uniquement ce qui a été dicté en français professionnel clair et concis. Ne complète pas, n'invente pas, n'ajoute aucune information absente du texte original.
Retourne UNIQUEMENT un JSON valide avec exactement ces champs:
{
  "titre": "Résumé court de ce qui a été dit (max 100 caractères, uniquement basé sur le texte dicté)",
  "contenu": "Reformulation du texte dicté en HTML structuré avec <ul><li> pour les actions. Aucune information inventée.",
  "vehicule": "Numéro de véhicule si explicitement mentionné, sinon chaîne vide",
  "reference": "Référence chantier si explicitement mentionnée, sinon chaîne vide",
  "codeOperation": "Code opération si explicitement mentionné, sinon chaîne vide",
  "typeAvarie": "Type d'avarie si explicitement mentionné, sinon chaîne vide"
}`,
          },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })
    if (!res.ok) throw new Error(`Erreur reformulation: ${res.status}`)
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    try {
      return JSON.parse(content)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      return match ? JSON.parse(match[0]) : { titre: text.slice(0, 100), contenu: `<p>${text}</p>` }
    }
  },

  async trouverTicketsSimilaires(description, rapports) {
    const apiKey = groqService.getApiKey()
    if (!apiKey || !rapports.length) return []

    const sample = rapports.map(r => ({ id: r.id, titre: r.titre }))
    const res = await fetch(`${GROQ_BASE}/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Détecte les doublons potentiels. Retourne un JSON: { "similaires": [id1, id2] } avec les IDs des tickets similaires. Retourne [] si aucun.',
          },
          { role: 'user', content: `Nouveau: "${description}"\n\nExistants:\n${JSON.stringify(sample)}` },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    try {
      const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}')
      const ids = parsed.similaires || []
      return rapports.filter(r => ids.includes(r.id))
    } catch {
      return []
    }
  },

  async editerContenuVocal(html, instructions) {
    const apiKey = groqService.getApiKey()
    if (!apiKey) throw new Error('Clé API Groq manquante.')

    const res = await fetch(`${GROQ_BASE}/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Tu modifies du contenu HTML selon les instructions vocales. Retourne uniquement le HTML modifié, sans explication.' },
          { role: 'user', content: `HTML actuel:\n${html}\n\nInstructions: ${instructions}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })
    if (!res.ok) throw new Error(`Erreur édition vocale: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content || html
  },
}
