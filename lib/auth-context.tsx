'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AuthUser } from './types'
import { authAPI } from './api'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (data: { nom?: string; prenom?: string; email?: string }) => Promise<{ success: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PUBLIC_ROUTES = ['/login', '/mot-de-passe-oublie']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check for stored user on mount
    const initAuth = async () => {
      const storedUser = localStorage.getItem('auth_user')
      const token = localStorage.getItem('auth_token')
      
      if (storedUser && token) {
        // Restore user from localStorage first
        const parsedUser = JSON.parse(storedUser) as AuthUser
        setUser(parsedUser)
        
        // Optionally validate token with backend (don't clear on failure)
        try {
          const currentUser = await authAPI.me()
          if (currentUser) {
            setUser(currentUser)
            localStorage.setItem('auth_user', JSON.stringify(currentUser))
          }
        } catch {
          // Keep using stored user - token may still be valid for other endpoints
          console.log('Could not validate token with /me endpoint, using stored user')
        }
      }
      setIsLoading(false)
    }
    
    initAuth()
  }, [])

  useEffect(() => {
    // Redirect logic - only handle redirects for unauthenticated users trying to access protected routes
    if (!isLoading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
      
      // Check localStorage directly to avoid race conditions
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token')
      
      if (!user && !hasToken && !isPublicRoute) {
        // User not authenticated and no token, redirect to login
        router.push('/login')
      } else if (user && isPublicRoute) {
        // User authenticated but on public route (login page), redirect to dashboard
        router.push('/dashboard')
      }
    }
  }, [user, isLoading, pathname, router])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.login(email, password)
      
      if (response.token && response.user) {
        const authUser: AuthUser = {
          id: response.user.id,
          nom: response.user.nom,
          prenom: response.user.prenom,
          email: response.user.email,
          role: response.user.role,
        }
        
        // Store token and user
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('auth_user', JSON.stringify(authUser))
        
        // Set user state
        setUser(authUser)
        
        // Use setTimeout to ensure state is updated before redirect
        setTimeout(() => {
          router.push('/dashboard')
        }, 50)
        
        return { success: true }
      }
      
      return { success: false, error: 'Reponse invalide du serveur' }
    } catch (error: unknown) {
      console.error('Login error:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Email ou mot de passe incorrect'
      return { 
        success: false, 
        error: errorMessage 
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      router.push('/login')
    }
  }

  const updateProfile = async (data: { nom?: string; prenom?: string; email?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Non authentifie' }
    
    try {
      const updatedUser = await authAPI.updateProfile(data)
      
      const newAuthUser: AuthUser = {
        id: updatedUser.id,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        email: updatedUser.email,
        role: updatedUser.role,
      }
      
      setUser(newAuthUser)
      localStorage.setItem('auth_user', JSON.stringify(newAuthUser))
      return { success: true }
    } catch (error: unknown) {
      console.error('Update profile error:', error)
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail 
        : undefined
      return { 
        success: false, 
        error: errorMessage || 'Erreur lors de la mise a jour du profil' 
      }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Non authentifie' }
    
    try {
      await authAPI.changePassword(currentPassword, newPassword)
      return { success: true }
    } catch (error: unknown) {
      console.error('Change password error:', error)
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail 
        : undefined
      return { 
        success: false, 
        error: errorMessage || 'Mot de passe actuel incorrect' 
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
