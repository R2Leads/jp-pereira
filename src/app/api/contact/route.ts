import { NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { takeRateLimit } from "@/lib/locator/security";

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "desconhecido";
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

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Preencha nome, e-mail e mensagem." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  try {
    await db.insert(contactMessages).values({
      origin,
      name: name.slice(0, 160),
      email: email.slice(0, 160),
      phone: phone ? phone.slice(0, 40) : null,
      company: company ? company.slice(0, 160) : null,
      message: message.slice(0, 5000),
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível enviar agora. Tente novamente em instantes." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
