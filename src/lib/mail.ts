import nodemailer, { type Transporter } from "nodemailer";

export type ContactEmail = {
  origin: "contato" | "revenda";
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message: string;
};

export type MailResult = "sent" | "skipped" | "failed";

export function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n\x00-\x1f]/g, " ").trim();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getRecipients(origin: ContactEmail["origin"]): string[] {
  const direct = process.env.CONTACT_NOTIFICATION_TO;
  const legacy = origin === "revenda" ? process.env.MAIL_TO_REVENDA : process.env.MAIL_TO_CONTATO;
  const fallback = process.env.MAIL_TO_REVENDA ?? process.env.MAIL_TO_CONTATO;
  const raw = direct || legacy || fallback || "fv@jppereira.com.br";

  return raw
    .split(/[,;]/)
    .map((v) => sanitizeHeader(v))
    .filter((v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
}

export function getFromAddress(): string {
  const custom = (process.env.RESEND_FROM_EMAIL || process.env.MAIL_FROM || "formularios@jppereira.com.br").trim();
  if (custom.includes("<") && custom.includes(">")) {
    return sanitizeHeader(custom);
  }
  return `JP Pereira <${sanitizeHeader(custom)}>`;
}

export function isMailConfigured(): boolean {
  if (process.env.RESEND_API_KEY?.trim()) return true;
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    (process.env.MAIL_FROM || process.env.RESEND_FROM_EMAIL)
  );
}

function getNodemailerTransport(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    (process.env.SMTP_SECURE !== "false" && port === 465);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export function renderEmailContent(data: ContactEmail): { subject: string; text: string; html: string } {
  const safeName = sanitizeHeader(data.name.trim());
  const safeEmail = sanitizeHeader(data.email.trim());
  const safePhone = data.phone?.trim() ? sanitizeHeader(data.phone.trim()) : "";
  const safeCompany = data.company?.trim() ? sanitizeHeader(data.company.trim()) : "";
  const isResale = data.origin === "revenda";
  const originLabel = isResale ? "Formulário de Revenda" : "Formulário de Contato";

  const subject = isResale
    ? `Novo cadastro de revenda — ${safeName}`
    : `Nova mensagem do site — ${safeName}`;

  const textLines = [
    `Nova mensagem recebida pelo site (${originLabel})`,
    "",
    `Nome: ${safeName}`,
    `E-mail: ${safeEmail}`,
    `Telefone: ${safePhone || "Não informado"}`,
  ];
  if (safeCompany) {
    textLines.push(`Empresa: ${safeCompany}`);
  }
  textLines.push(`Origem: ${originLabel}`);
  textLines.push("", "Mensagem:", data.message.trim());
  const text = textLines.join("\n");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #003366; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">JP Pereira — Notificação do Site</h1>
      <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 13px;">${escapeHtml(originLabel)}</p>
    </div>
    <div style="padding: 24px;">
      <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; ${isResale ? "background-color: #fef3c7; color: #92400e;" : "background-color: #e0f2fe; color: #0369a1;"} margin-bottom: 20px;">
        ${escapeHtml(originLabel)}
      </div>

      <table cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="width: 120px; font-weight: 600; color: #64748b;">Nome:</td>
          <td style="color: #1e293b; font-weight: 500;">${escapeHtml(safeName)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-weight: 600; color: #64748b;">E-mail:</td>
          <td style="color: #003366; font-weight: 500;">
            <a href="mailto:${escapeHtml(safeEmail)}" style="color: #003366; text-decoration: underline;">${escapeHtml(safeEmail)}</a>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-weight: 600; color: #64748b;">Telefone:</td>
          <td style="color: #1e293b;">${escapeHtml(safePhone || "Não informado")}</td>
        </tr>
        ${safeCompany ? `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-weight: 600; color: #64748b;">Empresa:</td>
          <td style="color: #1e293b; font-weight: 500;">${escapeHtml(safeCompany)}</td>
        </tr>` : ""}
      </table>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Mensagem:</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${escapeHtml(data.message.trim())}</p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0;">💡 <strong>Resposta rápida:</strong> Você pode responder diretamente a este e-mail para falar com ${escapeHtml(safeName)}.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export async function sendContactEmail(data: ContactEmail): Promise<MailResult> {
  const to = getRecipients(data.origin);
  if (to.length === 0) {
    console.error("[mail] Nenhum destinatário configurado para envio.");
    return "failed";
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const { subject, text, html } = renderEmailContent(data);
  const from = getFromAddress();
  const safeName = sanitizeHeader(data.name.trim());
  const safeEmail = sanitizeHeader(data.email.trim());
  const replyTo = safeName ? `${safeName} <${safeEmail}>` : safeEmail;

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "jppereira-app/1.0",
        },
        body: JSON.stringify({
          from,
          to,
          reply_to: replyTo,
          subject,
          text,
          html,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error("[mail] Erro retornado pela API do Resend:", {
          status: response.status,
          statusText: response.statusText,
          message: errorBody.message || errorBody.error || "Erro desconhecido",
          name: errorBody.name,
        });
        return "failed";
      }

      return "sent";
    } catch (error) {
      console.error("[mail] Exceção de rede ao conectar à API do Resend:", error instanceof Error ? error.message : "Erro desconhecido");
      return "failed";
    }
  }

  const transport = getNodemailerTransport();
  if (transport) {
    try {
      await transport.sendMail({
        from,
        to,
        replyTo,
        subject,
        text,
        html,
      });
      return "sent";
    } catch (error) {
      console.error("[mail] Falha no envio via SMTP/Nodemailer:", error instanceof Error ? error.message : "Erro desconhecido");
      return "failed";
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[mail] [dev] Credenciais de e-mail ausentes. Mensagem de teste simulada para ${to.join(", ")}`);
    return "skipped";
  }

  console.error("[mail] Nenhuma credencial de e-mail (Resend ou SMTP) configurada em produção.");
  return "failed";
}
