// NextAuth session utilities
export const logout = (): void => {
  if (typeof window !== 'undefined') {
    // Clear any residual localStorage items
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
} 