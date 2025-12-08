import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { germanText, englishText, history = [] } = await request.json();

    if (!germanText && !englishText) {
      return new Response(JSON.stringify({ error: "No input" }), {
        status: 400,
      });
    }

    // Format last 2–3 messages
    function formatHistory(list) {
      return list
        .map((msg) =>
          msg.role === "seller" ? `Seller: ${msg.text}` : `Buyer: ${msg.text}`
        )
        .join("\n");
    }

    const historyText = formatHistory(history);

    // -------------------------
    // NEW SYSTEM PROMPT (fixed)
    // -------------------------
    const systemPrompt = `
You are helping a buyer in a live phone call with a private seller.

RULES:
- You ALWAYS act as the BUYER.
- Be SHORT, NATURAL and HUMAN when generating German replies.
- NEVER write long checklists or too many questions.
- Max 1–2 sentences per reply.
- Use Sie-form.
- Keep conversation realistic and friendly.

TASKS:

1) If germanText is present (seller speaking):
   - Translate it to English clearly.
   - Generate a SHORT natural German reply for the buyer (1–2 sentences).

2) If englishText is present (buyer typing English):
   - ONLY translate it to German.
   - DO NOT generate a German reply.
   - DO NOT ask questions.

Return ONLY JSON:
{
  "english_translation": "...",   // seller → English
  "german_reply": "...",          // reply to seller (only when seller speaks)
  "german_translation": "..."     // buyer English → German
}
    `;

    // -------------------------
    // USER PROMPT
    // -------------------------
    const userPrompt = `
Conversation so far:
${historyText}

Seller German message:
"""${germanText || ""}"""

Buyer English message:
"""${englishText || ""}"""
    `;

    // -------------------------
    // OpenAI call
    // -------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid JSON", raw }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error", detail: err.message }),
      { status: 500 }
    );
  }
}
