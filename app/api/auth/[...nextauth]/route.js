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

        const email = credentials?.email?.toLowerCase();
        const password = credentials?.password;

        console.log("🔐 Login attempt:", email);

        const admin = await Admin.findOne({ email }).select("+password");

        if (!admin) {
          console.log("❌ No admin found for email:", email);
          throw new Error("Invalid credentials");
        }

        console.log("🧪 Hashed password from DB:", admin.password);
        console.log("🧪 Input password:", password);

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
    maxAge: 24 * 60 * 60, // 4 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role; // ✅ make sure this is here
        token.isAdmin = user.role === "admin";
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
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
