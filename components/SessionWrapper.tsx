"use client";
import { SessionProvider } from "next-auth/react";

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={15 * 60} // Refetch session every 15 minutes (reduced from 5 minutes)
      refetchOnWindowFocus={false} // Disable refetch on window focus to reduce frequency
      refetchWhenOffline={false} // Don't refetch when offline
      basePath="/api/auth" // Explicit base path for NextAuth
    >
      {children}
    </SessionProvider>
  );
} 