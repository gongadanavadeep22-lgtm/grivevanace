import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: "citizen" | "worker" | "supervisor";
  }
  interface Session {
    user: User & { id?: string; role?: "citizen" | "worker" | "supervisor" };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "citizen" | "worker" | "supervisor";
    id?: string;
  }
}
