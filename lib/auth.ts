interface User {
  id: string
  email: string
  name: string
  role: 'CREATOR' | 'CONSUMER' | 'ADMIN'
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null // Server-side
  }
  
  return localStorage.getItem('token')
}

export const getAuthUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null // Server-side
  }
  
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    return null
  }
  
  try {
    return JSON.parse(userStr) as User
  } catch {
    return null
  }
}

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null && getAuthUser() !== null
}

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
} 