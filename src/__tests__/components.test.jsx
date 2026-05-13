import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RichEditor from '../components/RichEditor.jsx'
import AudioRecorder from '../components/AudioRecorder.jsx'
import Navbar from '../components/Navbar.jsx'

// Mock auth for Navbar
vi.mock('../services/auth.js', () => ({
  authService: {
    getCurrentUser: () => ({ username: 'mrahal', displayName: 'M. Rahal' }),
    isLoggedIn: () => true,
    logout: vi.fn(),
  },
}))

describe('RichEditor', () => {
  it('affiche le placeholder quand vide', () => {
    render(<RichEditor placeholder="Mon placeholder" />)
    const editor = screen.getByRole('textbox')
    expect(editor).toHaveAttribute('data-placeholder', 'Mon placeholder')
  })

  it('affiche le contenu en mode readOnly', () => {
    render(<RichEditor value="<p>Contenu test</p>" readOnly />)
    expect(screen.getByRole('article')).toBeInTheDocument()
  })

  it('affiche la barre d\'outils en mode édition', () => {
    render(<RichEditor />)
    expect(screen.getByRole('toolbar')).toBeInTheDocument()
  })

  it('n\'affiche pas la barre d\'outils en mode readOnly', () => {
    render(<RichEditor readOnly />)
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
  })

  it('appelle onChange à la saisie', () => {
    const onChange = vi.fn()
    render(<RichEditor onChange={onChange} />)
    const editor = screen.getByRole('textbox')
    fireEvent.input(editor)
    expect(onChange).toHaveBeenCalled()
  })
})

describe('AudioRecorder', () => {
  it('affiche le bouton microphone en état idle', () => {
    render(<AudioRecorder onTranscribed={vi.fn()} />)
    expect(screen.getByRole('button', { name: /démarrer l'enregistrement/i })).toBeInTheDocument()
  })

  it('le bouton est désactivé quand disabled=true', () => {
    render(<AudioRecorder onTranscribed={vi.fn()} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('le bouton est actif par défaut', () => {
    render(<AudioRecorder onTranscribed={vi.fn()} />)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })
})

describe('Navbar', () => {
  it('affiche le logo RailTrack', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>)
    expect(screen.getByLabelText(/RailTrack/i)).toBeInTheDocument()
  })

  it('affiche le lien Rapports', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>)
    expect(screen.getByText('Rapports')).toBeInTheDocument()
  })

  it('affiche le lien Paramètres', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>)
    expect(screen.getByText('Paramètres')).toBeInTheDocument()
  })

  it('affiche le bouton de déconnexion', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>)
    expect(screen.getByLabelText(/déconnecter/i)).toBeInTheDocument()
  })

  it('affiche le nom de l\'utilisateur', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>)
    expect(screen.getByText('M. Rahal')).toBeInTheDocument()
  })
})
