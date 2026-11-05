import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT ?? 587);
const secure =
  process.env.SMTP_SECURE === "true" ||
  (process.env.SMTP_SECURE !== "false" && port === 465);

const host = process.env.SMTP_HOST ?? "";
const user = process.env.SMTP_USER ?? "";
const pass = process.env.SMTP_PASS ?? "";
const from = process.env.MAIL_FROM ?? "";

export const isMailConfigured = Boolean(host && user && pass && from);

const transport = isMailConfigured
  ? nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })
  : null;

export type ContactEmail = {
  origin: "contato" | "revenda";
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
};

export type MailResult = "sent" | "skipped" | "failed";

function recipients(origin: ContactEmail["origin"]): string[] {
  const raw =
    origin === "revenda"
      ? process.env.MAIL_TO_REVENDA ?? ""
      : process.env.MAIL_TO_CONTATO ?? process.env.MAIL_TO_REVENDA ?? "";

  return raw
    .split(/[,;]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendContactEmail(data: ContactEmail): Promise<MailResult> {
  if (!transport) {
    return "skipped";
  }

  const to = recipients(data.origin);
  if (to.length === 0) {
    return "skipped";
  }

  const isResale = data.origin === "revenda";
  const subject = isResale
    ? `Novo cadastro de revenda — ${data.name}`
    : `Nova mensagem do site — ${data.name}`;

  const rows: Array<[string, string]> = [
    ["Nome", data.name],
    ["E-mail", data.email],
    ["Telefone", data.phone || "não informado"],
    ["Empresa", data.company || "não informada"],
    ["Origem", isResale ? "Formulário de revenda" : "Formulário de contato"],
  ];

  const text = [
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Mensagem:",
    data.message,
  ].join("\n");

  const html = [
    "<div style=\"font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1f2937\">",
    "<table cellpadding=\"6\" cellspacing=\"0\" style=\"border-collapse:collapse\">",
    ...rows.map(
      ([label, value]) =>
        `<tr><td style="font-weight:700;white-space:nowrap">${escapeHtml(
          label
        )}</td><td>${escapeHtml(value)}</td></tr>`
    ),
    "</table>",
    "<p style=\"margin-top:16px;font-weight:700\">Mensagem</p>",
    `<p style="white-space:pre-wrap;margin-top:0">${escapeHtml(data.message)}</p>`,
    "</div>",
  ].join("");

  try {
    await transport.sendMail({
      from,
      to,
      replyTo: `${data.name} <${data.email}>`,
      subject,
      text,
      html,
    });
    return "sent";
  } catch (error) {
    console.error("Falha ao enviar o e-mail do formulário:", error);
    return "failed";
  }
}
