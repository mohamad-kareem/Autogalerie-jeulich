// File: app/api/remove-bg/route.js
// Old endpoint (the Fotostudio now uses /api/fotostudio/cutout). Staff only,
// because every call costs remove.bg credits.

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const removeBgForm = new FormData();
    removeBgForm.append("size", "auto");
    removeBgForm.append("image_file", imageFile);

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY,
      },
      body: removeBgForm,
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json(
        { error: "remove.bg failed: " + errText },
        { status: 500 },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return Response.json({ base64png: base64 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
