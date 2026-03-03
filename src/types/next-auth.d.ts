import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "member" | "admin";
      isFrozen: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: "member" | "admin";
    isFrozen?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "member" | "admin";
    isFrozen?: boolean;
    provider?: string;
  }
}
