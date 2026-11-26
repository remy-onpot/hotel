import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { credentials } from "./app/_lib/authjs/credentialsCallback";
import { encode, decode } from "next-auth/jwt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { maxAge: 60 * 60 * 2, strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  jwt: { decode, encode },
  providers: [Credentials(credentials)],
  callbacks: {
    async jwt({ token, user, account }) {
      // Attach user to the token when signing in with credentials
      // console.log({ token, user });

      if (user) {
        token.id = user.id;
        token.name = user.fullname ?? user.name;
        token.email = user.email;
        token.avatar = user.avatar;
        token.role = user.role;
        token.authSource = account?.provider;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.role === "admin") {
        session.user.id = token.id;
        session.user.role = "admin";
        return session;
      }
      if (token.authSource !== "credentials") {
        session.user = null;
        return session;
      }
      session.user.id = token.id;
      session.user.name = token.name;
      session.avatar = token.avatar;
      return session;
    },
  },
});
