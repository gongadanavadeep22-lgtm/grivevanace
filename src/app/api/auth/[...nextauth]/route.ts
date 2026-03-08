import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const dynamic = "force-dynamic";
export type Role = "citizen" | "worker" | "supervisor";

// Demo users: single auth for all roles. No separate auth for workers vs supervisors.
const DEMO_USERS: { email: string; password: string; name: string; role: Role }[] = [
  { email: "supervisor@example.com", password: "supervisor123", name: "Supervisor", role: "supervisor" },
  { email: "worker@example.com", password: "worker123", name: "Field Worker", role: "worker" },
  { email: "admin@example.com", password: "admin123", name: "Admin", role: "supervisor" },
];

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password?.trim();
        if (!email || !password) return null;
        const user = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === email && u.password === password
        );
        if (!user) return null;
        return { id: user.email, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: Role }).id = token.id as string;
        (session.user as { role?: Role }).role = token.role as Role;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.AUTH_SECRET || "dev-secret-change-in-production",
});

export { handler as GET, handler as POST };
