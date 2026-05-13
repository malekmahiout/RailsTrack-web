import { Link, useNavigate, useLocation } from 'react-router-dom'
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

const NAV_ITEMS = [
  {
    to: '/rapports',
    label: 'Rapports',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/parametres',
    label: 'Paramètres',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
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

          {/* Nav */}
          <nav className="flex items-center gap-1" aria-label="Navigation principale">
            {NAV_ITEMS.map(item => {
              const active = location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500
                    ${active ? 'bg-primary-50 text-primary-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.icon}
                  <span className="hidden sm:block">{item.label}</span>
                </Link>
              )
            })}
          </nav>

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
