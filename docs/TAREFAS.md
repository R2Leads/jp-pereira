# Gerenciador de Tarefas Locais — JP Pereira

> **Nota de Governança:** Este documento atua como o registro oficial de tarefas e pendências locais do projeto JP Pereira, mantendo o controle diretamente no repositório e alinhado com o Notion.

---

## 🚀 Tarefas Concluídas (Etapa 1 — Publicada em Produção)

- [x] **Diagnóstico de Infraestrutura:** Identificação dos limites de NPROC (100/100) na TurboCloud e migração estratégica do frontend para a Hostinger Cloud.
- [x] **Preservação de E-mails Corporativos:** Apontamento seletivo no Cloudflare (Registro A `45.132.157.90`), preservando 100% dos registros MX da TurboCloud com zero downtime.
- [x] **Configuração de Build e Repositório:** Repositório oficial configurado no GitHub (`R2Leads/jp-pereira`) e build estável configurado via Webpack (`next build --webpack`).
- [x] **Scanner de Segurança da Hostinger:** Atualização do Next.js para 16.4.3 e resolução de 38 alertas de segurança (0 pendências no hPanel).
- [x] **Localizador de Pontos de Venda:** Conexão com Supabase PostgreSQL, 469 lojas reais carregadas, busca por CEP/autocomplete e expansão dinâmica de raio (30/50/100 km).
- [x] **Resiliência do Geocoding:** Geoapify com IPv4 forçado nativo (`family: 4`) em `fetchGeoapify` e 64 testes automatizados aprovados (`npm test`).
- [x] **Nova Animação Hero da Home:** Substituição do vídeo com proporção distorcida pela versão definitiva (`acqua-animacao-definitiva.mp4` + pôster em alta resolução).
- [x] **Formulários de Captação:** Validados em `/revenda` e `/contato` com gravação confirmada no Supabase (`contact_messages`).

---

## 🛠️ Tarefas em Andamento (Fase 2 — Área de Nutricionistas & Transacional)

### 1. Envio de E-mails Transacionais (Resend)
- **Status:** `A Iniciar`
- **Prioridade:** `Alta`
- **Checklist:**
  - [ ] Obter/configurar a chave `RESEND_API_KEY` vinculada ao domínio `@jppereira.com.br`.
  - [ ] Implementar trigger de envio no endpoint `/api/contact` para alertar o e-mail comercial da equipe quando um novo revendedor se cadastrar.
  - [ ] Preparar templates de e-mail (confirmação para o cliente + aviso interno para a equipe).

### 2. Área de Membros das Nutricionistas
- **Status:** `Em Planejamento Técnico`
- **Prioridade:** `Alta`
- **Checklist:**
  - [ ] Criação da página institucional e formulário de adesão `/nutricionistas` (Nome, E-mail, CRN, UF, Telefone).
  - [ ] Tabela no Supabase para nutricionistas (`nutricionistas_members`) com status `pendente`, `aprovado`, `recusado`.
  - [ ] Módulo no painel administrativo para moderação dos cadastros.
  - [ ] Sistema de login e área restrita para download de fichas técnicas e materiais científicos.
  - [ ] Disparo de e-mail de boas-vindas com senha provisória via Resend.

---

## 📦 Backlog de Conteúdo

### 3. Inclusão da Água Naturabem no Catálogo de Produtos
- **Status:** `A Fazer`
- **Prioridade:** `Normal`
- **Checklist:**
  - [ ] Obter com a equipe os detalhes da Água Naturabem (embalagens: 500ml com/sem gás, galões, etc.).
  - [ ] Adicionar registro em `src/data/products.json` associado à marca `naturabem`.
  - [ ] Validar exibição no catálogo geral e na página `/marcas/naturabem`.
