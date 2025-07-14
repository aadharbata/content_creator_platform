// NextAuth session utilities
export const logout = (): void => {
  // NextAuth logout is handled by the application's auth provider.
  // This function removes any custom localStorage tokens.
  if (typeof window !== 'undefined') {
    // Clear any residual localStorage items
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
} 