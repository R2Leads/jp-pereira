# Validação da demonstração — 21/10/2026

**APTA para apresentação local após correção IPv4 e duas reinicializações reais, com busca livre por endereço e CEP testada na Geoapify.** A base continua com seis estabelecimentos explicitamente ilustrativos. A chave e suas restrições foram preservadas. Nenhuma publicação foi feita no site oficial.

## Localização confirmada e recuperação de acesso ao código

- Diretório real de execução: `C:\Users\amara\Documents\Codex\2026-10-21\files-pasted-by-the-user-chatgpt\outputs\jp-pereira-localizador`. Foi lido diretamente dos metadados do processo que atendia a porta 3218, sem ler seu bloco de variáveis de ambiente.
- O processo anterior, PID 23024, executava `next start --hostname 127.0.0.1 --port 3218`, com o executável `C:\nvm4w\nodejs\node.exe`, Node.js 22.23.2. O caminho do Next no comando também apontava para essa mesma cópia.
- Os arquivos `src/components/locator/StoreLocator.tsx`, `src/app/api/points/search/route.ts` e `src/lib/locator/geocoding.ts` existem e estão legíveis nessa pasta.
- Esta cópia veio de ZIP e não é um repositório Git. Ela está no workspace deste chat e é diferente da pasta original `C:\Projetos\Clientes\jp-pereira\site-local`.
- Não foi reproduzido um bloqueio de acesso ao código. O local efetivo da implementação foi confirmado; sem os registros da investigação posterior, não é possível provar qual erro de caminho, workspace ou permissão ocorreu nela. Nenhum projeto foi recriado.

## Correção Geoapify e reinício verificado

O IPv6 público mudou e a Geoapify retornava 401, “Not allowed”, pela conexão padrão/IPv6; a mesma chave funcionava por IPv4. O geocodificador agora faz somente sua requisição à Geoapify pelo cliente HTTPS do Node com `family: 4`, sem alterar agentes globais, DNS do sistema ou outras integrações. O limite de oito segundos e a validação TLS permanecem ativos.

Um teste de regressão reproduziu `GEOCODER_UNAVAILABLE` antes da correção e passou depois. Os hashes de `.env.local` e `.demo/network.json` permaneceram iguais antes e depois do trabalho. As restrições do painel não foram editadas.

O servidor antigo foi encerrado. A nova compilação passou, foi iniciada no PID 5776 e recebeu as quatro consultas reais com HTTP 200. Em seguida, esse processo foi encerrado e a demo foi iniciada novamente pelo `INICIAR-DEMO.cmd`, em processo independente do chat: iniciador PID 27088 e servidor PID 10744, Node.js 22.23.2. As quatro consultas foram repetidas com HTTP 200 e seis pontos. Uma observação da conexão desse novo processo confirmou IPv4 para o provedor, sem registrar os endereços.

Os PIDs acima são apenas o registro desta validação; mudam a cada início. A primeira tentativa de build foi bloqueada pelo sandbox no download de fontes Google. A compilação repetida com o acesso de rede necessário concluiu sem alteração de código para contornar esse bloqueio.

## Resultado dos testes

