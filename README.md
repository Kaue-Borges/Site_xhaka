# Site_xhaka

## Demonstração local

No PowerShell, na pasta deste projeto:

```powershell
$env:VITE_XHAKINHA_DEMO = 'true'
npm run dev
```

Abra o endereço local mostrado pelo Vite e clique em **Entrar na demonstração**. O mapa usa `public/sc-municipios.geojson` (295 municípios). Os quatro status iniciais são fictícios; edições e roteiros feitos na demonstração só existem na memória da aba e somem ao recarregar. Nenhuma operação é enviada ao Supabase.

Para sair do modo demo, pare o servidor e execute `Remove-Item Env:VITE_XHAKINHA_DEMO` antes de iniciar novamente. Se usou `.env.local`, remova a variável ou altere para `false`. Builds de produção mantêm o modo demo desligado mesmo se a variável estiver definida. Sem a futura autenticação real, a versão de produção mostra uma tela de acesso indisponível.

Consulte [docs/mysql-migration.md](docs/mysql-migration.md) para o inventário de dados e a preparação da migração.
