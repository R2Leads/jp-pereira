# Consulta estruturada dos parceiros pendentes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Recuperar endereços pendentes usando os campos separados no Geoapify e ativar somente os resultados compatíveis com o cadastro.

**Architecture:** Módulo separado para extrair rua/número e validar os componentes retornados. O fluxo existente poderá usar essa consulta quando o texto livre não encontrar resultado. Um script local executa amostra somente leitura, reaproveita resultados aprovados e aplica o lote com versões e snapshots.

**Tech Stack:** TypeScript, Next.js existente, PostgreSQL/Drizzle, Geoapify via HTTPS IPv4.

**Spec:** Escopo aprovado abaixo, conforme plano aceito pela usuária nesta conversa.

## Escopo aprovado

- Usar endereço completo, cidade, UF e CEP existentes; preservar cadastro original.
- Testar amostra antes de processar o restante dos pendentes.
- Comparar os componentes da resposta antes de aceitar coordenadas.
- Ativar os pontos recuperados, dispensando conferência manual conforme autorização anterior.
- Resultados insuficientes permanecem pendentes com motivo documentado.

## Global Constraints

- Operar exclusivamente a demo local na porta 3218 e banco jppereira_locator_demo na porta 55439.
- Não alterar produção, credenciais, contatos existentes, registros ativos ou lixeira.
- Não substituir coordenadas pelo centro do CEP, bairro ou cidade.
- Manter o limite de confiança existente (0.6), complementado pela correspondência de rua, número, cidade, UF e CEP quando informado na resposta.
- Não adivinhar números ou corrigir grafias sem evidência; padronizar somente abreviações conhecidas e formatação da consulta.
- Para ativação automática desta recuperação, exigir número identificável e resultado de edificação/estabelecimento com o mesmo número.
- Não registrar chaves nas saídas e manter a conexão IPv4 já usada.

## Review Focus

- Número pertencente ao nome da rua ou quilômetro de rodovia não pode virar número do imóvel.
- Rua, cidade, UF, número ou CEP divergente devem impedir ativação automática.
- Sufixos de número e CEPs com zeros iniciais devem ser preservados.
- Indisponibilidade do provedor não deve modificar o cadastro nem ser confundida com endereço inexistente.
- Checkpoint e versão devem impedir repetição de gravações e sobrescrita de edição manual.

## Tarefas

- [x] Escrever e executar testes de parsing e seleção de resultados; observar a falha inicial.
- [x] Implementar consulta estruturada e integração limitada como fallback de endereço não encontrado.
- [x] Executar testes unitários, TypeScript e lint dos arquivos alterados.
- [x] Produzir snapshot e amostra representativa sem gravações no banco.
- [x] Se houver recuperação, processar o restante; reaproveitar os resultados da amostra.
- [x] Salvar e ativar os resultados aprovados usando controle de versão, com relatório de exceções.
- [x] Revisar código e validar preservação dos dados e busca pública; recompilar e reiniciar apenas a aplicação local.

## Ledger

- Planejamento: 341 ativos, 128 pendentes e 7 registros na lixeira verificados no banco. Todos os pendentes têm vírgula separando logradouro e complemento; alguns não têm número ou incluem quilômetro de rodovia.
- Ruling: a nova recuperação automática exige número verificável e precisão building/amenity. É uma restrição técnica para evitar ativar centro de rua/CEP como endereço exato; os demais não são apagados ou alterados.
- Evidência: uma resposta real para Campinas trouxe state=Sudeste, county=São Paulo e county_code=SP. A hierarquia é aceita somente com nome oficial, sigla e macrorregião coerentes, mantendo as demais comparações.
- Amostra: primeira versão aceitou2/20. Após tratar a hierarquia documentada acima, uma segunda amostra aceitou5/20, sem gravações e sem falhas temporárias.
- Revisão independente: corrigidos parsing de sufixos com hífen, normalização de compostos numéricos e retomada de falhas temporárias/de confirmação. Os cinco aceitos da amostra foram conferidos contra esses casos; a revisão aprovou o fluxo antes do apply.
- Verificações:39 testes unitários aprovados, TypeScript e lint dos arquivos alterados aprovados. Build concluído e painel local reiniciado.
- Resultado final:128 pendentes analisados,26 recuperados e ativados,367 ativos no total e102 ainda pendentes. Conferência do checkpoint completo:86 sem correspondência aceitável,13 com formato especial que não pôde ser separado como rua+número com segurança (rodovia, quilômetro, lote ou s/n) e3 com indisponibilidade persistente do serviço. A contagem anterior85/13/4 foi lida antes de concluir a última retentativa; nenhum total de ativos ou pendentes foi alterado por essa correção documental.
- Preservação:476 registros presentes; nenhum conflito ou erro de gravação; endereços/contatos/campos de negócio preservados;341 pontos preexistentes ativos inalterados;7 itens da lixeira preservados; nenhum ativo com coordenadas inválidas.
- Evidências privadas: .demo/structured-runs/2026-10-29T12-38-32-527Z/ contém snapshots before/all-before, report.json, validation.json, http-validation.json e resultado.md com as pendências.
- Validação HTTP: painel administrativo200,367 ativos/102 pendentes,26 recuperados confirmados pela API; busca pública200 com10 resultados; sem contatos na resposta pública/formulário e modelo mantido em5 colunas.
- Rollback preservado: fontes anteriores em .demo/backups/2026-10-29-consulta-estruturada; build anterior no diretório irmão jp-pereira-localizador-backups/2026-10-29-consulta-estruturada/.next. Nenhuma publicação ou alteração no site oficial.
