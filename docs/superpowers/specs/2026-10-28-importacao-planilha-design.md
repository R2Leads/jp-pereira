# Importação de parceiros por planilha

## Pedido autorizado
Criar no painel existente o fluxo apresentado na conversa: baixar modelo padronizado, preencher um parceiro por linha, enviar, conferir a prévia e confirmar os cadastros válidos. Usar os campos e o PostgreSQL local já existentes. A implementação foi solicitada expressamente em 28/10/2026.

## Decisões de implementação
- Excel `.xlsx`, com uma aba `Parceiros` e outra de instruções. Campos obrigatórios: nome, endereço completo com número e bairro, cidade, UF e CEP. Telefone e WhatsApp opcionais, conforme o cadastro atual. Colunas formatadas como texto, sem dados fictícios pré-preenchidos.
- Modelo fixo escolhido na conversa. Mapeamento de colunas e CSV não são necessários nesta entrega; o modelo Excel evita a conversão de zeros à esquerda comum no CSV.
- Prévia autenticada sem gravação: indicar número da linha, erros e duplicados. Limites técnicos desta primeira versão: 500 parceiros e arquivo de até 2 MB, informados no painel.
- Duplicado: mesmo nome e endereço completo, cidade, UF e CEP, normalizando acentos, maiúsculas e espaços. Não sobrescrever cadastros existentes; incluir os que estiverem na lixeira na verificação e indicar a possibilidade de restauração.
- Confirmação importa apenas as linhas válidas explicitamente apresentadas. Cada gravação é autenticada e revalidada; bloqueio transacional impede duplicação por envio repetido/concomitante. Não mudar esquema do banco.
- Importação sequencial com progresso e interrupção segura. Reenviar a planilha pula os registros já salvos. Falha de geocodificação mantém o cadastro recuperável, aguardando correção. Localizações precisam ser conferidas individualmente antes de ativar, como no fluxo existente.
- Reutilizar os componentes e estilos atuais: cartão expansível acima da lista/formulário, botões existentes, prévia rolável e controles acessíveis no celular.
- Preservar site oficial, credenciais, volume e cadastros. Backup dos fontes existentes antes da edição e do build antes de atualizar somente o servidor local.

## Evidência esperada
Modelo abre e mantém CEP como texto; parsing rejeita arquivo inválido/fórmulas/cabeçalhos errados e aponta linhas com dados incompletos; prévia não grava; importação persiste múltiplos parceiros, pula duplicados inclusive em repetição concorrente e mantém pontos inativos; telas desktop/celular legíveis; testes, TypeScript, lint e build aprovados.
