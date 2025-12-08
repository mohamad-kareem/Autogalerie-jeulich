// app/api/translate/route.js

export const runtime = "nodejs"; // ensure Node.js runtime

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

export async function POST(request) {
  try {
    const { text, target } = await request.json();

    if (!process.env.DEEPL_API_KEY) {
      console.error("❌ DEEPL_API_KEY is missing");
      return new Response(
        JSON.stringify({ error: "DEEPL_API_KEY is not set on the server." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!text || !target) {
      return new Response(
        JSON.stringify({ error: "text and target are required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Map our target names to DeepL language codes
    let targetLang;
    if (target.toLowerCase().startsWith("engl")) {
      targetLang = "EN"; // English
    } else if (target.toLowerCase().startsWith("germ")) {
      targetLang = "DE"; // German
    } else {
      targetLang = "EN"; // default to English
    }

    // Call DeepL API
    const params = new URLSearchParams();
    params.append("auth_key", process.env.DEEPL_API_KEY);
    params.append("text", text);
    params.append("target_lang", targetLang);

    const deeplRes = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const deeplData = await deeplRes.json();

    if (!deeplRes.ok) {
      console.error("🔥 DeepL API error:", deeplData);
      return new Response(
        JSON.stringify({
          error: "DeepL API error",
          detail: deeplData,
        }),
        {
          status: deeplRes.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const translated = deeplData.translations?.[0]?.text?.trim() || "";

    return new Response(JSON.stringify({ translated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🔥 Translation route error:", err);
    return new Response(
      JSON.stringify({
        error: "Translation failed on the server.",
        detail: err.message || String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
