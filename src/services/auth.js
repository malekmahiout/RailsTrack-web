const SESSION_KEY = 'railtrack_auth_session'
const USERS = [{ username: 'mrahal', password: 'mrahal', displayName: 'M. Rahal' }]

export const authService = {
  login(username, password) {
    const user = USERS.find(u => u.username === username && u.password === password)
    if (!user) return { success: false, error: 'Identifiants incorrects' }
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, displayName: user.displayName, loginAt: Date.now() }))
    return { success: true, user }
  },

  logout() {
    localStorage.removeItem(SESSION_KEY)
  },

  isLoggedIn() {
    return !!localStorage.getItem(SESSION_KEY)
  },

  getCurrentUser() {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  },
}
