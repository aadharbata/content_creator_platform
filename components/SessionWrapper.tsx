"use client";
import { SessionProvider } from "next-auth/react";

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window gains focus
      refetchWhenOffline={false} // Don't refetch when offline
      basePath="/api/auth" // Explicit base path for NextAuth
    >
      {children}
    </SessionProvider>
  );
} 