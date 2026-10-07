import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        login: { label: "Usuario o correo", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const login = credentials?.login?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!login || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            active: true,
            OR: [{ username: login }, { email: login }],
          },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            entity: "User",
            entityId: user.id,
            action: "LOGIN",
            newData: { username: user.username },
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.username = (user as { username: string }).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
};