| Verificação | Resultado |
| --- | --- |
| Testes unitários de distância, validação, geocodificação, segurança, edição pendente e erros de localização | PASS — 17 testes, incluindo regressões de IPv4 e endereço com s/n |
| Integração com PostgreSQL real, APIs administrativas e formulários existentes | PASS — 5 testes na compilação que ficou em execução |
| Consultas reais Geoapify por endereço, CEP com/sem hífen e entradas inválidas | PASS — 4 testes com dez buscas pela API local, incluindo CEP manual 01001-000 |
| TypeScript | PASS |
| ESLint | PASS |
| Compilação Next.js | PASS — 85 páginas geradas, incluindo rotas existentes |
| Busca pública em computador e celular | PASS — seis pontos ordenados; pesquisa livre e atalho de Itu no navegador; largura CSS de 390 px sem rolagem horizontal |
| Cadastro e ativação com geocodificação real pela interface | PASS — ponto descartável localizado com confiança informada de 100%; permaneceu inativo até revisão e apareceu primeiro com distância zero após confirmação |
| Desativação, lixeira e restauração | PASS — desativação visual excluiu o ponto da busca; APIs e banco confirmaram lixeira recuperável e restauração inativa |
| Catálogo existente | PASS — busca por demerara retornou um produto; filtro Granolas retornou 22; acesso a Onde comprar pelo menu funcionou |
| Navegação em celular | PASS — menu abriu, navegou para Produtos e fechou após a navegação |
| Contato e Revenda | PASS — duas submissões fictícias persistidas no PostgreSQL isolado; entrada inválida recusada; registros próprios removidos |
| Páginas existentes | PASS — Home, Empresa, Marcas, Produtos, detalhe de produto, Receitas, Blog, Contato e Revenda retornaram HTTP 200 |
| Proteção da chave | PASS — quatro arquivos privados cobertos pelo .gitignore; chave ausente em 81 arquivos de código/configuração/documentação e 20 arquivos compilados do navegador |
| Restrições Geoapify | PASS — duas regras exatas de IP verificadas no painel; chamadas reais continuaram funcionando após aplicar as regras |
| Edição sem salvar | PASS — bloqueia confirmação e exclusão; descartar recupera o endereço salvo |
| Atualizar um cadastro alterado em outra aba | PASS — editor passou a mostrar o registro e a versão atuais |
| Localização do navegador indisponível | PASS — timeout observado e alternativa de busca manual apresentada |
| Permissão de localização negada | PASS em teste controlado da mensagem; nenhuma permissão real foi concedida pela automação |
| Geoapify indisponível ou resultado de baixa confiança | PASS em respostas controladas; falha retorna mensagem própria e cadastro pendente sem expor chave |
| Localização real pelo navegador após o segundo reinício | PASS — “Usar minha localização” exibiu “Sua localização atual” e seis pontos, sem erro; as coordenadas do visitante não foram registradas no relatório |
| Reinício pelo iniciador de apresentação | PASS — novo PID, health HTTP 200, quatro pesquisas HTTP 200 e controle por coordenadas HTTP 200 |

**Total: 26 testes automatizados aprovados**, além das verificações no navegador. Os testes criaram apenas registros descartáveis próprios e os removeram individualmente. A base final contém os seis exemplos originais ativos; não restaram mensagens de teste em Contato/Revenda.

## Resultados reais de proximidade

| Entrada pesquisada | Primeiro ponto da base ilustrativa | Distância aproximada |
| --- | --- | --- |
| CEP 18010-000 | Centro | 0,2 km |
| Avenida Antônio Carlos Comitre, 1000, Sorocaba, SP | Campolim | 0,3 km |
| CEP 18110000, também conferido como 18110-000 | Votorantim | 0,3 km |
| CEP 13300-000, também conferido sem hífen | Itu | 0,6 km |
| CEP manual 01001-000 (São Paulo) | Itu | 75,0 km |
| CEP 00000-000 e texto inexistente | Mensagem de endereço não encontrado | HTTP 422 |

As origens acima foram retornadas pela Geoapify, com filtro Brasil. A ordenação e as distâncias foram conferidas por cálculo independente, com tolerância de um metro; os links de rota contêm o destino correto e não usam chave Google. A precisão informada pelo provedor não comprova a presença de um revendedor nem valida fisicamente um imóvel. Os seis destinos permanecem ilustrativos.

O antigo atalho Campolim usava um CEP ilustrativo não encontrado pelo provedor. Os atalhos públicos agora usam Centro, Votorantim e Itu, que foram verificados e também funcionam sem chave no modo ilustrativo. Endereços completos podem apresentar um CEP localizado diferente do cadastro; a revisão administrativa continua obrigatória.

## Correções concluídas nesta continuação

- A Geoapify retornava baixa confiança ao receber a abreviação s/n em endereços completos. A causa foi isolada comparando a mesma consulta com e sem a abreviação. A consulta é normalizada, preservando o endereço salvo e o limite mínimo de confiança. O teste de regressão falhou antes da correção e passou depois; o cadastro visual e as APIs confirmaram o resultado real.
- O banco isolado não continha contact_messages, tabela já prevista pelo projeto. O preparo da demo agora cria essa estrutura de forma idempotente, sem apagar dados. Os fluxos existentes de Contato e Revenda passaram nos testes de persistência após a correção.

## Revisão independente

