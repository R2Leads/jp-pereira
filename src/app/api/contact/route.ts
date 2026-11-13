import { NextResponse } from "next/server";
import { takeRateLimit } from "@/lib/locator/security";
import { sendContactEmail } from "@/lib/mail";

async function persistMessage(data: {
  origin: "contato" | "revenda";
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message: string;
}) {
  try {
    const { db } = await import("@/db");
    const { contactMessages } = await import("@/db/schema");
    await db.insert(contactMessages).values({
      origin: data.origin,
      name: data.name.slice(0, 160),
      email: data.email.slice(0, 160),
      phone: data.phone ? data.phone.slice(0, 40) : null,
      company: data.company ? data.company.slice(0, 160) : null,
      message: data.message.slice(0, 5000),
    });
  } catch (error) {
    console.error(
      "[contact:db] Falha secundária ao persistir mensagem no banco:",
      error instanceof Error ? error.message : "Erro desconhecido"
    );
  }
}

const recentDispatches = new Map<string, number>();

function getDedupKey(origin: string, email: string, message: string): string {
  return `${origin}:${email.toLowerCase().trim()}:${message.trim().slice(0, 120)}`;
}

function isRecentDuplicate(key: string, now = Date.now()): boolean {
  if (recentDispatches.size > 500) {
    for (const [k, exp] of recentDispatches) {
      if (exp <= now) recentDispatches.delete(k);
    }
  }
  const exp = recentDispatches.get(key);
  return Boolean(exp && exp > now);
}

function markDispatched(key: string, windowMs = 30_000, now = Date.now()): void {
  recentDispatches.set(key, now + windowMs);
}

function clientKey(request: Request) {
  // Em ambientes com Cloudflare Edge, cf-connecting-ip é injetado confiavelmente pela borda
  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) {
    return `contact:${cfConnectingIp}`;
  }
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "desconhecido";
  return `contact:${ip}`;
}

export async function POST(request: Request) {
  if (!takeRateLimit(clientKey(request), 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas mensagens em pouco tempo. Aguarde alguns minutos." },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const company = String(body.company ?? "").trim();
  const message = String(body.message ?? "").trim();
  const origin = body.origin === "revenda" ? "revenda" : "contato";
  const consent =
    body.consent === true || body.consent === "true" || body.consent === "on";

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Preencha nome, e-mail e mensagem." },
      { status: 400 }
    );
  }
  if (!consent) {
    return NextResponse.json(
      { error: "É necessário aceitar o uso dos dados para enviar a mensagem." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  const dedupKey = getDedupKey(origin, email, message);
  if (isRecentDuplicate(dedupKey)) {
    return NextResponse.json(
      { ok: true, notified: true, deduplicated: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  await persistMessage({
    origin,
    name,
    email,
    phone,
    company,
    message,
  });

  const sendResult = await sendContactEmail({
    origin,
    name,
    email,
    phone,
    company,
    message,
  });

  if (sendResult === "failed") {
    return NextResponse.json(
      { error: "Não foi possível enviar sua notificação no momento. Por favor, tente novamente em instantes ou utilize nosso atendimento direto pelo WhatsApp." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (sendResult === "sent") {
    markDispatched(dedupKey);
  }

  return NextResponse.json(
    { ok: true, notified: sendResult === "sent" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
