import sharp from "sharp";
import { COMPANY_STAMP_MAX_BYTES } from "@/lib/companyStamp";
import { getCompanyStampId, removeCompanyStamp, saveCompanyStamp } from "@/lib/companyStampServer";
import { errorResponse, SaleError, staffUser } from "@/lib/kaufvertragServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireStaff() {
  const user = await staffUser();
  if (!user) throw new SaleError("Nicht angemeldet.", 401);
  return user;
}

export async function GET() {
  try {
    await requireStaff();
    return Response.json({ id: await getCompanyStampId() });
  } catch (err) {
    return errorResponse(err, "Firmenstempel konnte nicht geladen werden.");
  }
}

export async function PUT(req) {
  try {
    const user = await requireStaff();
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || typeof file === "string" || !file.size) throw new SaleError("Bitte eine Bilddatei auswählen.");
    if (file.size > COMPANY_STAMP_MAX_BYTES) throw new SaleError("Die Bilddatei darf höchstens 3 MB groß sein.", 413);

    let image;
    try {
      const input = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16_000_000, failOn: "warning" });
      const { format } = await input.metadata();
      if (["png", "jpeg", "webp"].includes(format)) {
        image = await input.rotate().resize(1200, 600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
      }
    } catch {
      throw new SaleError("Die Bilddatei konnte nicht gelesen werden.");
    }
    if (!image) throw new SaleError("Bitte ein Bild im Format PNG, JPG oder WebP auswählen.");

    return Response.json({ id: await saveCompanyStamp(image, user.name) });
  } catch (err) {
    return errorResponse(err, "Firmenstempel konnte nicht gespeichert werden.");
  }
}

export async function DELETE() {
  try {
    const user = await requireStaff();
    await removeCompanyStamp(user.name);
    return Response.json({ id: "" });
  } catch (err) {
    return errorResponse(err, "Firmenstempel konnte nicht entfernt werden.");
  }
}
