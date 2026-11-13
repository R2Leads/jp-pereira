import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/contact/route';

test('POST /api/contact rejeita campos obrigatorios ausentes', async () => {
  const req = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', email: '', message: '' }),
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.error, /Preencha/);
});

test('POST /api/contact rejeita ausencia de consentimento LGPD', async () => {
  const req = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Fulano',
      email: 'fulano@email.com',
      message: 'Ola',
      consent: false,
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.error, /aceitar o uso dos dados/);
});

test('POST /api/contact rejeita e-mail em formato invalido', async () => {
  const req = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Fulano',
      email: 'email-invalido',
      message: 'Ola',
      consent: true,
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.error, /Informe um e-mail válido/);
});

test('POST /api/contact retorna 502 quando o envio do e-mail falha', async () => {
  const origEnv = { ...process.env };
  const origFetch = global.fetch;

  process.env.RESEND_API_KEY = 'invalid_key';
  global.fetch = async () => {
    return new Response(JSON.stringify({ error: 'Auth error' }), { status: 401 });
  };

  const req = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '192.168.10.1',
    },
    body: JSON.stringify({
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      message: 'Mensagem de teste',
      consent: true,
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 502);
  const json = await res.json();
  assert.match(json.error, /Não foi possível enviar sua notificação/);

  global.fetch = origFetch;
  process.env = origEnv;
});

test('POST /api/contact retorna 200 e confirma notificacao no sucesso', async () => {
  const origEnv = { ...process.env };
  const origFetch = global.fetch;

  process.env.RESEND_API_KEY = 'valid_key';
  process.env.CONTACT_NOTIFICATION_TO = 'fv@jppereira.com.br';
  global.fetch = async () => {
    return new Response(JSON.stringify({ id: 'msg_987' }), { status: 200 });
  };

  const req = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '192.168.10.2',
    },
    body: JSON.stringify({
      origin: 'revenda',
      name: 'Empresa Parceira',
      email: 'parceiro@loja.com',
      company: 'Loja de Bebidas',
      phone: '(15) 3217-1785',
      message: 'Gostaria de cadastrar como revenda.',
      consent: true,
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.ok, true);
  assert.equal(json.notified, true);

  // Segunda chamada idêntica logo em seguida deve ser deduplicada
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount++;
    return new Response(JSON.stringify({ id: 'msg_988' }), { status: 200 });
  };

  const req2 = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'cf-connecting-ip': '200.100.50.25',
    },
    body: JSON.stringify({
      origin: 'revenda',
      name: 'Empresa Parceira',
      email: 'parceiro@loja.com',
      company: 'Loja de Bebidas',
      phone: '(15) 3217-1785',
      message: 'Gostaria de cadastrar como revenda.',
      consent: true,
    }),
  });

  const res2 = await POST(req2);
  assert.equal(res2.status, 200);
  const json2 = await res2.json();
  assert.equal(json2.ok, true);
  assert.equal(json2.deduplicated, true);
  // Garante que fetch NÃO foi chamado novamente
  assert.equal(fetchCount, 0);

  global.fetch = origFetch;
  process.env = origEnv;
});
