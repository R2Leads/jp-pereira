# Plano — listagem complementar por cidade

Spec: `docs/superpowers/specs/2026-10-29-listagem-complementar-por-cidade.md`.

## Execução

- [ ] Adicionar teste de integração que prova ocultação/publicação por cidade sem coordenadas ou estado GPS ativo; observar a falha antes da implementação.
- [ ] Acrescentar o campo de visibilidade independente do status GPS, migração idempotente e ações administrativas.
- [ ] Conectar a lista pública e o painel ao estado explícito de visibilidade por cidade.
- [ ] Fazer backup do banco local antes da migração; conferir contagens e preservação de dados.
- [ ] Rodar suíte, TypeScript, lint focado e build; reiniciar somente o servidor local verificado e conferir a API/página.
- [ ] Atualizar as páginas de Estado Atual e Histórico no Notion com o resultado verificado.

## Restrições

- O checkout do localizador não tem histórico Git; preservar os arquivos existentes e não tentar criar commits/worktrees.
- O banco é a demonstração local; não tocar em produção, chaves ou configuração externa.
- Para status geográfico, manter `active` condicionado a coordenadas confirmadas. “Visível por cidade” é um estado separado.
