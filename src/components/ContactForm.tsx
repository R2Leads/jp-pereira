"use client";

import { useState, type FormEvent } from "react";
import { whatsappLink } from "@/lib/whatsapp";

type Props = {
  origin: "contato" | "revenda";
  showCompany?: boolean;
};

export default function ContactForm({ origin, showCompany = false }: Props) {
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [waUrl, setWaUrl] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const lines = [
      "Ola! Enviei uma mensagem pelo site da JP Pereira.",
      "",
      `Nome: ${data.name ?? ""}`,
      `E-mail: ${data.email ?? ""}`,
    ];
    if (data.phone?.trim()) lines.push(`Telefone: ${data.phone}`);
    if (data.company?.trim()) lines.push(`Empresa: ${data.company}`);
    lines.push("", data.message ?? "");

    const url = whatsappLink(lines.join("\n"));
    setWaUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
    form.reset();
    setStatus("sent");

    void fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, origin }),
    }).catch(() => undefined);
  }

  if (status === "sent") {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-4xl" aria-hidden>✅</p>
        <h3 className="mt-3 text-lg font-bold text-green-900">Quase tudo pronto!</h3>
        <p className="mt-1 text-sm text-green-800">
          Abrimos o WhatsApp com sua mensagem já preenchida. Toque em <strong>enviar</strong> na
          conversa para falar com a gente.
        </p>
        <div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex rounded-full bg-jp-red-500 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-jp-red-600"
          >
            Abrir o WhatsApp
          </a>
        </div>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-semibold text-green-900 underline underline-offset-4"
        >
          Preencher outra mensagem
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-jp-blue-100 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-jp-blue-300 focus:border-jp-blue-400 focus:ring-4 focus:ring-jp-blue-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${origin}-name`} className="mb-1.5 block text-sm font-semibold text-jp-blue-900">
            Nome*
          </label>
          <input id={`${origin}-name`} name="name" required maxLength={160} className={inputClass} placeholder="Seu nome" />
        </div>
        <div>
          <label htmlFor={`${origin}-email`} className="mb-1.5 block text-sm font-semibold text-jp-blue-900">
            E-mail*
          </label>
          <input id={`${origin}-email`} name="email" type="email" required maxLength={160} className={inputClass} placeholder="voce@email.com" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${origin}-phone`} className="mb-1.5 block text-sm font-semibold text-jp-blue-900">
            Telefone
          </label>
          <input id={`${origin}-phone`} name="phone" maxLength={40} className={inputClass} placeholder="(00) 00000-0000" />
        </div>
        {showCompany && (
          <div>
            <label htmlFor={`${origin}-company`} className="mb-1.5 block text-sm font-semibold text-jp-blue-900">
              Empresa
            </label>
            <input id={`${origin}-company`} name="company" maxLength={160} className={inputClass} placeholder="Nome da sua empresa" />
          </div>
        )}
      </div>
      <div>
        <label htmlFor={`${origin}-message`} className="mb-1.5 block text-sm font-semibold text-jp-blue-900">
          Mensagem*
        </label>
        <textarea
          id={`${origin}-message`}
          name="message"
          required
          rows={5}
          maxLength={5000}
          className={inputClass}
          placeholder={origin === "revenda" ? "Conte sobre sua empresa e os produtos de interesse" : "Como podemos ajudar?"}
        />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-jp-blue-100 bg-jp-blue-50 p-4">
        <input
          id={`${origin}-consent`}
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-jp-blue-300 accent-jp-red-500"
        />
        <label htmlFor={`${origin}-consent`} className="text-xs leading-relaxed text-jp-blue-800">
          Autorizo a JP Pereira a guardar e usar os dados informados neste formulário
          exclusivamente para responder a este contato. *
        </label>
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-jp-red-500 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-jp-red-600 sm:w-auto"
      >
        Enviar mensagem
      </button>
      <p className="text-xs leading-relaxed text-jp-blue-600">
        Ao enviar, abriremos o WhatsApp da JP Pereira com sua mensagem pronta — basta tocar em
        enviar na conversa.
      </p>
    </form>
  );
}