Uma revisão somente leitura não encontrou escrita administrativa sem sessão nem exposição de segredo nos caminhos novos. Identificou um problema importante: ativar o cadastro podia descartar alterações ainda não salvas e confirmar o endereço anterior. O formulário agora bloqueia essas ações até salvar ou descartar a edição e permanece bloqueado durante a requisição. A correção foi verificada por teste e no navegador.

A revisão também encontrou que “Atualizar” renovava a lista, mas mantinha a versão antiga do editor. O editor agora acompanha o registro atualizado quando não há edição pendente. Esse fluxo foi conferido com alteração simultânea em um registro descartável.

## Decisões aplicadas e limites

- **Cópia independente em outputs:** a base veio de ZIP, sem Git, e a implementação foi isolada para preservar a pasta original. A integração futura exige transportar a alteração revisada para o projeto definitivo.
- **Um administrador local:** hash scrypt do Node e sessão iron-session; credenciais fora do código. Contas individuais, recuperação de senha e autenticação pública de produção não fazem parte desta demo.
- **PostgreSQL próprio no Docker:** banco, volume e porta exclusivos; os scripts recusam outro banco. O Docker precisa estar ativo para os cadastros e a busca funcionarem.
- **Geocodificação real no servidor:** chave em .env.local, fora do código e do navegador. A conta aceita somente os IPs públicos IPv4 e IPv6 de saída verificados desta máquina. Os filtros de Referer e Origin ficaram vazios por se tratar de chamadas do servidor. [Orientação oficial da Geoapify](https://myprojects.geoapify.com/help/api-keys/).
- **Transporte IPv4 somente para Geoapify:** a regra IPv4 existente continua válida. A regra IPv6 da configuração anterior permanece intacta, mas não é usada por esta conexão. Nenhuma configuração global de rede foi alterada.
- **Mudança de IP:** trocar de rede/VPN ou renovar o IPv4 público pode bloquear a API. Nessa condição, é necessário verificar a autorização da saída IPv4 antes da apresentação. Mudanças de IPv6 não afetam mais o geocodificador. Os valores dos IPs e a chave não foram incluídos neste relatório.
- **Dados ilustrativos:** os seis pontos originais não representam revendedores reais. A geocodificação real da busca não transforma esses exemplos em estabelecimentos confirmados pela empresa.
- **Distância geográfica aproximada:** Haversine e até dez resultados; o Google Maps calcula a rota depois que o visitante abre o link. A distância exibida não representa trajeto rodoviário.
- **Versão por cadastro e bloqueio de edição pendente:** impedem ativar coordenadas desatualizadas. O administrador precisa salvar ou descartar alterações antes de confirmar, ativar, excluir ou trocar o cadastro aberto.
- **Sem armazenamento da busca:** endereço pesquisado e posição do visitante não entram no banco. A requisição usa POST, com chave externa mantida no servidor.

Nenhuma pendência identificada nesta validação impede a apresentação local. Hospedagem, backups, privacidade, escala, dados reais de revendedores e publicação definitiva exigem avaliação própria antes de produção.

## Operação e evidências

O Next.js compilado ficou em execução local na porta 3218, iniciado por processo independente da sessão do chat. O PostgreSQL está restrito a 127.0.0.1:55439. O guia de operação está em README-DEMO.md; os dados de acesso permanecem no arquivo privado .demo/ACESSO-LOCAL.txt. A imagem `../localizador-ipv4-corrigido.png` registra a busca manual de 01001-000 depois do reinício.

Para iniciar depois que a demo for encerrada, abra o Docker Desktop e execute `INICIAR-DEMO.cmd` nesta pasta. Ele sobe o banco e roda a compilação validada. Mantenha sua janela aberta, o computador acordado e a internet disponível. O servidor não é um serviço do Windows e não inicia automaticamente após reinício ou saída da sessão. Para iniciar pelo PowerShell: `npm.cmd run db:up` e depois `npm.cmd run demo:start`. Só é necessário repetir `npm.cmd run build` se o código for alterado. Não execute uma segunda instância se a porta 3218 já estiver ocupada.

As imagens anteriores localizador-desktop.jpg, localizador-mobile.jpg e localizador-admin-desktop.jpg estão na pasta outputs deste chat. A nova imagem localizador-geoapify.jpg registra uma pesquisa real pelo endereço de Campolim e os resultados ilustrativos ordenados. O viewport temporário do Chrome foi restaurado após a verificação responsiva.
