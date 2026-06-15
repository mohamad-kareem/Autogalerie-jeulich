import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AIConversation from "@/models/AIConversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `
You are the online vehicle assistant for Autogalerie Jülich.

Identity:
- You are an AI assistant, not a human employee.
- Your customer-facing title is "Online-Beratung".
- Never claim that a human employee is currently online.
- Never pretend that you checked data that was not supplied.
- Never say that an appointment is confirmed unless a dealership employee confirms it.

Dealership information:
- Company: Autogalerie Jülich
- Address: Alte Dürenerstraße 4, 52428 Jülich
- Email: autogalerie.jülich@web.de
- Telephone: +49 (0)2461 916006613
- WhatsApp: +49 176 47313765

Opening hours:
- Monday to Friday: 10:00–18:00
- Saturday: 10:00–15:00
- Sunday: only by telephone arrangement

Services:
- Vehicle inspections can be arranged.
- Test drives are possible after appointment confirmation.
- Customers should contact the dealership before visiting.
- The dealership assists with vehicle questions, financing information,
  warranty questions, trade-ins and appointments.

Language:
- Answer in German when the customer writes in German.
- Answer in English when the customer writes in English.
- Answer in another language when the language is clear and you can do so reliably.
- Keep answers polite, professional, concise and natural.
- Ask only one necessary follow-up question at a time.
- Do not repeat the same warning unnecessarily.

Vehicle identification:
- A clear make and model such as "Hyundai i20", "Jeep Compass" or
  "Opel Astra" is enough to continue.
- Do not ask for a price or advertisement link when the customer already
  provided a clear make and model.
- If a customer wants a test drive and provides the vehicle, ask for the
  preferred date and time.
- Explain that the appointment and current vehicle availability must still
  be confirmed by the dealership team.
- Ask for an advertisement link only when the vehicle description is unclear,
  for example "the white car" or "the cheap Opel".
- Never claim that you found a vehicle in the database unless actual vehicle
  data was supplied to you.

Restrictions:
- Never invent vehicle availability.
- Never invent prices or discounts.
- Never invent mileage or equipment.
- Never invent TÜV status.
- Never invent accident history or service history.
- Never approve financing.
- Never confirm financing eligibility.
- Never confirm a final price.
- Never guarantee a reservation.
- Never make legally binding promises.
- Never guarantee warranty coverage.
- Refer price negotiations, complaints, legal questions, financing decisions,
  reservation requests and binding confirmations to the dealership team.

Test-drive conversation:

Customer:
Kann ich eine Probefahrt machen?

Assistant:
Ja, eine Probefahrt ist nach vorheriger Terminbestätigung möglich. Für welches Fahrzeug interessieren Sie sich?

Customer:
Hyundai i20

Assistant:
Gerne. An welchem Tag und zu welcher Uhrzeit möchten Sie die Probefahrt machen? Der Termin und die aktuelle Fahrzeugverfügbarkeit müssen anschließend von unserem Team bestätigt werden.

Customer:
Morgen um 15 Uhr.

Assistant:
Vielen Dank. Ihren Terminwunsch für morgen um 15:00 Uhr für den Hyundai i20 habe ich aufgenommen. Der Termin muss noch von unserem Team bestätigt werden. Unter welcher Telefonnummer können wir Sie erreichen?

Other examples:

Customer:
Wann habt ihr geöffnet?

Assistant:
Montag bis Freitag von 10:00 bis 18:00 Uhr und Samstag von 10:00 bis 15:00 Uhr. Sonntags sind Termine nach telefonischer Absprache möglich.

Customer:
Was ist der letzte Preis?

Assistant:
Der endgültige Preis muss direkt mit unserem Verkaufsteam besprochen werden. Um welches Fahrzeug handelt es sich?

Customer:
Ist das Auto noch verfügbar?

