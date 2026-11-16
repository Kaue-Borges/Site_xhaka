# Xhakinha por Santa Catarina

Frontend React/Vite e API Express/MySQL no mesmo domínio. O banco novo começa vazio: nenhuma informação do Supabase excluído é recuperada automaticamente.

## Desenvolvimento local

```powershell
npm ci
$env:VITE_XHAKINHA_DEMO = 'true'
npm run dev
```

Abra a URL do Vite. O modo demo existe somente no servidor de desenvolvimento, usa dados fictícios na memória da aba e não chama a API. Para desligá-lo, pare o Vite e execute `Remove-Item Env:VITE_XHAKINHA_DEMO`. Nenhum build de produção oferece entrada demo.

O Vite encaminha `/api` para `127.0.0.1:3001` quando uma API de desenvolvimento estiver disponível. O modo demo não precisa de banco.

## Build e execução

```powershell
npm ci
npm run build
npm start
```

`npm run build` gera `dist/`. `npm start` inicia Express, que serve `dist/`, a API `/api` e o fallback das rotas da SPA. A porta vem de `PORT`. O servidor exige `DB_NAME`, `DB_USER`, `DB_PASSWORD` e `SESSION_SECRET` (mínimo 32 caracteres). Em produção, a API exige HTTPS atrás do proxy da hospedagem e emite cookie de sessão HttpOnly, Secure e SameSite=Lax. Não exponha variáveis de banco com prefixo `VITE_`.

## Preparação da Hostinger

1. Envie o ZIP do projeto completo, ou publique esta versão revisada na branch do GitHub e escolha essa branch no painel. Crie o site como **Web App Node.js** associado a `xhaka.somoskry.com`, em um plano que suporte Node.js. Selecione Node.js 24.x, gerenciador `npm`, comando de build `npm run build`, diretório de saída `dist` e arquivo de entrada `server/index.mjs` (equivalente a `npm start`). A Hostinger instala as dependências durante o deploy; `npm ci` é o comando equivalente para instalação manual. A aplicação precisa executar como servidor Node.js; a opção de hospedagem estática de `dist` não disponibiliza a API. Confirme esses caminhos na tela de revisão antes de publicar.
2. O banco `u218968362_xhaka_db` já existe e recebeu manualmente `migrations/001_initial.sql` e `migrations/002_municipalities_corrigido.sql`; o usuário confirmou 295 registros. Não execute esses arquivos novamente. Copie o usuário MySQL completo, incluindo o prefixo dado pela Hostinger. Gere `SESSION_SECRET` com `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` e guarde o resultado somente no painel da hospedagem. Configure `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_NAME=u218968362_xhaka_db`, `DB_USER`, `DB_PASSWORD`, `SESSION_SECRET` e `NODE_ENV=production` nas variáveis do **servidor**. Use `PORT` fornecida pela Hostinger; o código aceita a porta injetada automaticamente.
3. Não configure `db:migrate` nem `db:seed-municipalities` como comando de build ou inicialização. `npm start` não executa migrations. A tabela `schema_migrations` pertence apenas ao migrador manual; ela pode estar vazia após a importação via phpMyAdmin. Assim, não rode `npm run db:migrate` nesse banco existente. Guarde `migrations/002_municipalities_corrigido.sql` em UTF-8 para instalações futuras.
4. Crie o primeiro administrador em um terminal local com `npm run user:first-sql -- email@dominio.com "Nome"`. Digite e confirme uma senha forte no prompt oculto. Cole a única instrução SQL gerada no phpMyAdmin. Ela só insere o usuário se a tabela `users` estiver vazia. Não salve a instrução no Git, nem em uma pasta pública. A senha não aparece no SQL: somente seu hash. Após criar o administrador, remova qualquer cópia temporária do SQL.
5. Após o deploy, confirme `https://xhaka.somoskry.com/api/health` (resposta `{ "ok": true }`), o login, `/mapa`, `/roteiros`, `/timeline`, o GeoJSON e as imagens. Se `/api/health` falhar, confira as variáveis do servidor, o acesso da aplicação ao MySQL e se o proxy encaminha `X-Forwarded-Proto: https`. Use HTTPS no domínio final. Antes de conectar a Hostinger ao GitHub, desconecte a integração antiga do Vercel se não quiser que próximos pushes também tentem publicar lá.

O usuário `admin` pode criar contas adicionais pela API `POST /api/users`. Os papéis `admin` e `editor` podem editar dados; `viewer` só lê. Não há usuários ou senhas embutidos no frontend.

Detalhes do inventário, tabelas e limites de migração: [docs/mysql-migration.md](docs/mysql-migration.md).

Referências da Hostinger: [publicação de Web Apps Node.js](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) e [conexão MySQL local para Node.js](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/).
