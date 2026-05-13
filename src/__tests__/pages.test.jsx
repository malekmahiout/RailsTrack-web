import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../services/auth.js', () => ({
  authService: {
    login: vi.fn(() => ({ success: false, error: 'Identifiants incorrects' })),
    logout: vi.fn(),
    isLoggedIn: () => false,
    getCurrentUser: () => null,
  },
}))

vi.mock('../services/groq.js', () => ({
  groqService: {
    getApiKey: vi.fn(() => ''),
    setApiKey: vi.fn(),
  },
}))

describe('Login page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('affiche le formulaire de connexion', async () => {
    const { default: Login } = await import('../pages/Login.jsx')
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Identifiant')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
  })

  it('affiche le titre RailTrack', async () => {
    const { default: Login } = await import('../pages/Login.jsx')
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /railtrack/i, level: 1 })).toBeInTheDocument()
  })

  it('le bouton soumettre est désactivé si champs vides', async () => {
    const { default: Login } = await import('../pages/Login.jsx')
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeDisabled()
  })

  it('active le bouton quand les deux champs sont remplis', async () => {
    const { default: Login } = await import('../pages/Login.jsx')
    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Identifiant'), { target: { value: 'mrahal' } })
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'mrahal' } })
    expect(screen.getByRole('button', { name: /se connecter/i })).not.toBeDisabled()
  })

  it('toggle la visibilité du mot de passe', async () => {
    const { default: Login } = await import('../pages/Login.jsx')
    render(<MemoryRouter><Login /></MemoryRouter>)
    const pwdInput = screen.getByLabelText('Mot de passe')
    expect(pwdInput.type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: /afficher le mot de passe/i }))
    expect(pwdInput.type).toBe('text')
  })
})

describe('Settings page', () => {
  afterEach(() => {
    cleanup()
  })

  it('affiche le titre Paramètres', async () => {
    const { default: Settings } = await import('../pages/Settings.jsx')
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /paramètres/i })).toBeInTheDocument()
  })

  it('affiche le champ clé API Groq', async () => {
    const { default: Settings } = await import('../pages/Settings.jsx')
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.getByLabelText(/clé api groq/i)).toBeInTheDocument()
  })

  it('affiche la section À propos', async () => {
    const { default: Settings } = await import('../pages/Settings.jsx')
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.getByText(/à propos de railtrack/i)).toBeInTheDocument()
  })

  it('affiche la zone de danger', async () => {
    const { default: Settings } = await import('../pages/Settings.jsx')
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.getByText(/zone de danger/i)).toBeInTheDocument()
  })

  it('toggle la visibilité de la clé', async () => {
    const { default: Settings } = await import('../pages/Settings.jsx')
    render(<MemoryRouter><Settings /></MemoryRouter>)
    const keyInput = screen.getByLabelText('Clé API Groq')
    expect(keyInput.type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: /afficher la clé/i }))
    expect(keyInput.type).toBe('text')
  })
})
