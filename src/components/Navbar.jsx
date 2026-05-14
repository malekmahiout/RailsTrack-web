import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.js'

function RailTrackIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1a237e"/>
      <path d="M8 22 L16 10 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="10" y1="19" x2="22" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}


export default function Navbar() {
  const navigate = useNavigate()
  const user = authService.getCurrentUser()

  function handleLogout() {
    authService.logout()
    navigate('/login')
  }

  return (
    <header className="page-header" role="banner">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/rapports" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1" aria-label="RailTrack - Accueil">
            <RailTrackIcon />
            <span className="font-bold text-lg text-primary-900 hidden sm:block">RailTrack</span>
          </Link>


          {/* User + Logout */}
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-sm text-gray-600 hidden md:block font-medium">{user.displayName}</span>
            )}
            <button
              onClick={handleLogout}
              className="btn-icon text-gray-500 hover:bg-red-50 hover:text-red-600"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
