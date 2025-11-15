import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'dex',
      name: 'Dex',
      type: 'oauth',
      wellKnown: `${process.env.DEX_ISSUER}/.well-known/openid-configuration`,
      authorization: { params: { scope: 'openid email profile groups' } },
      clientId: process.env.DEX_CLIENT_ID!,
      clientSecret: process.env.DEX_CLIENT_SECRET!,
      idToken: true,
      checks: ['pkce', 'state'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.email,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = profile.sub;
        token.email = profile.email;
        token.name = profile.name || profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).sub = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
