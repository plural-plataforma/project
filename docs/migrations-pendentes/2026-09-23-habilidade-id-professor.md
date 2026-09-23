# Migration pendente: `IdProfessor` em `habilidades`

Habilidade privada da professora. Coluna nullable, sem backfill: registros atuais ficam globais.
A migration é aplicada no startup (`context.Database.Migrate()` em `Program.cs`) ao subir `staging`/`production`.

## Gerar

```bash
cd apps/api
dotnet ef migrations add HabilidadeIdProfessor
```

## Conferir o arquivo gerado (`Up`)

Deve conter apenas, na tabela `habilidades`:

1. `AddColumn<int>` `idprofessor` (nullable)
2. `CreateIndex` em `idprofessor`
3. `AddForeignKey` para `professores` (`OnDelete: Cascade`)

Qualquer `DropColumn`/`RenameColumn` fora disso indica diff de outro modelo pendente: parar e revisar antes de aplicar.

## Ordem de deploy

Backend antes do frontend. Frontend antigo ignora `ehPropria`; frontend novo depende dele.
