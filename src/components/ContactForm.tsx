"use client";

import { useState, type FormEvent } from "react";

type Props = {
  origin: "contato" | "revenda";
  showCompany?: boolean;
};

export default function ContactForm({ origin, showCompany = false }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, origin }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Não foi possível enviar. Verifique sua conexão e tente novamente.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-4xl" aria-hidden>✅</p>
        <h3 className="mt-3 text-lg font-bold text-green-900">Mensagem enviada!</h3>
        <p className="mt-1 text-sm text-green-800">
          Recebemos seu contato e retornaremos em breve.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-semibold text-green-900 underline underline-offset-4"
        >
          Enviar outra mensagem
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

      {status === "error" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-jp-red-500 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-jp-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? "Enviando…" : "Enviar mensagem"}
      </button>
    </form>
  );
}
