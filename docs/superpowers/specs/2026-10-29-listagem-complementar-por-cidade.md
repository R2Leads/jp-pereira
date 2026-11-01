# Listagem complementar por cidade

## Objetivo aprovado

Exibir os parceiros sem localização confirmada na busca pública agrupados pela cidade de referência, com nome, endereço original e link para pesquisar esse endereço no Google Maps. Não calcular nem sugerir distância para esses registros. Os parceiros com localização confirmada continuam na lista por proximidade.

## Regras

- Separar a visibilidade pública por cidade do estado `active`, que exige coordenadas confirmadas.
- Não gerar coordenadas a partir de CEP, cidade ou centroide.
- Exibir a cidade apenas quando ela e a UF da busca coincidirem com o cadastro.
- Permitir ocultar e voltar a exibir um parceiro por cidade no painel administrativo.
- Ao desativar ou mover para a lixeira, ocultar o parceiro das buscas públicas.
- Não retornar telefone, WhatsApp, coordenadas nem erros internos na lista por cidade.
- Manter a alteração somente na demonstração local; não publicar.

## Critérios de aceite

1. Os 367 pontos confirmados preservam a busca por distância.
2. Os 102 pontos sem localização confiável ficam visíveis em suas cidades, sem distância calculada.
3. A busca por outra cidade/UF não mostra esses pontos.
4. O link do Google Maps pesquisa o endereço original; nenhum resultado por cidade contém coordenadas ou contatos.
5. O painel mostra claramente “Visível por cidade” e permite ocultar/publicar sem alterar coordenadas ou fingir confirmação.
6. Lixeira, desativação, autenticação e proteção de origem continuam funcionando.
