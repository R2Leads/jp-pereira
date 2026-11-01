# Deploy no subdomínio `deploy.jppereira.com.br`

Este procedimento prepara a aplicação Next.js no cPanel. Ele não substitui o WordPress, não muda DNS e não executa migrações nem grava dados no Supabase.

## Pré-requisitos da hospedagem

Confirme com a TurboCloud ou no cPanel:

- Node.js 22 e npm disponíveis para a conta.
- Application Manager/Node.js App com Passenger habilitado.
- Aplicação vinculada somente a `deploy.jppereira.com.br`.
- Inicialização do arquivo `server.mjs` e repasse da variável `PORT` atribuída pelo Passenger.
- Variáveis de ambiente configuráveis para a aplicação.
- Certificado HTTPS válido para o subdomínio.
- Memória e espaço suficientes para instalar dependências e gerar o build.

O Next.js 16 exige Node.js 20.9 ou superior; Node.js 22 atende à versão mínima. O cPanel só oferece Application Manager/Passenger se o provedor habilitar os recursos necessários. A aplicação usa um servidor Node.js e APIs do Next.js, não uma exportação estática.

## Arquivos e diretório

Envie e extraia `jp-pereira-deploy-2026-10-29-ready.zip` em um diretório privado da conta, por exemplo `~/apps/jp-pereira`. Não extraia em `public_html`.

O pacote contém código, imagens e vídeos do site, manifesto e lockfile npm, servidor `server.mjs`, script local para gerar credenciais administrativas, exemplo vazio de variáveis e este guia. Não inclui `.next`, `node_modules`, arquivos `.env` preenchidos, backups, dumps de banco, migrações nem scripts de carga de dados.

## Instalação e inicialização

No Terminal do cPanel, como o usuário da hospedagem:

```bash
cd ~/apps/jp-pereira
npm ci
npm run build
```

Cadastre a aplicação Node no modo Production e associe-a a `deploy.jppereira.com.br`, usando o diretório acima como raiz e `server.mjs` como arquivo de inicialização. Se o painel não oferecer um campo para o arquivo de inicialização, peça ao provedor para configurar o Passenger para executar `server.mjs`; não altere arquivos de configuração globais nem o Document Root do domínio principal.

O servidor lê `PORT` e `HOSTNAME` do ambiente. Deixe o cPanel/Passenger definir a porta. O build usa `next/font/google`; portanto, `npm run build` precisa conseguir baixar as fontes Google durante a instalação. Se a hospedagem bloquear essa conexão, interrompa e revise a estratégia de fontes antes de publicar.

## Variáveis da aplicação

Cadastre os valores no painel de ambiente da aplicação. Não coloque segredos no ZIP, em arquivos públicos ou em mensagens.

| Variável | Configuração necessária |
|---|---|
| `NODE_ENV` | `production` |
| `APP_ORIGIN` | `https://deploy.jppereira.com.br` |
| `DEMO_LOCAL_ONLY` | `false` |
| `DATABASE_URL` | URL autorizada do Supabase PostgreSQL já carregado, com TLS habilitado |
| `SESSION_SECRET` | Segredo aleatório forte, exclusivo da implantação |
| `ADMIN_USERNAME` | Usuário administrativo definido para esta implantação |
| `ADMIN_PASSWORD_HASH` | Hash gerado localmente com `npm run admin:hash`; não cadastre a senha em texto puro |
| `GEOAPIFY_API_KEY` | Chave restrita ao IP real de saída da aplicação, após confirmar esse IP |

`npm run admin:hash` solicita uma senha de pelo menos 12 caracteres e imprime o hash e um segredo de sessão. Execute-o somente em um terminal privado e cadastre os valores diretamente no cPanel. Não compartilhe a saída.

O IP de saída da aplicação ainda precisa ser conferido. Não use a chave Geoapify até confirmar que a restrição atual inclui esse IP. Não amplie a permissão da chave sem autorização.

## Banco de dados

O Supabase de produção já recebeu as migrações `0001` a `0003` e os dados. **Não execute** `npm run db:migrate`, importação, seed, exportação ou qualquer comando de escrita no banco durante este deploy.

## Validação depois da implantação

Faça esta validação somente no subdomínio:

1. Abra `https://deploy.jppereira.com.br` e confira as páginas principais, imagens e vídeos.
2. Acesse `/api/health`; o resultado esperado é HTTP 200 com `{"ok":true}`.
3. Em `/onde-comprar`, pesquise um CEP e uma cidade. Confira a localização retornada e os pontos ativos.
4. Confirme o raio inicial de 30 km, cinco resultados por página, a ação “Ver mais” e as opções de 50 e 100 km quando não houver resultados. Não devem aparecer opções acima de 100 km.
5. Verifique login e logout do painel administrativo e confirme que uma sessão sem autenticação não acessa os pontos administrativos.
6. Confira erros no log da aplicação cPanel e valide se a chamada Geoapify funciona com a restrição de IP ativa.

O localizador depende do acesso do servidor ao Supabase e, para busca por endereço/CEP, da chave e conectividade Geoapify. Não interprete uma resposta de saúde bem-sucedida como validação de todos esses fluxos.

## Reversão

Se houver falha, pare ou desabilite somente a aplicação vinculada a `deploy.jppereira.com.br`. O site WordPress principal permanece em `jppereira.com.br`; não restaure arquivos em `public_html`, não altere DNS e não restaure banco algum para reverter este deploy.
