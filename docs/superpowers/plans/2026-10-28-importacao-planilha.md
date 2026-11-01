# Importação de parceiros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Baixar modelo Excel e cadastrar vários parceiros com prévia no painel local.

**Architecture:** Gerador/leitor Excel somente no servidor; domínio puro compartilhado para validação e duplicidade; rotas autenticadas para modelo, prévia e confirmação por linha. Usar serviço de geocodificação e tabela existentes, sem migração.

**Tech Stack:** Next.js, React, TypeScript, PostgreSQL/Drizzle e ExcelJS.

**Spec:** `docs/superpowers/specs/2026-10-28-importacao-planilha-design.md`

## Global Constraints
- Somente demonstração local em localhost:3218; preservar site oficial, volume, dados e credenciais.
- Modelo fixo Excel; 500 parceiros/2 MB; usar validação do cadastro atual.
- Duplicados não sobrescrevem; pontos importados aguardam confirmação da localização.
- Não há Git nesta cópia: manter backup local dos fontes; nenhuma publicação ou commit.

## Review Focus
- CEP com zero inicial e telefone devem conservar texto.
- Fórmulas, cabeçalhos alterados, células fora do modelo e arquivos excessivos precisam gerar orientação.
- Reenvio, concorrência e cadastros na lixeira não podem duplicar importações.
- Prévia nunca grava; cliente não pode enviar active/coords para burlar confirmação.
- Falha no meio do lote deve mostrar progresso e permitir reenvio sem duplicar os salvos.

### Task 1: Modelo e validação
Files: `src/lib/locator/import.ts`, `src/lib/locator/spreadsheet.ts`, `tests/import.test.ts`.
Interfaces: `previewImportRows(rows, existing)`, `pointImportKey(point)`, `createImportTemplate()`, `readImportSpreadsheet(buffer)`.
- [ ] Escrever testes de validação, duplicidade, limites, cabeçalhos, fórmulas e zeros iniciais; observar falha pela funcionalidade ausente.
- [ ] Implementar helpers e modelo Excel vazio com instruções.
- [ ] Rodar `npx tsx --test tests/import.test.ts`; esperado: todos aprovados.

### Task 2: API e persistência
Files: `src/lib/locator/service.ts`, `src/app/api/admin/points/import/{route.ts,preview/route.ts,template/route.ts}`, `tests/import.integration.ts`.
Interfaces: `importPoint(input)` retorna estado `imported`/`duplicate` e ponto salvo/existente; prévia retorna linhas prontas/erro/duplicadas.
- [ ] Cobrir importação com geocoder controlado, reenvio, concorrência e falha de localização em teste isolado local com rollback.
- [ ] Implementar rotas com sessão/origem, limite de upload e validação no servidor.
- [ ] Rodar testes e conferir que a base existente permanece intacta.

### Task 3: Painel e entrega local
Files: `src/components/locator/ImportPoints.tsx`, `src/components/locator/AdminPoints.tsx`.
Interfaces: componente importa sequencialmente e informa `onImported(points)` para atualizar lista sem descartar formulário.
- [ ] Integrar cartão, download, envio, prévia, confirmação, progresso e relatório.
- [ ] Rodar testes unitários, TypeScript, ESLint e build. Atualizar apenas servidor local identificado, preservando build anterior.
- [ ] Verificar modelo, autenticação, prévia sem gravação, erros e layout desktop/celular no navegador.
- [ ] Registrar evidências e limites em `docs/importacao-planilha-validacao.md`.
