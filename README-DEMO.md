# Demonstração local — Localizador JP Pereira

A demo está nesta cópia independente. A pasta original em C:\Projetos\Clientes\jp-pereira\site-local e o site público foram preservados.

## Abrir agora

- Página pública: http://localhost:3218/onde-comprar
- Administração: http://localhost:3218/admin/pontos-de-venda
- O usuário e a senha gerados nesta máquina estão em `.demo/ACESSO-LOCAL.txt`. Abra esse arquivo localmente; não envie seu conteúdo no chat e não o compartilhe.
- A busca livre por endereços e CEPs está habilitada com Geoapify. Use os atalhos Centro, Votorantim e Itu para começar.
- No painel, “Preencher com um endereço ilustrativo” permite ensaiar o cadastro. Com a chave configurada, a localização é consultada no provedor e exige revisão antes da ativação.

## Iniciar para apresentação

Abra o Docker Desktop e dê dois cliques em `INICIAR-DEMO.cmd` nesta pasta. O iniciador sobe somente o banco da demo e executa a compilação já validada. Mantenha a janela aberta e o computador acordado durante a apresentação. É necessário acesso à internet para geocodificar endereços. Se a demo já estiver rodando na porta 3218, não abra uma segunda instância.

O equivalente no PowerShell, dentro desta pasta, é:

```powershell
npm.cmd run db:up
npm.cmd run demo:start
```

O processo continua enquanto essa janela estiver aberta; não é um serviço do Windows e não inicia automaticamente depois de reiniciar o computador. Após alterar código, execute `npm.cmd run build` antes de iniciar a apresentação.

Na correção IPv4 de 21/10, o iniciador também foi validado em um processo independente da sessão do chat, com saída em `.demo/server.stdout.log` e `.demo/server.stderr.log`. Esse processo permanece disponível após o término da execução do assistente, mas pode encerrar por falha, reinício ou saída da sessão do Windows.

## Desenvolvimento e preparação em outra máquina

Para preparar o banco e iniciar o modo de desenvolvimento:

```powershell
npm run demo
```

O comando prepara o banco local, insere apenas exemplos ainda inexistentes e inicia o Next.js em 127.0.0.1:3218. Não apaga cadastros nem restaura pontos editados. Em outra máquina, rode `npm ci` antes e deixe `npm run demo:setup` gerar novas credenciais.

O comando `npm run demo` continua disponível para desenvolvimento; a apresentação usa `demo:start`.

Use Ctrl+C no terminal para parar o site. Para parar só o banco, preservando os dados:

```powershell
npm run db:stop
```

O PostgreSQL usa contêiner e volume próprios, com porta 55439 restrita a 127.0.0.1. Os comandos de preparação recusam outros nomes de banco, hosts e portas. Nenhum banco de produção foi configurado.

## Testar a demonstração

1. Busque pelo exemplo Centro (18010-000) e confira os seis pontos em ordem de distância.
2. Entre no painel e crie um novo ponto usando um endereço ilustrativo. Ele será salvo inativo.
3. Confira o endereço encontrado; marque a confirmação e ative o ponto. Repita a busca pública.
4. Edite o nome ou contato e salve. Se alterar endereço, cidade, UF ou CEP, será necessária nova confirmação.
5. Desative, mova para a lixeira e restaure um ponto. Restauração mantém o cadastro inativo.
6. Busque `Avenida Antônio Carlos Comitre, 1000, Sorocaba, SP`: o ponto ilustrativo Campolim aparece primeiro.
7. Busque `00000-000`: a página explica que o endereço não foi localizado. Cadastros sem localização válida ficam salvos como pendentes e fora da busca.

Todos os nomes e as coordenadas dos exemplos são ilustrativos. Não atestam revenda real nem precisão de imóvel. O cálculo é geográfico em linha reta, limitado aos dez pontos ativos mais próximos; o caminho é aberto no Google Maps.

## Geoapify configurada com segurança

A chave existente do projeto Geoapify foi configurada somente em `GEOAPIFY_API_KEY`, no arquivo privado `.env.local`. Esse arquivo e a pasta `.demo/` são ignorados pelo Git. A chave não usa prefixo `NEXT_PUBLIC_` e não está no código, nas respostas públicas nem nos arquivos JavaScript enviados ao navegador. Nenhum envio ao GitHub foi feito.

