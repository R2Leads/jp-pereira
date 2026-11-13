import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeHeader,
  escapeHtml,
  getRecipients,
  getFromAddress,
  renderEmailContent,
  sendContactEmail,
} from '../src/lib/mail';

test('sanitizeHeader remove quebras de linha e caracteres de controle', () => {
  const input = 'Joao\r\nCc: hacker@evil.com\nSubject: Injected';
  const result = sanitizeHeader(input);
  assert.equal(result.includes('\r'), false);
  assert.equal(result.includes('\n'), false);
  assert.equal(result, 'Joao  Cc: hacker@evil.com Subject: Injected');
});

test('escapeHtml sanitiza caracteres especiais para prevencao de XSS', () => {
  const unsafe = '<script>alert("xss")</script> & \'test\'';
  const safe = escapeHtml(unsafe);
  assert.equal(safe.includes('<script>'), false);
  assert.equal(safe, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;test&#39;');
});

test('getRecipients prioriza CONTACT_NOTIFICATION_TO com fallback seguro', () => {
  const origEnv = { ...process.env };

  process.env.CONTACT_NOTIFICATION_TO = 'fv@jppereira.com.br';
  delete process.env.MAIL_TO_CONTATO;
  delete process.env.MAIL_TO_REVENDA;
  assert.deepEqual(getRecipients('contato'), ['fv@jppereira.com.br']);
  assert.deepEqual(getRecipients('revenda'), ['fv@jppereira.com.br']);

  delete process.env.CONTACT_NOTIFICATION_TO;
  process.env.MAIL_TO_REVENDA = 'revenda@jppereira.com.br';
  process.env.MAIL_TO_CONTATO = 'contato@jppereira.com.br';
  assert.deepEqual(getRecipients('revenda'), ['revenda@jppereira.com.br']);
  assert.deepEqual(getRecipients('contato'), ['contato@jppereira.com.br']);

  delete process.env.MAIL_TO_CONTATO;
  delete process.env.MAIL_TO_REVENDA;
  assert.deepEqual(getRecipients('contato'), ['fv@jppereira.com.br']);

  process.env = origEnv;
});

test('getFromAddress formata remetente padrao com nome amigavel', () => {
  const origEnv = { ...process.env };

  delete process.env.RESEND_FROM_EMAIL;
  delete process.env.MAIL_FROM;
  assert.equal(getFromAddress(), 'JP Pereira <formularios@jppereira.com.br>');

  process.env.RESEND_FROM_EMAIL = 'custom@jppereira.com.br';
  assert.equal(getFromAddress(), 'JP Pereira <custom@jppereira.com.br>');

  process.env.RESEND_FROM_EMAIL = 'Atendimento JP <custom@jppereira.com.br>';
  assert.equal(getFromAddress(), 'Atendimento JP <custom@jppereira.com.br>');

  process.env = origEnv;
});

test('renderEmailContent gera texto e HTML com identificacao da origem e campos', () => {
  const contato = renderEmailContent({
    origin: 'contato',
    name: 'Carlos Silva',
    email: 'carlos@exemplo.com',
    phone: '(15) 99999-1234',
    message: 'Gostaria de saber mais sobre entregas.',
  });
  assert.equal(contato.subject, 'Nova mensagem do site — Carlos Silva');
  assert.match(contato.text, /Carlos Silva/);
  assert.match(contato.text, /carlos@exemplo\.com/);
  assert.match(contato.html, /Formulário de Contato/);

  const revenda = renderEmailContent({
    origin: 'revenda',
    name: 'Ana Souza',
    email: 'ana@distribuidora.com',
    company: 'Distribuidora Central',
    message: 'Temos interesse em revender no atacado.',
  });
  assert.equal(revenda.subject, 'Novo cadastro de revenda — Ana Souza');
  assert.match(revenda.text, /Distribuidora Central/);
  assert.match(revenda.html, /Formulário de Revenda/);
  assert.match(revenda.html, /Distribuidora Central/);
});

test('sendContactEmail trata sucesso e falha da API Resend com seguranca', async () => {
  const origEnv = { ...process.env };
  const origFetch = global.fetch;

  process.env.RESEND_API_KEY = 'test_key';
  process.env.CONTACT_NOTIFICATION_TO = 'fv@jppereira.com.br';

  // Simula resposta de sucesso 200 do Resend
  global.fetch = async (url, opts) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(opts.method, 'POST');
    assert.equal(opts.headers['Authorization'], 'Bearer test_key');
    const body = JSON.parse(opts.body);
    assert.deepEqual(body.to, ['fv@jppereira.com.br']);
    assert.equal(body.reply_to, 'Mariana Lima <mariana@teste.com>');
    return new Response(JSON.stringify({ id: 'msg_12345' }), { status: 200 });
  };

  const successResult = await sendContactEmail({
    origin: 'contato',
    name: 'Mariana Lima',
    email: 'mariana@teste.com',
    message: 'Mensagem de teste',
  });
  assert.equal(successResult, 'sent');

  // Simula erro de autenticacao 401 do Resend
  global.fetch = async () => {
    return new Response(JSON.stringify({ message: 'Invalid API Key', name: 'authentication_error' }), { status: 401 });
  };

  const failureResult = await sendContactEmail({
    origin: 'contato',
    name: 'Mariana Lima',
    email: 'mariana@teste.com',
    message: 'Mensagem de teste',
  });
  assert.equal(failureResult, 'failed');

  // Simula falha de conexao de rede
  global.fetch = async () => {
    throw new Error('Network timeout');
  };

  const networkFailure = await sendContactEmail({
    origin: 'contato',
    name: 'Mariana Lima',
    email: 'mariana@teste.com',
    message: 'Mensagem de teste',
  });
  assert.equal(networkFailure, 'failed');

  global.fetch = origFetch;
  process.env = origEnv;
});
