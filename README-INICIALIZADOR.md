# Inicializador da demonstracao JP Pereira

De dois cliques em `Iniciar-JP-Pereira.cmd`. Ele abre `http://localhost:3218/onde-comprar` no navegador. Para encerrar o que foi iniciado por esse arquivo, de dois cliques em `Parar-JP-Pereira.cmd`.

O iniciador usa a compilacao Next.js existente e o banco PostgreSQL exclusivo da demo no Docker. O Docker Desktop precisa estar instalado. Se estiver fechado, o iniciador tentara abri-lo e aguardara ate dois minutos. O volume `locator_demo_data` guarda os cadastros entre encerramentos e reinicializacoes; o inicializador nunca usa `down -v` nem apaga o volume. Depois de desligar ou reiniciar o computador, de dois cliques novamente em `Iniciar-JP-Pereira.cmd`. Nao foi configurada inicializacao automatica do Windows.

Para criar um atalho na area de trabalho, clique com o botao direito em `Iniciar-JP-Pereira.cmd`, escolha **Mostrar mais opcoes > Enviar para > Area de trabalho (criar atalho)**. O atalho funciona de qualquer pasta porque os arquivos usam sua propria localizacao para encontrar o projeto. Voce pode criar outro atalho para `Parar-JP-Pereira.cmd` da mesma forma.

O painel administrativo fica em `http://localhost:3218/admin/pontos-de-venda`. As credenciais existentes estao no arquivo privado `.demo/ACESSO-LOCAL.txt`; nao compartilhe esse arquivo. A busca livre por CEP ou endereco usa Geoapify e requer internet e uma chave valida ja configurada em `.env.local`. Os atalhos Centro, Votorantim e Itu estao na pagina publica.

Problemas comuns:

- **Docker Desktop nao responde:** abra o Docker Desktop, espere o mecanismo iniciar e execute o arquivo novamente.
- **Banco nao fica saudavel:** confira o estado do Docker Desktop e se a porta local 55439 esta livre. Os detalhes ficam nos logs do conteiner da demo.
- **Porta 3218 ocupada:** o arquivo nao encerra processos desconhecidos. Feche a aplicacao que usa a porta ou peca ajuda para identifica-la.
- **Compilacao ausente:** na pasta deste projeto, execute `npm run build` uma vez.
- **Dependencias ausentes:** na pasta deste projeto, execute `npm ci` uma vez.
- **Next.js nao inicia:** consulte `.demo/launcher.stderr.log` e execute `Parar-JP-Pereira.cmd` para limpar a tentativa registrada.
- **Busca Geoapify falha:** confirme internet e se o IPv4 publico atual ainda esta autorizado na configuracao da chave. Nao coloque a chave nos arquivos `.cmd`.

O arquivo `.demo/launcher-state.json` guarda apenas IDs e horarios de processos e do conteiner iniciados pela demo; nao contem senhas. O arquivo de parada confere esses dados antes de encerrar qualquer processo. Se a demo ja estiver funcionando antes do clique, o iniciador apenas abre a pagina; ele nao cria outra instancia nem toma posse do processo existente.
