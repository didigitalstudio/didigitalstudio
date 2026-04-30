// POST /api/contact
//
// Endpoint que recibe el form de la landing, valida y manda email vía Resend.
// Si RESEND_API_KEY no está seteada, devuelve 503 para que el front muestre
// fallback de contacto directo (mailto / WA).
//
// Env vars:
//   RESEND_API_KEY    — key de Resend (requerida para envío real)
//   RESEND_FROM       — remitente (default: "DI Digital Studio <onboarding@resend.dev>")
//   NOTIFICATIONS_EMAIL — destinatario (default: info@didigitalstudio.com)

export const config = {
  runtime: "nodejs",
};

const PROJECT_TYPE_LABELS = {
  "software-a-medida": "Software a medida",
  saas: "SaaS",
  webapp: "Webapp",
  automatizacion: "Automatización",
  ia: "Integración IA",
  consultoria: "Consultoría técnica",
  "no-se": "No estaba seguro / quiere asesoramiento",
};

const BUDGET_LABELS = {
  "2-5k": "USD 2.500 – 5.000",
  "5-15k": "USD 5.000 – 15.000",
  "15-50k": "USD 15.000 – 50.000",
  "50k+": "USD 50.000+",
  retainer: "Retainer mensual continuo",
  "no-se": "Todavía no lo definió",
};

const isEmail = (s) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const trim = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "invalid_json" }); }
  }
  body = body || {};

  // Honeypot
  if (body.website && String(body.website).trim().length > 0) {
    // Devolvemos 200 silenciosamente para no revelar el honeypot a bots
    return res.status(200).json({ ok: true });
  }

  const name = trim(body.name, 80);
  const company = trim(body.company, 120);
  const email = trim(body.email, 120);
  const projectType = trim(body.projectType, 40);
  const budget = trim(body.budget, 20);
  const message = trim(body.message, 2000);

  if (name.length < 2) return res.status(400).json({ error: "name_required" });
  if (!isEmail(email)) return res.status(400).json({ error: "email_invalid" });
  if (message.length < 10) return res.status(400).json({ error: "message_too_short" });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[/api/contact] RESEND_API_KEY no configurada — fallback a contacto manual");
    return res.status(503).json({ error: "email_not_configured", fallback: "info@didigitalstudio.com" });
  }

  const from = process.env.RESEND_FROM || "DI Digital Studio <onboarding@resend.dev>";
  const to = process.env.NOTIFICATIONS_EMAIL || "info@didigitalstudio.com";
  const projectLabel = PROJECT_TYPE_LABELS[projectType] || projectType || "—";
  const budgetLabel = BUDGET_LABELS[budget] || budget || "—";

  const subject = `Nuevo lead · ${name}${company ? " · " + company : ""}`;
  const text = [
    `Nuevo mensaje desde didigitalstudio.com`,
    ``,
    `Nombre: ${name}`,
    `Empresa: ${company || "—"}`,
    `Email: ${email}`,
    `Tipo de proyecto: ${projectLabel}`,
    `Inversión orientativa: ${budgetLabel}`,
    ``,
    `Mensaje:`,
    message,
    ``,
    `—`,
    `Recibido: ${new Date().toISOString()}`,
  ].join("\n");

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px; font-size: 18px;">Nuevo lead desde didigitalstudio.com</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #555;">Nombre</td><td style="padding: 6px 0;"><strong>${escapeHtml(name)}</strong></td></tr>
        <tr><td style="padding: 6px 0; color: #555;">Empresa</td><td style="padding: 6px 0;">${escapeHtml(company) || "—"}</td></tr>
        <tr><td style="padding: 6px 0; color: #555;">Email</td><td style="padding: 6px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding: 6px 0; color: #555;">Proyecto</td><td style="padding: 6px 0;">${escapeHtml(projectLabel)}</td></tr>
        <tr><td style="padding: 6px 0; color: #555;">Inversión</td><td style="padding: 6px 0;">${escapeHtml(budgetLabel)}</td></tr>
      </table>
      <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;" />
      <p style="margin: 0 0 8px; color: #555; font-size: 13px;">Mensaje:</p>
      <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${escapeHtml(message)}</div>
    </div>
  `;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });
    if (!r.ok) {
      let detail = null;
      try { detail = await r.json(); } catch { detail = null; }
      const detailText = detail ? JSON.stringify(detail) : await r.text().catch(() => "");
      console.error("[/api/contact] Resend error:", r.status, detailText);
      // Solo en non-production exponemos el detalle del provider para facilitar setup.
      const isProd = process.env.VERCEL_ENV === "production";
      return res.status(502).json({
        error: "send_failed",
        provider_status: r.status,
        ...(isProd ? {} : { provider_error: detail || detailText }),
      });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[/api/contact] fetch failed:", err && err.message ? err.message : err);
    return res.status(502).json({ error: "send_failed" });
  }
}
