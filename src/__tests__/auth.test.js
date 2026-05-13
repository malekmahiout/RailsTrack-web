import { describe, it, expect, beforeEach } from 'vitest'
import { authService } from '../services/auth.js'

describe('authService', () => {
  beforeEach(() => localStorage.clear())

  it('rejette des identifiants incorrects', () => {
    const r = authService.login('wrong', 'wrong')
    expect(r.success).toBe(false)
    expect(r.error).toBeTruthy()
  })

  it('accepte les identifiants corrects mrahal/mrahal', () => {
    const r = authService.login('mrahal', 'mrahal')
    expect(r.success).toBe(true)
    expect(r.user.username).toBe('mrahal')
  })

  it('isLoggedIn retourne false avant connexion', () => {
    expect(authService.isLoggedIn()).toBe(false)
  })

  it('isLoggedIn retourne true après connexion', () => {
    authService.login('mrahal', 'mrahal')
    expect(authService.isLoggedIn()).toBe(true)
  })

  it('logout supprime la session', () => {
    authService.login('mrahal', 'mrahal')
    authService.logout()
    expect(authService.isLoggedIn()).toBe(false)
    expect(authService.getCurrentUser()).toBeNull()
  })

  it('getCurrentUser retourne l\'utilisateur connecté', () => {
    authService.login('mrahal', 'mrahal')
    const user = authService.getCurrentUser()
    expect(user).not.toBeNull()
    expect(user.username).toBe('mrahal')
    expect(user.displayName).toBe('M. Rahal')
  })
})
