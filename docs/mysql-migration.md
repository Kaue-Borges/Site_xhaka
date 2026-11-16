# Migração para MySQL da Hostinger

## Inventário do projeto anterior

O login anterior usava credenciais fixas no frontend, sem Supabase Auth. Foi removido. O Supabase era usado apenas por `src/lib/store.ts` para `upsert` de `id`, `status` e `updated_at` na tabela `cities`; `src/lib/testsupabase.ts` fazia uma consulta diagnóstica não usada pela interface. As dependências `@supabase/supabase-js` e `@supabase/ssr` e ambos os arquivos foram removidos.

Antes desta migração, detalhes das cidades, checklist, histórico, roteiros e métricas ficavam em `localStorage` (`xhakinha-sc-v1`). Esses dados **não são importados automaticamente**: o navegador pode conter rascunhos antigos ou exemplos, sem origem confiável. A chave antiga de autenticação também não é lida. Se houver dados reais apenas em um navegador, exporte e revise manualmente antes de qualquer importação futura. O banco MySQL novo começa sem dados operacionais.

## Dados implementados

| Tabela | Conteúdo e relações |
| --- | --- |
| `users` | E-mail único, nome, hash `scrypt`, papel `admin`/`editor`/`viewer`, ativo. |
| `sessions` | Digest HMAC do token em cookie, usuário e expiração. FK para `users`. |
| `login_attempts` | Falhas por combinação de IP e e-mail, chave HMAC e bloqueio temporário. |
| `municipalities` | 295 IDs IBGE, nomes e regiões do GeoJSON estático. |
| `city_records` | Status, datas, descrições, links, produção e notas. FK para `municipalities`. |
| `city_checklist` | Itens ordenados por cidade, FK para `city_records`. |
| `city_history` | Até 50 entradas por cidade usadas na interface, FK para cidade e usuário. |
| `routes` / `route_cities` | Roteiros e municípios ordenados, com FKs e unicidade. |
| `project_meta` | Data de início, quilômetros manuais e próxima gravação; uma linha. |
| `schema_migrations` | Controle das migrations aplicadas pelo comando `db:migrate`. |

O mapa continua a ler `public/sc-municipios.geojson`, sem salvar polígonos no MySQL. `migrations/001_initial.sql` cria o esquema; `migrations/002_municipalities_corrigido.sql` copia os 295 municípios reais como referência de chaves estrangeiras. O arquivo corrigido em UTF-8 é o mesmo importado manualmente na Hostinger e seus nomes, regiões e IDs foram conferidos com o GeoJSON. Não há registros fictícios de produção.

`schema_migrations` é usado somente pelo comando manual `npm run db:migrate`. A API e o build não executam esse comando. Como as duas migrations já foram importadas pelo phpMyAdmin, não rode `db:migrate` nesse banco: a tabela de controle pode não refletir a importação manual e o comando tentaria aplicar os arquivos novamente. Para novas versões, revise e importe somente o SQL novo pelo phpMyAdmin, ou estabeleça primeiro um histórico de migrations consistente.

## API e permissões

| Método e rota | Finalidade | Papel |
| --- | --- | --- |
| `GET /api/health` | Verificar API e conexão MySQL | Público |
| `GET /api/auth/me` | Recuperar sessão válida | Público |
| `POST /api/auth/login` | Login com limitação de tentativas | Público |
| `POST /api/auth/logout` | Revogar sessão | Sessão se houver |
| `GET /api/state` | Cidades, roteiros e métricas | Qualquer usuário autenticado |
| `PUT /api/cities/:id` | Salvar estado da cidade, checklist e histórico | `admin`, `editor` |
| `PUT/DELETE /api/routes/:id` | Criar, editar ou remover roteiro | `admin`, `editor` |
| `PUT /api/meta` | Salvar métricas | `admin`, `editor` |
| `GET/POST /api/users` | Listar ou criar usuários | `admin` |

As alterações são validadas no servidor com Zod e gravadas em transações quando envolvem várias tabelas. O frontend atualiza a tela imediatamente e agrupa mudanças rápidas por recurso antes de salvar; ao sair, aguarda as gravações pendentes. Se a API falhar, recarrega o estado confirmado no banco e mostra uma mensagem. O demo usa apenas memória e não faz chamadas de escrita.

## Segurança e operação

- Senhas usam `scrypt` com salt aleatório. Sessões usam tokens aleatórios cujo digest HMAC é armazenado no MySQL; o token puro fica somente no cookie HttpOnly. O cookie é `Secure` em produção, `SameSite=Lax`, e expira após sete dias. Logout revoga o token no banco.
- A API exige HTTPS em produção, origem do mesmo domínio para operações de escrita e JSON. O proxy da Hostinger precisa enviar `X-Forwarded-Proto: https` para o Express. Não habilite CORS para outros domínios sem projeto específico de autenticação/CSRF.
- Cinco falhas de login dentro de 15 minutos bloqueiam aquela combinação de IP e e-mail por 15 minutos. O banco deve ter backups; sessões expiradas e tentativas antigas podem ser limpas em rotina de manutenção futura.
- Dados do banco e `SESSION_SECRET` são variáveis de servidor. Nenhum segredo usa `VITE_` ou entra no bundle. Configure `DB_HOST=127.0.0.1`, `DB_PORT=3306` e os valores reais fornecidos pela Hostinger; não os registre no Git.
- O primeiro administrador é criado somente após as migrations, por SQL gerado com senha digitada em prompt oculto (`user:first-sql`) ou por CLI conectada ao banco (`user:first`). Não existe senha padrão.
- O histórico atual é um registro de alterações visível e editável por usuários com papel de edição; ele não é um log de auditoria imutável.

## Testes e implantação

Use um banco **isolado** para rodar migrations e testes de integração. Não execute comandos de teste contra o banco operacional. No projeto local: `npx tsc --noEmit`, `npm run build`, `npm run test:api`, `npm run lint`. A API pode ser testada localmente com `node --env-file=.env.server.local server/index.mjs` apontando para um MySQL isolado. Sem banco isolado disponível, os testes automatizados cobrem validação de acesso, hash de senha, entrega de rotas/arquivos e ausência do demo no build, mas não confirmam uma conexão MySQL real.

Para configurar a Hostinger, siga [README.md](../README.md). Referências oficiais: [Node.js Web App na Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) e [MySQL com Node.js na Hostinger](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/).
