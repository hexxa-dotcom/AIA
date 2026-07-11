/**
 * Client-side helper to send emails via /api/email/send.
 * The API route uses RESEND_API_KEY if configured, or returns a stub response.
 */
export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const res = await fetch("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error("Falha ao enviar email");
  return res.json() as Promise<{ ok: boolean; id?: string; stub?: boolean; message?: string }>;
}