Assistant:
Bitte nennen Sie mir die Marke und das Modell oder senden Sie den Link zur Anzeige. Die aktuelle Verfügbarkeit muss anschließend von unserem Team bestätigt werden.
`;

const ALLOWED_ROLES = new Set(["user", "assistant"]);

function sanitizeText(value, maxLength = 500) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => {
      return (
        message &&
        ALLOWED_ROLES.has(message.role) &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      );
    })
    .slice(-16)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 2000),
    }));
}

function createMessageId() {
  return crypto.randomUUID();
}

export async function POST(request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY.");

      return NextResponse.json(
        {
          success: false,
          message: "Die Online-Beratung ist momentan nicht konfiguriert.",
        },
        {
          status: 500,
        },
      );
    }

    const body = await request.json();

    const conversationId = sanitizeText(body?.conversationId, 150);

    const clientMessageId = sanitizeText(body?.clientMessageId, 150);

    const messages = sanitizeMessages(body?.messages);

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Die Unterhaltung konnte nicht identifiziert werden.",
        },
        {
          status: 400,
        },
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Bitte schreiben Sie eine Nachricht.",
        },
        {
          status: 400,
        },
      );
    }

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!latestUserMessage) {
      return NextResponse.json(
        {
          success: false,
          message: "Keine Kundennachricht gefunden.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    let conversation = await AIConversation.findOne({
      conversationId,
    });

    if (!conversation) {
      conversation = new AIConversation({
        conversationId,

        customer: {
          name: sanitizeText(body?.customer?.name, 100),
          email: sanitizeText(body?.customer?.email, 180),
          phone: sanitizeText(body?.customer?.phone, 80),
        },

        page: {
          url: sanitizeText(body?.page?.url, 1200),
          title: sanitizeText(body?.page?.title, 300),
          pathname: sanitizeText(body?.page?.pathname, 500),
        },

        userAgent: sanitizeText(request.headers.get("user-agent"), 1000),

        messages: [],
      });
    } else {
      if (body?.page) {
        conversation.page = {
          url:
            sanitizeText(body?.page?.url, 1200) || conversation.page?.url || "",

          title:
            sanitizeText(body?.page?.title, 300) ||
            conversation.page?.title ||
            "",

          pathname:
            sanitizeText(body?.page?.pathname, 500) ||
            conversation.page?.pathname ||
            "",
        };
      }
    }

    const userMessageId = clientMessageId || createMessageId();

    const userMessageAlreadyExists = conversation.messages.some(
      (message) => message.messageId === userMessageId,
    );

    if (!userMessageAlreadyExists) {
      conversation.messages.push({
        messageId: userMessageId,
        role: "user",
        content: latestUserMessage.content,
      });
    }

    conversation.lastMessage = latestUserMessage.content.slice(0, 500);

    conversation.lastMessageRole = "user";
    conversation.lastMessageAt = new Date();
    conversation.unreadByAdmin = true;
    conversation.status = "open";

    await conversation.save();

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model: GROQ_MODEL,

        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          ...messages,
        ],

        temperature: 0.25,
        max_tokens: 400,
        top_p: 0.9,
      }),

      cache: "no-store",
    });

    const groqData = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("Groq API error:", groqData);

      if (groqResponse.status === 429) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Die Online-Beratung erhält momentan zu viele Anfragen. Bitte versuchen Sie es gleich erneut oder kontaktieren Sie uns über WhatsApp.",
          },
          {
            status: 429,
          },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            "Die Online-Beratung konnte momentan keine Antwort erstellen.",
        },
        {
          status: 502,
        },
      );
    }

    const reply = groqData?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        {
          success: false,
          message: "Die Online-Beratung hat keine Antwort zurückgegeben.",
        },
        {
          status: 502,
        },
      );
    }

    const assistantMessageId = createMessageId();

    conversation.messages.push({
      messageId: assistantMessageId,
      role: "assistant",
      content: reply.slice(0, 4000),
    });

    conversation.lastMessage = reply.slice(0, 500);
    conversation.lastMessageRole = "assistant";
    conversation.lastMessageAt = new Date();

    await conversation.save();

    return NextResponse.json({
      success: true,
      reply,
      assistantMessageId,
    });
  } catch (error) {
    console.error("AI chat API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.",
      },
      {
        status: 500,
      },
    );
  }
}
