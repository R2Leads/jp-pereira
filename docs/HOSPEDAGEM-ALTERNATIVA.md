# Hospedar em outro lugar (sem Hostinger, sem GitHub, sem Supabase)

Este documento existe para uma situação específica: a pessoa que recebeu o
backup precisa colocar o site no ar **sem** falar com quem fez o site e
**sem** depender do repositório `R2Leads/jp-pereira` nem das contas atuais.

Isso é possível: o pacote traz o código completo, as imagens, os vídeos, a
estrutura do banco e os 470 pontos de venda reais. O único serviço externo que
o site realmente precisa é um PostgreSQL.

O que **não** vem no pacote (e não deve vir): as chaves e senhas reais.
Numa reinstalação, gere valores novos — o site funciona igual.

---

## 1. O caminho mais rápido: Docker (qualquer servidor)

Precisa apenas de Docker com Compose (um VPS, sua máquina, um servidor na
Hostinger VPS, Hetzner, DigitalOcean, Contabo...).

```bash
unzip jp-pereira-backup-*.zip
cd jp-pereira
cp .env.selfhost.example .env
```

Edite o `.env` e defina:

- `POSTGRES_PASSWORD` — senha forte qualquer (o banco é criado agora).
- `SESSION_SECRET` — gere com:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ADMIN_PASSWORD_HASH` — gere com `npm run admin:hash` (ou deixe vazio e
  configure depois; sem ele o painel administrativo fica sem acesso).
- `APP_ORIGIN` — a URL pública final, ex.: `https://www.jppereira.com.br`.
- `APP_PORT` — porta no servidor (padrão 3000).

Depois:

```bash
docker compose -f docker-compose.selfhost.yml up --build -d
docker compose -f docker-compose.selfhost.yml logs -f app
```

O `docker-compose.selfhost.yml` cria o PostgreSQL **já com as migrations e os
470 pontos de venda importados**. O primeiro start compila o site (~1-2 min);
quando aparecer `JP Pereira no ar em 0.0.0.0:3000`, está pronto.

Conferir:

```bash
curl -I http://localhost:3000/
curl -s http://localhost:3000/produtos/acqua-naturabem-limao-500ml | grep -o "Vitamina B3"
docker exec $(docker compose -f docker-compose.selfhost.yml ps -q db) \
  psql -U jp -d jppereira -tAc "select count(*) from locator_points;"
```

Backup do banco (recomendado agendar):

```bash
docker exec $(docker compose -f docker-compose.selfhost.yml ps -q db) \
  pg_dump -U jp jppereira > backup-$(date +%F).sql
```

### Domínio e HTTPS num VPS

1. No DNS (Cloudflare, Registro.br ou onde estiver o domínio), crie um registro
   `A` do domínio (e do `www`) apontando para o IP do servidor.
2. Use um proxy reverso com SSL automático, por exemplo Caddy:

```
www.jppereira.com.br {
    reverse_proxy 127.0.0.1:3000
}
```

3. Ajuste `APP_ORIGIN=https://www.jppereira.com.br` no `.env` e reinicie:
   `docker compose -f docker-compose.selfhost.yml up -d`.

Observação: o formulário de contato grava no banco e abre o WhatsApp. O envio
de e-mail por SMTP só funciona se alguém configurar `SMTP_*`/`MAIL_*` (ver
tabela de variáveis no `LEIA-ME-BACKUP.md`); sem isso o formulário continua
funcionando, apenas não dispara e-mail.

---

## 2. Vercel, Railway, Render (build automático)

Essas plataformas fazem `npm ci && npm run build` sozinhas, mas **o build
precisa de um PostgreSQL acessível** (o localizador de lojas consulta o banco
na geração das páginas). Sem `DATABASE_URL` o build falha com
`DATABASE_URL is required`.

Passos:

1. Suba o código para um repositório **seu** (GitHub/GitLab) — este pacote já
   é um projeto completo, é só `git init`, commitar e enviar. O histórico da
   R2Leads não é necessário.
2. Crie um PostgreSQL gerenciado (Railway, Render, Neon, Supabase novo).
3. Rode as migrations e importe os dados, apontando para o banco novo:

```bash
# com DATABASE_URL do banco novo em .env.local
npm ci
npm run db:migrate
psql "$DATABASE_URL" -f db/dados-producao.sql
```

4. Na plataforma, configure as variáveis: `DATABASE_URL`, `SESSION_SECRET`,
   `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `GEOAPIFY_API_KEY` (opcional),
   `APP_ORIGIN`.
5. Build command: `npm run build`. Start: `npm run start:prod` (ou deixe a
   Vercel usar o runtime do Next).
6. Aponte o domínio na plataforma e confira as URLs do checklist abaixo.

No Railway e no Render basta escolher "Deploy from Dockerfile": o `Dockerfile`
do pacote já instala as dependências e inicia o site.

---

## 3. Voltar para a Hostinger (mesmo sem o GitHub)

1. Envie o conteúdo da pasta `jp-pereira` (sem `node_modules`) para o
   repositório/app Node da Hostinger, ou conecte um repositório novo seu.
2. Configure as variáveis de ambiente no painel (nomes no `LEIA-ME-BACKUP.md`).
3. Start command: `npm run start:prod`. O build é feito no deploy.

---

## 4. Checklist depois de qualquer instalação

- `/` abre com o hero "Vitamina B3".
- `/produtos/acqua-naturabem-limao-500ml` mostra B3, 27 mg de sódio e o aviso
  de fenilalanina.
- `/produtos?categoria=bebidas` lista a linha Acqua.
- `/onde-comprar` encontra pontos por cidade (teste "Sorocaba" e "Jundiaí").
- `/contato` e `/revenda` abrem o WhatsApp `(15) 3217-1785` e exigem o aceite.
- `/blog`, `/receitas`, `/empresa`, `/marcas` abrem sem erro.
- Se houver formulário de e-mail configurado, envie uma mensagem de teste.

## 5. O que continua dependendo de terceiros

- **Domínio** (`jppereira.com.br`): registro/DNS, hoje no Cloudflare. Sem
  acesso a ele, use um domínio novo ou um subdomínio.
- **E-mails corporativos** (`@jppereira.com.br`): Microsoft 365, separado do
  site. Não é preciso para o site funcionar.
- **Geoapify** (opcional): sem chave, o localizador funciona por cidade/CEP,
  mas perde o autocomplete de endereço.
- **WhatsApp**: o número está no código (`src/lib/whatsapp.ts`); trocar exige
  editar o arquivo e rebuildar.
