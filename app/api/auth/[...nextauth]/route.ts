import NextAuth from "next-auth";
import type { SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import type { Session, User, Account } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import jwt from "jsonwebtoken";

// Ensure we have a consistent secret - use a longer, more secure secret
const secret = process.env.NEXTAUTH_SECRET || "Ishan-super-secret-jwt-key-32-chars-minimum-length-for-production-use-and-development-environment";

export const authOptions = {
  secret,
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-google-client-secret",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) return null;

        const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
        // Define a type for the returned user
        type AuthUser = { id: string; name: string | null; email: string | null; role: string };
        if (!isMatch) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role } as AuthUser;
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - refresh session every 24 hours
  },
  jwt: {
    secret,
    maxAge: 30 * 24 * 60 * 60, // 30 days - consistent with session
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = (token as { id?: string; sub?: string }).id ?? (token as { sub?: string }).sub ?? '';
        (session.user as { id?: string; role?: string }).role = (token as { role?: string }).role ?? '';
      }
      // Expose the raw JWT token to the client
      (session as { accessToken?: string }).accessToken = (token as { accessToken?: string; access_token?: string; jti?: string }).accessToken || (token as { access_token?: string }).access_token || (token as { jti?: string }).jti || '';
      return session;
    },
    async jwt({ token, user, account }: { token: JWT; user?: User | AdapterUser; account?: Account | null }) {
      if (user) {
        (token as { id?: string }).id = (user as { id?: string }).id ?? '';
        (token as { role?: string }).role = (user as { role?: string }).role ?? '';
      }
      // For credentials provider, always sign a JWT and set as accessToken
      if (account && account.provider === 'credentials') {
        const payload = {
          id: (token as { id?: string }).id,
          role: (token as { role?: string }).role,
          name: (token as { name?: string }).name,
          email: (token as { email?: string }).email,
        };
        (token as { accessToken?: string }).accessToken = jwt.sign(payload, secret, { expiresIn: '30d' });
      }
      if (account && (account as { access_token?: string }).access_token) {
        (token as { accessToken?: string }).accessToken = (account as { access_token?: string }).access_token || '';
      }
      return token;
    },
  },
  pages: {
    signIn: "/login", // Custom login page
  },
  // Add event handlers for better session management
  events: {
    async signIn({ user, account, profile }: { user: User; account: Account | null; profile?: any }) {
      console.log('🔐 User signed in:', { userId: user.id, provider: account?.provider });
    },
    async signOut({ session, token }: { session: any; token: any }) {
      console.log('🔓 User signed out:', { userId: token?.sub });
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // This runs every time a session is checked
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Session checked:', { userId: token?.sub, expires: session.expires });
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 