As consultas saem do servidor Next.js, com filtro para o Brasil e atribuição Geoapify/OpenStreetMap na página. Endereços e CEPs com ou sem hífen foram testados com chamadas reais. A abreviação `s/n` é retirada apenas do texto enviado ao provedor, que a interpretava incorretamente; o endereço salvo permanece completo.

Na conta Geoapify, a chave foi identificada como exclusiva da demo e recebeu duas regras exatas de IP: os endereços públicos de saída IPv4 e IPv6 verificados na configuração inicial. Os valores estão apenas no arquivo privado `.demo/network.json`. Depois, o IPv6 mudou e passou a ser recusado pelo provedor, enquanto o IPv4 continuou autorizado.

A correção mantém a chave e essas restrições intactas. Somente a requisição HTTPS à Geoapify usa `family: 4`, pelo cliente nativo do Node, com o mesmo limite de oito segundos e validação TLS. Nenhum agente global, ordem de DNS, configuração do Windows ou outra integração foi alterado.

Esse modelo segue a [orientação oficial da Geoapify para aplicações no servidor](https://myprojects.geoapify.com/help/api-keys/). Filtros de HTTP Referer e Origin ficaram vazios porque as consultas não partem do navegador e este servidor não envia esses cabeçalhos à Geoapify. A configuração de CORS não substitui restrição de acesso.

**Ao trocar de rede, VPN ou IP público IPv4:** confira se a saída IPv4 continua autorizada antes de apresentar. Mudanças de IPv6 não afetam mais esta conexão. Se o IPv4 mudar, a autorização da nova saída precisa ser tratada separadamente; não remova as restrições. Uma futura hospedagem deverá usar outra chave e os IPs do servidor definitivo.

Se o serviço ficar indisponível, a página apresenta mensagem própria e permite tentar novamente ou usar localização. O modo ilustrativo sem chave continua disponível para os CEPs exatos dos seis exemplos; ele não é usado como substituto silencioso quando uma consulta real falha.

A localização do navegador é solicitada apenas ao clicar no botão. Sua disponibilidade depende da permissão, do dispositivo e do contexto seguro. Endereços pesquisados e coordenadas do visitante não são persistidos pela aplicação; buscas são enviadas no corpo da requisição, sem dados de localização na URL.

## Verificações

```powershell
npm test
npm run test:integration
npm run test:live
npm run typecheck
npm run lint
npm run build
```

Os testes de integração exigem o site em http://127.0.0.1:3218 e o banco local em execução. Criam e removem somente cadastros descartáveis próprios. `test:live` exige a chave configurada e faz dez consultas reais ao provedor. Não limpe tabelas nem use `docker compose down -v`: isso apagaria o volume da demo.

O preparo do banco inclui também a tabela já prevista para os formulários de Contato e Revenda. A persistência desses dois fluxos foi testada com dados fictícios e removida após a conferência. O código desses formulários grava no banco local; não envia e-mail ou WhatsApp.

As sessões expiram em oito horas. O login e a busca têm limites locais de tentativas. Esta versão foi preparada para uma máquina e um administrador; publicação, múltiplos processos, hospedagem, revisão de privacidade e autenticação de produção exigem avaliação antes da implantação definitiva.

## Arquivos principais

- `src/components/locator/`: formulários e lista pública.
- `src/lib/locator/`: validação, geocodificação, sessões e regras dos cadastros.
- `src/app/api/admin/`: operações protegidas.
- `migrations/0001_locator.sql`: tabela e restrições do localizador.
- `migrations/0002_demo_contact.sql`: estrutura dos formulários existentes no banco isolado.
- `compose.yaml`: PostgreSQL exclusivo da demo.
- `.env.local` e `.demo/`: arquivos privados desta máquina, ignorados pelo Git.

Nunca compartilhe `.env.local` ou `.demo/`. Esta entrega permanece no ambiente de demonstração e não foi publicada no site oficial. Os resultados e limites dos testes estão em `VALIDACAO.md`.

