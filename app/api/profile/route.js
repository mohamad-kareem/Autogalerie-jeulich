export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { staffUser } from "@/lib/kaufvertragServer";
import { setCompanyLocation } from "@/lib/travel";

// the same rule as the accounts themselves (models/Admin.js: at least 8 characters)
const PASSWORD_MIN = 8;

/** PATCH /api/profile – own name / picture / password, and the company location */
export async function PATCH(req) {
  const current = await staffUser();
  if (!current?.userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  // The login e-mail is fixed – name, picture and password can be changed here.
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : null;
  const image = typeof body?.image === "string" ? body.image : null;
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword.trim() : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  // company location (start of the pickups) – one for the whole company
  const companyLocation = typeof body?.companyLocation === "string" ? body.companyLocation : null;

  if (name !== null && name.length < 2) {
    return NextResponse.json({ error: "Der Name muss mindestens 2 Zeichen haben." }, { status: 400 });
  }
  if (newPassword && newPassword.length < PASSWORD_MIN) {
    return NextResponse.json({ error: `Das neue Passwort braucht mindestens ${PASSWORD_MIN} Zeichen.` }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await Admin.findById(current.userId).select("+password");
    if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Bitte das aktuelle Passwort eingeben." }, { status: 400 });
      }
      if (!(await user.comparePassword(currentPassword))) {
        return NextResponse.json({ error: "Das aktuelle Passwort ist falsch." }, { status: 400 });
      }
    }

    if (name !== null) user.name = name;
    if (image !== null) user.image = image;
    // hashed by the model when it is saved
    if (newPassword) user.password = newPassword;
    const location = companyLocation !== null ? await setCompanyLocation(companyLocation, user.name) : undefined;

    await user.save();

    return NextResponse.json({
      ok: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || "",
        ...(location !== undefined ? { companyLocation: location } : {}),
      },
    });
  } catch (err) {
    console.error("PROFILE_PATCH_ERROR:", err?.message || err);
    return NextResponse.json({ error: "Profil konnte nicht gespeichert werden." }, { status: 500 });
  }
}
