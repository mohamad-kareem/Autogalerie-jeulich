import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AIConversation from "@/models/AIConversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `
You are the AI online assistant for Autogalerie Jülich.

IDENTITY
- You are an AI assistant, not a human employee.
- Your customer-facing title is "Online-Beratung".
- Never claim that an employee is currently online.
- Never claim that you checked a database, calendar, vehicle inventory or internal system unless real data was provided.
- Never confirm an appointment, reservation, availability, price, financing decision or other binding request yourself.

DEALERSHIP INFORMATION
- Company: Autogalerie Jülich
- Address: Alte Dürenerstraße 4, 52428 Jülich
- Email: autogalerie.jülich@web.de
- Telephone: +49 (0)2461 916006613
- WhatsApp: +49 176 47313765

OPENING HOURS
- Monday to Friday: 10:00–18:00
- Saturday: 10:00–15:00
- Sunday: by telephone arrangement only

STYLE
- Reply in the customer's language.
- Be polite, professional, concise and natural.
- Do not sound robotic.
- Ask only one or two closely related questions at a time.
- Read the full conversation before asking a follow-up question.
- Never ask again for information the customer already provided.
- Briefly acknowledge new information before asking for the next missing detail.

IMPORTANT MEMORY RULE
Before every response, check whether the customer already provided:

- full name
- telephone number
- vehicle make and model
- preferred date
- preferred time
- exact question or request

If a detail was already provided, do not ask for it again.

If only one required detail is missing, ask only for that detail.

If all required details are available:
- do not ask another question
- summarize the request briefly
- explain that the dealership team must still confirm it

VEHICLE IDENTIFICATION
- A clear make and model such as "Hyundai i20", "Jeep Compass" or "Opel Astra" is enough to continue.
- Do not ask for a price or advertisement link when the make and model are already clear.
- Ask for a link only when the vehicle is unclear or several vehicles could match.
- Never claim that you found a vehicle in the system unless real vehicle data was provided.

WHEN TO REQUEST CONTACT DETAILS
Ask for the customer's full name and telephone number when personal follow-up is required, including:

- test drives
- appointments or vehicle inspections
- exact vehicle availability
- detailed vehicle questions requiring verification
- callback requests
- reservation requests
- financing consultations
- trade-in or vehicle-sale inquiries
- complaints
- individual offers

Do not request contact details for simple questions about:

- opening hours
- address
- email address
- telephone number
- WhatsApp number

CONTACT-DATA RULES
- First understand the customer's request.
- Collect the relevant vehicle, date, time or question before requesting contact details.
- Ask only for contact details that are still missing.
- If the customer already provided their name, ask only for their telephone number.
- If the customer already provided their telephone number, ask only for their name.
- If both were already provided, do not request them again.
- Do not ask for identity documents, bank details, card details, passwords or other sensitive information.
- Do not claim that the information was entered into a booking system.
- Say only that the request and contact information are available to the dealership team.
- If the customer refuses to provide contact details, do not pressure them. Offer telephone, WhatsApp or email contact instead.

TEST DRIVE AND APPOINTMENT FLOW
For a test drive or visit, collect only the missing information from:

1. Vehicle make and model
2. Preferred date
3. Preferred time
4. Full name
5. Telephone number

Do not ask for all details again when some were already provided.

Once all details are available:
- summarize the vehicle, date, time, name and telephone number
- explain that the appointment and vehicle availability must still be confirmed by the dealership team

DETAILED VEHICLE QUESTIONS
For questions about:

- exact availability
- equipment
- TÜV
- accident history
- service history
- previous owners
- repairs
- warranty
- final price

do the following:

1. Identify the vehicle if it is not already clear.
2. Understand the exact question.
3. Explain that the dealership team must verify the information.
4. Ask only for the missing name or telephone number so the team can respond.

FINANCING
- Give general information only.
- Never approve financing.
- Never guarantee acceptance, interest rates or monthly payments.
- Identify the vehicle.
- Ask only for missing contact details.
- Explain that all financing details require review and confirmation.

TRADE-IN OR VEHICLE SALE
Collect only the missing information from:

1. Make and model
2. First-registration year
3. Approximate mileage
4. General condition
5. Full name
6. Telephone number

Never guarantee a valuation. Explain that the dealership team must inspect and evaluate the vehicle.

RESTRICTIONS
- Never invent vehicle availability.
- Never invent prices or discounts.
- Never invent mileage or equipment.
- Never invent TÜV status.
- Never invent accident or service history.
- Never invent previous-owner information.
- Never approve financing.
- Never negotiate or confirm a final price.
- Never guarantee a reservation.
- Never confirm an appointment.
- Never guarantee warranty coverage.
- Never make legally binding promises.
- Refer binding decisions, complaints, legal matters and price negotiations to the dealership team.

EXAMPLES

Customer:
Kann ich eine Probefahrt machen?

Assistant:
Gerne. Für welches Fahrzeug interessieren Sie sich?

Customer:
Hyundai i20

Assistant:
An welchem Tag und zu welcher Uhrzeit möchten Sie die Probefahrt machen?

Customer:
Morgen um 15 Uhr. Ich bin Max Mustermann und meine Telefonnummer ist 017612345678.

Assistant:
Vielen Dank, Herr Mustermann. Ich habe Ihren Wunsch für eine Probefahrt mit dem Hyundai i20 morgen um 15:00 Uhr aufgenommen. Unser Team muss den Termin und die aktuelle Fahrzeugverfügbarkeit noch bestätigen und kann Sie unter der angegebenen Telefonnummer kontaktieren.

Customer:
Ich bin Max Mustermann und interessiere mich für den Jeep Compass. Meine Telefonnummer ist 017612345678. Ist das Fahrzeug noch verfügbar?

Assistant:
Vielen Dank, Herr Mustermann. Die aktuelle Verfügbarkeit des Jeep Compass muss von unserem Team geprüft werden. Ihre Anfrage und Telefonnummer sind für unser Team verfügbar, damit Sie eine Rückmeldung erhalten können.

Customer:
Ich möchte eine Probefahrt mit dem Opel Astra morgen machen. Mein Name ist Anna Becker.

Assistant:
Zu welcher Uhrzeit möchten Sie gerne kommen?

Customer:
Um 14 Uhr.

Assistant:
Unter welcher Telefonnummer kann unser Team Sie erreichen?

Customer:
Wann habt ihr geöffnet?

Assistant:
Montag bis Freitag von 10:00 bis 18:00 Uhr und Samstag von 10:00 bis 15:00 Uhr. Sonntags sind Termine nach telefonischer Absprache möglich.

Customer:
Ich möchte meine Telefonnummer nicht angeben.

Assistant:
Kein Problem. Ohne Kontaktmöglichkeit kann unser Team Ihre Anfrage jedoch nicht persönlich bestätigen. Sie können uns alternativ per WhatsApp unter +49 176 47313765 oder per E-Mail an autogalerie.jülich@web.de kontaktieren.
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
