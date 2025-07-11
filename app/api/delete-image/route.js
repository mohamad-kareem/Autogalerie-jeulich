import cloudinary from "@/app/utils/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });

    const { publicId } = await req.json();
    if (!publicId)
      return new Response(JSON.stringify({ error: "Missing publicId" }), {
        status: 400,
      });

    const res = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (err, result) =>
        err ? reject(err) : resolve(result)
      );
    });

    if (res.result !== "ok")
      return new Response(
        JSON.stringify({ error: "Cloudinary deletion failed" }),
        { status: 500 }
      );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
