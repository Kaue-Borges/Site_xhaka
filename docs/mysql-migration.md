# Preparação para MySQL na Hostinger

Este documento descreve o código atual. Nenhuma conexão ou tabela MySQL foi criada.

## Dependências atuais do Supabase

| Local | Operação | Situação |
| --- | --- | --- |
| `src/lib/supabase.ts` | Cria cliente com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, agora somente quando necessário | Retorna `null` sem configuração ou no modo demo |
| `src/lib/store.ts` | `from("cities").upsert({ id, status, updated_at })` ao mudar status | Atualização da interface é imediata; falha remota é registrada e não derruba o React |
| `src/lib/testsupabase.ts` | `from("cities").select("*").limit(1)` | Diagnóstico não chamado pelas rotas; retorna erro controlado sem cliente |
| `package.json` | `@supabase/supabase-js` e `@supabase/ssr` | Dependências instaladas; `@supabase/ssr` não é usado pelo código atual |

O login anterior **não usava Supabase Auth**. Ele validava senhas fixas no cliente e persistia o usuário em `localStorage` (`xhakinha-auth-v1`). Esse mecanismo foi desativado; a chave antiga não é mais lida. Não existe implementação de `user_roles` no projeto.

## Dados que a aplicação usa

| Recurso | Fonte atual | Campos/uso |
| --- | --- | --- |
| Municípios e geometria | `public/sc-municipios.geojson` | 295 IDs IBGE, nome, região e polígonos; a geometria pode continuar estática |
| Cidade | Zustand + `localStorage` (`xhakinha-sc-v1`) | Status, datas, descrição, notas, links, restaurantes, hotéis, locais, atrações, contatos, checklist e histórico |
| Roteiros | Mesmo estado local | ID, nome e lista ordenada de IDs de cidades |
| Métricas do projeto | Mesmo estado local | Data inicial, quilômetros manuais e próxima gravação |
| Sessão demo | Memória da aba | Usuário e quatro cidades fictícias; não lê nem grava `localStorage` |

Hoje só o **status da cidade** tem escrita remota. Os outros dados ficam no navegador. Uma falha de escrita remota pode deixar o estado local diferente do banco; a futura API deve confirmar ou reverter alterações e mostrar o resultado ao usuário.

## Trabalho necessário na migração

1. Definir autenticação real no servidor, sessões seguras e permissões de `admin`, `editor` e `viewer`. A interface deve receber uma sessão validada pelo servidor; nenhuma senha ou credencial MySQL pode ir para variáveis `VITE_*` ou para o navegador.
2. Definir tabelas para cidades/status e detalhes, itens de checklist, histórico, roteiros com ordem das cidades e métricas do projeto. Usar os IDs do GeoJSON como chave de referência e planejar chaves estrangeiras e índices.
3. Criar uma API no servidor para leitura e atualização desses recursos. Validar entrada e permissões em cada operação, tratar indisponibilidade do banco e informar erros de salvamento na interface.
4. Decidir se dados reais já guardados em `xhakinha-sc-v1` serão importados. Fazer revisão e migração explícitas; não importar os exemplos do modo demo nem confiar na antiga chave de autenticação.
5. Substituir `getSupabase()` e o `upsert` em `store.ts` pela API, remover o diagnóstico Supabase e as dependências não usadas, e então habilitar o login de produção.

As credenciais, o host, a forma de hospedagem da API e o esquema final dependem da configuração futura da Hostinger.
