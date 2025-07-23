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
import { formatPhoneNumber } from "@/lib/content-delivery";

// Ensure we have a consistent secret - use a longer, more secure secret
const secret = process.env.NEXTAUTH_SECRET || "Ishan-super-secret-jwt-key-32-chars-minimum-length-for-production-use-and-development-environment";

export const authOptions = {
  secret,
  debug: true, // Enable debug mode
  logger: {
    error(code: any, metadata: any) {
      console.error('❌ NextAuth Error:', code, metadata);
    },
    warn(code: any) {
      console.warn('⚠️ NextAuth Warning:', code);
    },
    debug(code: any, metadata: any) {
      console.log('🔍 NextAuth Debug:', code, metadata);
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email/Phone",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          console.log("Missing credentials");
          return null;
        }

        const identifier = credentials.identifier.trim();
        console.log("Login attempt with identifier:", identifier);
        
        let user = null;

        // Check if identifier is email or phone
        if (identifier.includes('@')) {
          // Email login
          console.log("Attempting email login");
          user = await prisma.user.findUnique({ where: { email: identifier } });
          console.log("User found by email:", user ? user.id : "None");
        } else {
          // Phone login - format the phone number
          const formattedPhone = formatPhoneNumber(identifier);
          console.log("Attempting phone login with formatted phone:", formattedPhone);
          
          user = await prisma.user.findUnique({ 
            where: { phone: formattedPhone } 
          });
          console.log("User found by phone:", user ? user.id : "None");
          
          // Check if phone is verified
          if (user && !user.phoneVerified) {
            console.log("Phone not verified for user:", user.id);
            return null;
          }
        }

        if (!user) {
          console.log("No user found for identifier:", identifier);
          return null;
        }

        if (!user.passwordHash) {
          console.log("No password hash for user:", user.id);
          return null;
        }

        console.log("Comparing passwords for user:", user.id);
        const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
        console.log("Password match result:", isMatch);

        if (!isMatch) {
          console.log("Password mismatch for user:", user.id);
          return null;
        }

        console.log("Login successful for user:", user.id);

        // Define a type for the returned user
        type AuthUser = { id: string; name: string | null; email: string | null; phone: string | null; role: string };

        return { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          phone: user.phone,
          role: user.role 
        } as AuthUser;
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
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      console.log('🔐 Redirect callback:', { url, baseUrl });
      
      // For OAuth callbacks, let the frontend handle the redirect
      if (url.includes('callback') || url === baseUrl || url === `${baseUrl}/`) {
        console.log('🔐 OAuth completed - defaulting to login page for frontend redirect');
        return `${baseUrl}/login`;
      }
      
      // For other redirects, use default behavior  
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
    async signIn({ user, account, profile }: { user: User; account: Account | null; profile?: any }) {
      console.log('🔐 SignIn callback triggered:', { provider: account?.provider, email: user.email });
      
      // Always allow credentials provider
      if (account?.provider === 'credentials') {
        console.log('✅ Credentials login - allowing signin');
        return true;
      }
      
      // Handle Google OAuth - simplified version
      if (account?.provider === 'google' && user.email) {
        console.log('🔐 Processing Google OAuth for:', user.email);
        
        try {
          // Try to find or create user - EXACTLY like manual signup
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (!dbUser) {
            // Extract role from signup cookie
            let userRole: 'CREATOR' | 'CONSUMER' = 'CONSUMER'; // Default to CONSUMER
            
            // Check for signup role in cookies (from signup flow)  
            try {
              const { cookies } = await import('next/headers');
              const cookieStore = await cookies();
              const signupRoleCookie = cookieStore.get('signup-role');
              
              if (signupRoleCookie && ['CREATOR', 'CONSUMER'].includes(signupRoleCookie.value)) {
                userRole = signupRoleCookie.value as 'CREATOR' | 'CONSUMER';
                console.log('🎯 Google signup with role from cookie:', userRole);
                
                // Clear the cookie after use
                cookieStore.delete('signup-role');
              } else {
                console.log('🎯 No signup role cookie found, defaulting to CONSUMER');
              }
            } catch (error) {
              console.log('🎯 Error reading signup role cookie, defaulting to CONSUMER');
            }
            
            console.log(`🔐 Creating new Google user as ${userRole} (from signup flow)...`);
            
            // Create user with the selected role from signup
            dbUser = await prisma.user.create({
              data: {
                name: user.name || 'Google User',
                email: user.email,
                passwordHash: '', // Empty string for Google users (no password needed)
                role: userRole, // Use role from signup flow
                phoneVerified: false, // Default value
              }
            });
            
            console.log('✅ New Google user created with selected role:', { 
              id: dbUser.id, 
              name: dbUser.name,
              email: dbUser.email, 
              role: dbUser.role,
              createdAt: dbUser.createdAt 
            });
            
            // If user is CREATOR, create CreatorProfile
            if (dbUser.role === 'CREATOR') {
              const creatorProfile = await prisma.creatorProfile.create({
                data: {
                  userId: dbUser.id,
                  isPaid: false,
                },
              });
              console.log('✅ CreatorProfile created for Google user:', creatorProfile.id);
            }
          } else {
            console.log('✅ Existing Google user found:', { 
              id: dbUser.id, 
              name: dbUser.name,
              email: dbUser.email, 
              role: dbUser.role,
              createdAt: dbUser.createdAt 
            });
          }

          // Update user object with all the same fields as manual signup
          user.id = dbUser.id;
          (user as any).role = dbUser.role;
          (user as any).phone = dbUser.phone;
          (user as any).name = dbUser.name;
          (user as any).createdAt = dbUser.createdAt;
          
          return true;
        } catch (dbError) {
          console.error('❌ Database error in Google OAuth:', dbError);
          console.error('❌ Full error details:', dbError);
          // Don't fail the login, but log the issue clearly
          return true;
        }
      }
      
      console.log('✅ SignIn callback - allowing signin for provider:', account?.provider);
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as { id?: string; role?: string; phone?: string; createdAt?: string }).id = (token as { id?: string; sub?: string }).id ?? (token as { sub?: string }).sub ?? '';
        (session.user as { id?: string; role?: string; phone?: string; createdAt?: string }).role = (token as { role?: string }).role ?? '';
        (session.user as { id?: string; role?: string; phone?: string; createdAt?: string }).phone = (token as { phone?: string }).phone ?? '';
        (session.user as { id?: string; role?: string; phone?: string; createdAt?: string }).createdAt = (token as { createdAt?: string }).createdAt ?? '';
        
        console.log('🔐 Session callback - Final session data:', { 
          id: (session.user as any).id, 
          role: (session.user as any).role, 
          createdAt: (session.user as any).createdAt,
          name: session.user.name,
          email: session.user.email
        });
      }
      // Expose the raw JWT token to the client
      (session as { accessToken?: string }).accessToken = (token as { accessToken?: string; access_token?: string; jti?: string }).accessToken || (token as { access_token?: string }).access_token || (token as { jti?: string }).jti || '';
      return session;
    },
    async jwt({ token, user, account }: { token: JWT; user?: User | AdapterUser; account?: Account | null }) {
      if (user) {
        (token as { id?: string }).id = (user as { id?: string }).id ?? '';
        (token as { role?: string }).role = (user as { role?: string }).role ?? '';
        (token as { phone?: string }).phone = (user as { phone?: string }).phone ?? '';
        (token as { createdAt?: string }).createdAt = (user as { createdAt?: Date }).createdAt?.toISOString() ?? '';
        
        console.log('🔐 JWT callback - User data:', { 
          id: (user as any).id, 
          role: (user as any).role, 
          createdAt: (user as any).createdAt,
          provider: account?.provider 
        });
      }
      
      console.log('🔐 JWT callback - Token data:', { 
        id: (token as any).id, 
        role: (token as any).role, 
        createdAt: (token as any).createdAt 
      });
      // For credentials provider, always sign a JWT and set as accessToken
      if (account && account.provider === 'credentials') {
        const payload = {
          id: (token as { id?: string }).id,
          role: (token as { role?: string }).role,
          name: (token as { name?: string }).name,
          email: (token as { email?: string }).email,
          phone: (token as { phone?: string }).phone,
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