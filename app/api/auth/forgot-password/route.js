import { connectDB } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { addDays } from "date-fns";

export async function POST(req) {
  const { email } = await req.json();
  if (!email)
    return Response.json({ error: "Email required" }, { status: 400 });

  const { db } = await connectDB();
  const user = await db.collection("admins").findOne({ email });

  if (!user) return Response.json({ ok: true });

  const token = uuidv4();
  await db.collection("passwordResetTokens").insertOne({
    userId: user._id,
    token,
    expires: addDays(new Date(), 1),
    used: false,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.COMPANY_EMAIL,
    to: user.email,
    subject: "Password Reset",
    html: `<p><a href="${resetLink}">Click here to reset your password.</a></p>`,
  });

  return Response.json({ ok: true });
}
