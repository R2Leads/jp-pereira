"use client";

import { useState, type FormEvent } from "react";
import { whatsappLink } from "@/lib/whatsapp";

type Props = {
  origin: "contato" | "revenda";
  showCompany?: boolean;
};

export default function ContactForm({ origin, showCompany = false }: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [waUrl, setWaUrl] = useState("");
  const [submittedName, setSubmittedName] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const lines = [
      "Olá! Enviei uma mensagem pelo site da JP Pereira.",
      "",
      `Nome: ${data.name ?? ""}`,
      `E-mail: ${data.email ?? ""}`,
    ];
    if (data.phone?.trim()) lines.push(`Telefone: ${data.phone.trim()}`);
    if (data.company?.trim()) lines.push(`Empresa: ${data.company.trim()}`);
    lines.push("", data.message ?? "");

    const url = whatsappLink(lines.join("\n"));
    setWaUrl(url);
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, origin }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        setStatus("error");
        setErrorMessage(
          typeof result.error === "string"
            ? result.error
            : "Não foi possível enviar sua mensagem no momento. Tente novamente em instantes."
        );
        return;
      }

      setSubmittedName(data.name?.trim() || "");
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Erro de conexão ao enviar a mensagem. Por favor, verifique sua internet e tente novamente.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50/80 p-8 text-center sm:p-10">
        <p className="text-4xl" aria-hidden>✅</p>
        <h3 className="mt-3 text-xl font-bold text-green-950">
          Mensagem enviada com sucesso!
        </h3>
        <p className="mt-2 text-sm text-green-800 leading-relaxed max-w-md mx-auto">
          {submittedName ? `Obrigado, ${submittedName}! ` : ""}Recebemos seus dados e nossa equipe
          comercial entrará em contato em breve.
        </p>

        <div className="mt-6 rounded-2xl border border-green-200 bg-white/70 p-5 max-w-md mx-auto">
          <p className="text-xs font-semibold text-slate-700">
            Deseja atendimento imediato? Você também pode falar conosco pelo WhatsApp:
          </p>
          <div className="mt-3">
            <a
              href={waUrl || whatsappLink("Olá! Gostaria de falar com a equipe da JP Pereira.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <span>Falar no WhatsApp</span>
              <span aria-hidden>💬</span>
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setErrorMessage("");
          }}
          className="mt-6 text-sm font-semibold text-green-900 underline underline-offset-4 hover:text-green-700 transition"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-jp-blue-100 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-jp-blue-300 focus:border-jp-blue-400 focus:ring-4 focus:ring-jp-blue-100 disabled:bg-slate-100 disabled:cursor-not-allowed";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{errorMessage}</p>
          {waUrl && (
            <p className="mt-2 text-xs text-red-700">
              Se preferir, você pode enviar sua solicitação diretamente pelo{" "}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-2 hover:text-red-900"
              >
                WhatsApp da JP Pereira
              </a>.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${origin}-name`} className="mb-1.5 block text-sm font-semibold text-jp-blue-900">
            Nome*
          </label>
          <input
            id={`${origin}-name`}
            name="name"
            required
            maxLength={160}
            disabled={status === "submitting"}
            className={inputClass}
            placeholder="Seu nome"
          />
        </div>
        <div>
          <label htmlFor={`${origin}-email`} className="mb-1.5 block text-sm font-semibold text-jp-blue-900">
            E-mail*
          </label>
          <input
            id={`${origin}-email`}
            name="email"
            type="email"
            required
            maxLength={160}
            disabled={status === "submitting"}
            className={inputClass}
            placeholder="voce@email.com"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${origin}-phone`} className="mb-1.5 block text-sm font-semibold text-jp-blue-900">
            Telefone
          </label>
          <input
            id={`${origin}-phone`}
            name="phone"
            maxLength={40}
            disabled={status === "submitting"}
            className={inputClass}
            placeholder="(00) 00000-0000"
          />
        </div>
        {showCompany && (
          <div>
            <label htmlFor={`${origin}-company`} className="mb-1.5 block text-sm font-semibold text-jp-blue-900">
              Empresa
            </label>
            <input
              id={`${origin}-company`}
              name="company"
              maxLength={160}
              disabled={status === "submitting"}
              className={inputClass}
              placeholder="Nome da sua empresa"
            />
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
          disabled={status === "submitting"}
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
          disabled={status === "submitting"}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-jp-blue-300 accent-jp-red-500 disabled:opacity-50"
        />
        <label htmlFor={`${origin}-consent`} className="text-xs leading-relaxed text-jp-blue-800">
          Autorizo a JP Pereira a guardar e usar os dados informados neste formulário
          exclusivamente para responder a este contato. *
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-jp-red-500 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-jp-red-600 disabled:bg-slate-400 disabled:cursor-not-allowed sm:w-auto"
      >
        {status === "submitting" ? "Enviando mensagem..." : "Enviar mensagem"}
      </button>
      <p className="text-xs leading-relaxed text-jp-blue-600">
        Ao enviar, sua mensagem será encaminhada automaticamente para nossa equipe. Você também terá a opção de falar conosco pelo WhatsApp.
      </p>
    </form>
  );
}
