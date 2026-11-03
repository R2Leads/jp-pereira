# Plano de Implementação — Fase 2: Área de Membros das Nutricionistas & Transacional (Resend)

**Cliente:** JP Pereira Distribuidora de Produtos Naturais  
**Documento de Referência:** Proposta Comercial `PROP-2026-JP01` (Módulo 1)  
**Ambiente:** Next.js 16 + Supabase PostgreSQL + Iron Session + Resend API  

---

## 1. Visão Geral da Arquitetura

O sistema será composto por 4 pilares integrados:

```mermaid
graph TD
    A["Nutricionista (Front-end)"] -->|1. Cadastro /nutricionistas| B["API /api/nutricionistas/register"]
    B -->|2. Insere 'pending'| C[("Supabase PostgreSQL")]
    B -->|3. Disparo de confirmação| D["Resend API"]
    
    E["Admin JP Pereira (/admin)"] -->|4. Analisa CRN e aprova| F["API /api/admin/nutricionistas/[id]/status"]
    F -->|5. Atualiza status 'approved'| C
    F -->|6. Disparo de boas-vindas com acesso| D
    
    A -->|7. Login /nutricionistas/login| G["API /api/nutricionistas/login"]
    G -->|8. Cria sessão segura (Iron Session)| H["Área Restrita /nutricionistas/area"]
    H -->|9. Download com link protegido| I["Biblioteca Técnica de PDFs"]
```

---

## 2. Modelo de Dados (Supabase PostgreSQL via Drizzle ORM)

### Tabela `nutricionistas` (`nutricionistas_members`)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `serial` PK | Identificador único |
| `name` | `varchar(160)` | Nome completo da profissional |
| `email` | `varchar(160)` UNIQUE | E-mail (usado para login e notificações) |
| `password_hash` | `text` | Hash criptográfico via `scrypt` |
| `phone` | `varchar(40)` | Telefone / WhatsApp para contato |
| `crn` | `varchar(30)` | Número de registro no Conselho Regional de Nutrição |
| `crn_uf` | `varchar(2)` | Estado do conselho (ex: SP, RJ, MG) |
| `status` | `varchar(20)` | `'pending'` \| `'approved'` \| `'rejected'` \| `'blocked'` |
| `rejection_reason` | `text` (opcional) | Motivo caso a equipe recuse |
| `reset_token` | `varchar(128)` (opcional) | Token temporário para redefinição de senha |
| `reset_token_expires_at`| `timestamp with time zone` | Validade do token de senha (1 hora) |
| `terms_accepted_at` | `timestamp with time zone` | Timestamp de aceite dos termos LGPD |
| `created_at` | `timestamp with time zone` | Data de cadastro |
| `approved_at` | `timestamp with time zone` | Data em que o admin aprovou |

### Tabela `technical_materials` (`materiais_tecnicos`)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `serial` PK | Identificador do material |
| `title` | `varchar(200)` | Título do documento/estudo |
| `category` | `varchar(50)` | `'fichas-tecnicas'` \| `'tabelas-nutricionais'` \| `'artigos-cientificos'` \| `'laminas-prescricao'` |
| `description` | `text` | Breve resumo ou indicação clínica |
| `file_name` | `varchar(255)` | Nome do arquivo PDF físico |
| `file_size` | `integer` | Tamanho em bytes |
| `published_at` | `timestamp with time zone` | Data de publicação |
| `active` | `boolean` | Visível ou oculto para as nutricionistas |

---

## 3. Interfaces & Telas no Next.js

1. **Página Pública Institucional (`/nutricionistas`):**
   - Apresentação dos benefícios para profissionais de saúde (acesso a tabelas, apoio científico, lançamentos de marcas como Naturabem e D'Laiz).
   - Formulário de adesão com validação de campos (CRN, UF, E-mail, Senha e Termos LGPD).
   - Tela de confirmação com status de moderação.
2. **Tela de Autenticação (`/nutricionistas/login`):**
   - Login seguro persistido via cookie HTTP-only (`iron-session`).
   - Bloqueio inteligente: exibe mensagem clara se o cadastro ainda estiver em análise (`pending`) ou tiver sido recusado (`rejected`).
   - Link para fluxo de esqueci minha senha (`/nutricionistas/esqueci-senha`).
3. **Área Restrita / Dashboard (`/nutricionistas/area`):**
   - Painel exclusivo com filtros por categoria e busca por palavras-chave.
   - Download protegido via rota de API (`/api/nutricionistas/download/[id]`), impedindo acesso direto por URL externa sem autenticação.
4. **Módulo de Moderação no Admin (`/admin/nutricionistas`):**
   - Abas: **Pendentes**, **Aprovadas**, **Recusadas**.
   - Ações: botão verde "Aprovar" e botão cinza "Recusar".
   - Disparo automático do e-mail ao clicar em Aprovar.

---

## 4. Mensageria Transacional via Resend (`src/lib/email.ts`)

Serão implementados os 3 e-mails transacionais contratados:
1. **Confirmação de Solicitação:** *"Recebemos seu cadastro profissional na JP Pereira — em breve seu acesso será liberado"*.
2. **Boas-vindas / Acesso Liberado:** *"Seu cadastro foi aprovado! Acesse a biblioteca técnica de produtos e materiais científicos"*.
3. **Recuperação de Senha:** *"Redefinição de senha do Portal de Nutricionistas da JP Pereira"*.

*Plus:* Notificação do formulário de revenda (`/revenda`) para o e-mail comercial da JP Pereira.

---

## 5. Fases de Execução Passo a Passo

- [ ] **Etapa 1:** Instalar o SDK oficial do Resend (`resend`) e estruturar o serviço `src/lib/email.ts`.
- [ ] **Etapa 2:** Adicionar as tabelas no schema do Drizzle (`src/db/schema.ts`) e gerar as migrações SQL.
- [ ] **Etapa 3:** Criar as rotas de API públicas (`/api/nutricionistas/register`, `/api/nutricionistas/login`, `/api/nutricionistas/forgot-password`).
- [ ] **Etapa 4:** Criar as rotas de API administrativa (`/api/admin/nutricionistas`, moderação e aprovação).
- [ ] **Etapa 5:** Desenvolver a interface visual `/nutricionistas` (apresentação + formulário).
- [ ] **Etapa 6:** Desenvolver o portal restrito `/nutricionistas/area` com visualização e download protegido dos materiais.
- [ ] **Etapa 7:** Integrar a aba "Nutricionistas" no painel administrativo existente (`/admin`).
- [ ] **Etapa 8:** Bateria de testes unitários e validação em produção.
