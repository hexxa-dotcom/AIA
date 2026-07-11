import { NextResponse } from "next/server";
import { dueSoonEmail, assignedEmail } from "@/lib/email-template";

async function sendViaResend(opts: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AIA OS <noreply@hexxa.app>",
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data as { id: string };
}

export async function POST(req: Request) {
  const body = await req.json();

  // Generic send: { to, subject, html }
  if (body.subject && body.html && !body.type) {
    const { to, subject, html } = body as { to: string; subject: string; html: string };
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        stub: true,
        message: "RESEND_API_KEY não configurada — email não enviado",
      });
    }
    try {
      const result = await sendViaResend({ apiKey, to, subject, html });
      return NextResponse.json({ ok: true, id: result.id });
    } catch (err) {
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
  }

  // Typed templates: { type, to, taskTitle, dueDate, assignerName, appUrl }
  const { type, to, taskTitle, dueDate, assignerName, appUrl } = body;
  let payload: { subject: string; html: string };
  if (type === "due") {
    payload = dueSoonEmail({ taskTitle, dueDate: new Date(dueDate), appUrl });
  } else if (type === "assigned") {
    payload = assignedEmail({ taskTitle, assignerName, appUrl });
  } else {
    return NextResponse.json({ error: "tipo de email desconhecido" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      stub: true,
      message: "RESEND_API_KEY não configurada — email não enviado",
      preview: { to, ...payload },
    });
  }

  try {
    const result = await sendViaResend({ apiKey, to, subject: payload.subject, html: payload.html });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
