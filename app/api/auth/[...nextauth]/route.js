import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        await connectDB();

        const email = credentials?.email?.toLowerCase()?.trim();
        const password = credentials?.password;

        console.log("🔐 Login attempt:", email);

        if (!email || !password) {
          throw new Error("Invalid credentials");
        }

        const admin = await Admin.findOne({
          email,
          active: true,
        }).select("+password");

        if (!admin) {
          console.log("❌ No active user found for email:", email);
          throw new Error("Invalid credentials");
        }

        const isValid = await admin.comparePassword(password);

        if (!isValid) {
          console.log("❌ Password mismatch");
          throw new Error("Invalid credentials");
        }

        console.log("✅ Password match - login successful");

        admin.lastLogin = new Date();
        await admin.save();

        return {
          id: admin._id.toString(),
          email: admin.email,
          name: admin.name,
          role: admin.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      // First login
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.isAdmin = user.role === "admin";
        token.invalidUser = false;
      }

      // Re-check user in DB on every JWT callback
      if (token?.id) {
        await connectDB();

        const dbUser = await Admin.findById(token.id)
          .select("_id name email role active")
          .lean();

        // If user was deleted or deactivated
        if (!dbUser || dbUser.active === false) {
          token.invalidUser = true;
          return token;
        }

        // Refresh token values from DB
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.role = dbUser.role;
        token.isAdmin = dbUser.role === "admin";
        token.invalidUser = false;
      }

      return token;
    },

    async session({ session, token }) {
      if (token.invalidUser) {
        return {
          ...session,
          invalidUser: true,
          user: null,
        };
      }

      session.invalidUser = false;
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
        isAdmin: token.isAdmin,
      };

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
