export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message)
    this.name = 'NetworkError'
  }
}

export const handleApiError = (error: unknown, endpoint: string): string => {
  if (error instanceof ApiError) {
    return `API Error (${error.statusCode}): ${error.message}`
  }
  
  if (error instanceof NetworkError) {
    return 'Please check your internet connection and try again'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
} 