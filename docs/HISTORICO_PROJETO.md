# Histórico Atualizado do Projeto — JP Pereira (Distribuindo Saúde)
**Data da última atualização:** 01/11/2026  
**Domínio Oficial:** [https://jppereira.com.br](https://jppereira.com.br)  
**Repositório GitHub:** `https://github.com/R2Leads/jp-pereira` (Branch: `main`)  
**Ambiente de Produção:** Hostinger Cloud (Web App Node.js) + Cloudflare DNS + Supabase PostgreSQL (AWS São Paulo)

---

## 1. Visão Geral do Estado Atual

O projeto superou a fase de homologação e os bloqueios de infraestrutura anteriores (na TurboCloud/cPanel) e **já está 100% publicado e operacional no domínio principal `https://jppereira.com.br`**.

### Principais Indicadores do Estado Atual:
- **Site Institucional:** No ar com catálogo completo das marcas (JPPereira, Naturabem, D'Laiz), receitas, blog e institucional.
- **Localizador de Lojas (`/onde-comprar`):** Operacional com base real de 469 parceiros/pontos de venda, busca por CEP, autocomplete de endereços e expansão inteligente de raio (30/50/100 km).
- **Banco de Dados:** Conexão direta e segura com PostgreSQL no Supabase (`sa-east-1` São Paulo).
- **DNS e E-mails Corporativos:** Transição concluída com **zero downtime**. Todas as contas de e-mail corporativo da empresa foram preservadas intactas na TurboCloud através de apontamento seletivo de registro Tipo A no Cloudflare.
- **Segurança:** Next.js atualizado para a versão **16.4.3**, eliminando 38 alertas de vulnerabilidade apontados pelo scanner da Hostinger.
- **Hero / Animação Principal:** Atualizado com a **nova animação definitiva** da Acqua Naturabem (resolução corrigida sem distorção na garrafa).

---

## 2. Linha do Tempo e Tudo o que Foi Realizado

### Fase A — Diagnóstico de Infraestrutura e Transição (Final de Outubro/2026)
1. **Diagnóstico da TurboCloud (cPanel/Passenger):**  
   - Identificado esgotamento de processos da conta (`NPROC 100/100`) que causava erros `503 Service Unavailable` no site antigo em WordPress ao rodar aplicações Node.js concorrentes.
   - Constatada a inviabilidade de manter a aplicação moderna Next.js 16 dentro do cPanel compartilhado da TurboCloud sem risco contínuo de indisponibilidade.
2. **Decisão de Arquitetura Aprovada:**  
   - Manter servidores MX de e-mail e hospedagem de caixas postais na TurboCloud.
   - Migrar a aplicação web para a **Hostinger Cloud (Node.js)**.
   - Gerenciar o tráfego via **Cloudflare**, apontando apenas a raiz `@` (Tipo A: `45.132.157.90`) para a Hostinger, preservando 100% da integridade dos e-mails da empresa.

---

### Fase B — Publicação e Estabilização em Produção (01/11/2026)
1. **Configuração do Repositório e Pipeline:**  
   - Criação e estruturação do repositório oficial no GitHub (`R2Leads/jp-pereira`).
   - Configuração de build determinístico via Webpack (`next build --webpack`), solucionando conflito do Turbopack com Tailwind CSS v4 em ambiente headless.
   - Ajuste fino do `package.json` e `tsconfig.json` para que a Hostinger instale e compile todas as 85 páginas estáticas e rotas dinâmicas perfeitamente.
2. **Auditoria de Vulnerabilidades e Scanner da Hostinger:**  
   - Atualizado o Next.js para a versão oficial de segurança `16.4.3`.
   - Scanner da Hostinger validado com **0 vulnerabilidades pendentes** (Zero críticos, zero altos).
3. **Conexão de Banco de Dados e Migração:**  
   - Supabase PostgreSQL configurado com pooler transacional e SSL obrigatório (`sslmode=require`).
   - Carga da base de 469 pontos de venda reais, com painel administrativo restrito em `/admin/pontos-de-venda`.
4. **Resiliência do Geocoding (Geoapify):**  
   - Configurada chave oficial da API Geoapify no ambiente de produção.
   - Implementado fallback de conexão nativa com IPv4 forçado (`family: 4`) em `fetchGeoapify`, eliminando erros intermitentes de timeout de DNS/IPv6 em provedores de internet locais.
   - Bateria de **64 testes automatizados** rodando com 100% de sucesso (`64 pass, 0 fail`).

---

### Fase C — Melhorias Visuais e de Conteúdo (01/11/2026)
1. **Troca da Animação Principal (Hero da Home):**  
   - Substituído o vídeo anterior (que apresentava leve distorção na proporção da garrafa de água Acqua Naturabem) pelo novo arquivo enviado pelo usuário (`Animação definitiva.mp4`).
   - Gerado o novo arquivo de alta fidelidade: `public/videos/acqua-animacao-definitiva.mp4` (1280x720, 4,4 MB, H.264).
   - Extraído poster estático em alta definição: `public/images/acqua-poster-definitiva.jpg` para carregamento imediato.
   - Ajustado componente `AcquaScrollExperience.tsx` com alinhamento à esquerda, garantindo nitidez e enquadramento ideal da garrafa em celulares, tablets e desktops ultrawide.
   - Validação em produção: URL pública respondendo com status HTTP `200 OK`.

2. **Formulários de Captação (`/revenda` e `/contato`):**  
   - Formulários testados em produção: gravando leads com sucesso na tabela `contact_messages` do Supabase.
   - Definida a arquitetura de envio de e-mails transacionais via **API do Resend** com o domínio `@jppereira.com.br`.

---

## 3. Matriz de Status Atual dos Recursos

| Módulo / Recurso | Status | Onde testar / Acessar |
| :--- | :---: | :--- |
| **Página Inicial (Hero + Animação)** | ✅ Concluído | `https://jppereira.com.br/` |
| **Catálogo de Produtos e Marcas** | ✅ Concluído | `https://jppereira.com.br/produtos` |
| **Localizador de Lojas (CEP / Cidade)** | ✅ Concluído | `https://jppereira.com.br/onde-comprar` |
| **Painel Administrativo de Pontos** | ✅ Concluído | `https://jppereira.com.br/admin/login` |
| **Health Check e Diagnóstico API** | ✅ Concluído | `https://jppereira.com.br/api/health` |
| **E-mails Corporativos da Equipe** | ✅ Preservado | MX operando normalmente na TurboCloud |
| **Formulário de Revendedores (Leads)** | ⚠️ Banco OK | Grava no Supabase; falta disparo via Resend |
| **Área de Membros das Nutricionistas** | ⏳ Próxima Etapa | Planejada para início imediato (Fase 2) |
| **Inclusão da Água no Catálogo** | ⏳ Pendente | Aguardando imagens/tamanhos com a equipe |

---

## 4. Próximos Passos Imediatos (Backlog da Fase 2)

### 1. Integração Transacional com Resend
- Configurar API Key do Resend no ambiente de produção.
- Adicionar disparos automáticos para:
  - Notificação à equipe comercial quando um novo revendedor preencher `/revenda`.
  - Notificação de mensagens gerais vindas de `/contato`.
  - E-mails de boas-vindas e recuperação de senha do portal de nutricionistas.

### 2. Área de Membros das Nutricionistas
- Criação das páginas públicas: `/nutricionistas` (apresentação e formulário de cadastro com nome, e-mail, telefone, CRN e estado).
- Fluxo de moderação administrativa: lista de cadastros pendentes no painel admin para a equipe aprovar ou reprovar nutricionistas.
- Portal protegido: login para nutricionistas aprovadas acessarem artigos científicos, fichas técnicas dos produtos e lâminas de recomendação.

### 3. Cadastro da Água Naturabem no Catálogo
- Inserir a Água Naturabem (com/sem gás e tamanhos disponíveis) em `src/data/products.json` para que apareça na vitrine de produtos e na página `/marcas/naturabem`.
