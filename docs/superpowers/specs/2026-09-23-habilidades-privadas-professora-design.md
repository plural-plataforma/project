# Habilidades privadas da professora — Design

## Contexto

Hoje `Habilidade` é um catálogo global, sem dono. Todas as professoras veem o mesmo
conjunto ao vincular habilidades ao PAEE. Este design permite que a professora crie
habilidades próprias, usadas no PAEE dela, visíveis somente para ela.

Problemas atuais relevantes:

- `HabilidadeService.Buscar()` devolve todas as habilidades, sem filtro por usuária.
- `HabilidadeService.Atualizar()` permite que qualquer `Professor` edite qualquer habilidade,
  inclusive as globais.
- `Cadastro` não devolve o objeto criado (`ServiceResponse<HabilidadeCadastroDTO>` sem objeto),
  então o frontend não consegue vincular a habilidade recém-criada.
- `VincularHabilidade`, `VincularHabilidadesLote` e `AtividadeService.SincronizarHabilidades`
  validam apenas que a habilidade existe, não quem é o dono.

## Decisões

- Habilidade criada pela professora é **privada**: só ela vê em qualquer listagem e só ela vincula.
- Habilidades existentes viram **globais** (`IdProfessor = null`), visíveis a todas. Admin continua criando globais.
- Professora só edita/desativa as **próprias**. Globais são somente leitura para ela.
- Visibilidade é imposta no **backend**. O frontend apenas reflete.
- Criação é **inline** nos seletores de habilidade (sem página nova).
- `Tipo` é **texto livre obrigatório**.
- "Desativar" = `Ativo = false`. Vínculos existentes com PAEE permanecem; a habilidade só some do seletor.

## Fora de escopo

- App mobile e admin `apps/web` (o contrato de `buscar` continua compatível; mobile passa a
  receber globais + próprias da professora logada).
- Página dedicada "Minhas habilidades".
- Compartilhar habilidade entre professoras.
- Testes backend C# (adiados por decisão, ver memória `backend-tests-deferred`).

## Backend (`apps/api`)

### Modelo e migration

`Models/Habilidade.cs`:

```csharp
public int? IdProfessor { get; set; }

[ForeignKey("IdProfessor")]
public Professor? Professor { get; set; }
```

`AppDbContext`: relacionamento opcional `Habilidade → Professor` com `OnDelete(DeleteBehavior.Cascade)`
seguindo o padrão de `Planejamento`, e índice em `IdProfessor`.

Migration nova (nome sugerido `HabilidadeIdProfessor`): adiciona coluna `IdProfessor` nullable,
índice e FK. Nenhum backfill: registros atuais ficam `null` (globais).
Seguindo a convenção do projeto, registrar o SQL correspondente em `docs/migrations-pendentes/`.

### DTOs

- `HabilidadeBuscarDTO`: novo campo `bool EhPropria` (`IdProfessor != null`).
- `HabilidadeCadastroDTO`: remove `[Required]` de `Id` (não faz sentido no cadastro; hoje força o cliente a enviar um id ignorado). Mantém `IdNivelEnsino`, `Tipo`, `Descricao` obrigatórios e `Resumo` opcional.
- `Cadastro` passa a responder `ServiceResponse<HabilidadeBuscarDTO>` com a habilidade criada.

### `HabilidadeService`

Assinaturas passam a receber `Usuario usuario`, como `PlanejamentoService` já faz.
Helper privado `EhAdmin(usuario)` via `UserManager<Usuario>.IsInRoleAsync`.

- `Buscar(usuario)`
  - Todos (inclusive Admin): `h.IdProfessor == null || h.IdProfessor == usuario.ProfessorId`, ou seja, globais + próprias. Admin não enxerga habilidade privada de professora.
  - `Ativo` continua sendo devolvido; o frontend já filtra.
- `Cadastro(dto, usuario)`
  - Professor: `IdProfessor = usuario.ProfessorId`.
  - Admin: `IdProfessor = null`.
  - Retorna o DTO da habilidade criada.
- `Atualizar(dto, usuario)`
  - Professor: só localiza habilidade com `IdProfessor == usuario.ProfessorId`; caso contrário
    `"Habilidade não encontrada."` (não revela existência).
  - Admin: globais e as próprias; nunca a privada de outra professora.

### Vínculos

Regra única: professora só usa habilidade global ou própria.
Extrair predicado reutilizável (ex.: método de extensão `HabilidadesVisiveisPara(usuario)` sobre
`IQueryable<Habilidade>`) usado em:

- `PlanejamentoService.VincularHabilidade` (busca da habilidade)
- `PlanejamentoService.VincularHabilidadesLote` (contagem de `encontradas`)
- `AtividadeService` sync de habilidades (query `_contexto.Habilidades.Where(...)`). A confirmar no plano
  quem chama esse endpoint (`AtividadesController`): se for só Admin, nada muda; se Professor também
  puder chamar, aplicar o mesmo predicado.

Habilidade privada de outra professora se comporta como inexistente
(`"Habilidade não encontrada."` / `"Uma ou mais habilidades não foram encontradas."`).

### Controller

`HabilidadeController` obtém o usuário logado como os outros controllers (`_usuario.GetUserAsync(User)`)
e repassa aos services. Rotas e roles inalteradas.

### Leitura de habilidades já vinculadas

`PlanejamentoBuscar*`, exportações DOCX/PDF, relatórios e
`SugestaoPaeePorHabilidadeHelper` leem habilidades já vinculadas ao PAEE da própria professora.
Sem filtro adicional nesses caminhos, apenas garantir que o vínculo só nasce com habilidade visível
(regra acima). Habilidade desativada (`Ativo = false`) continua aparecendo no PAEE onde já está vinculada.

## Frontend (`apps/web-app`)

### Serviço e tipos

`services/habilidadeService.ts`:

- `criarHabilidade(dados): Promise<Habilidade>` → `POST /Habilidade/cadastro`
- `atualizarHabilidade(dados): Promise<void>` → `PATCH /Habilidade/atualizar`

`types/habilidade.ts`: `Habilidade` ganha `ehPropria?: boolean` e `ativo?: boolean`.
Novos tipos para os payloads de criar/atualizar.

### Constante compartilhada

`NIVEL_ENSINO_MAP` está duplicado em `PlanejamentoDetailPage.tsx` e `PlanejamentosPage.tsx`.
Extrair para módulo compartilhado (`src/config/nivelEnsino.ts`, pasta `config/` já existente) e usar nos dois arquivos e no novo dialog.

### `HabilidadeFormDialog`

Novo componente em `pages/planejamento/`, usando o `Dialog` existente.
Campos: nível de ensino (select de `NIVEL_ENSINO_MAP`), tipo (texto obrigatório), descrição
(obrigatória), resumo (opcional). Modo criar e editar. Validação no cliente espelhando o DTO.

### Integração nos seletores

- `PlanejamentoDetailPage` (modal "Vincular habilidades"): botão "Nova habilidade". Ao criar,
  invalida `['habilidades']` e vincula automaticamente ao PAEE via `vincularHabilidadePlano`.
- `PlanejamentosPage` (passo Habilidades do wizard): botão "Nova habilidade". Ao criar,
  invalida `['habilidades']` e adiciona à seleção (`selectedHabilidades`).
- Itens com `ehPropria` mostram badge "Minha" e ações editar / desativar. Globais sem ações.
- Desativar chama `atualizarHabilidade({ id, ativo: false })` e invalida `['habilidades']`.
  Listas dos seletores excluem `ativo === false`.

Demais consumidores de `buscarHabilidades` (`RelatosPage`, `AvaliacaoDesempenhoPage`,
`criarPaeeAPartirDoEstudoDeCaso`) não mudam de código; passam a receber globais + próprias
automaticamente pelo filtro do backend.

### Erros e feedback

Mensagens do `ServiceResponse` exibidas pelo mecanismo de toast já usado nos modais
(`success` / erro). Mesmo padrão de `useMutation` da página.

## Riscos e cuidados

- **Segurança:** o filtro no backend é a garantia. Cobrir todos os pontos de vínculo
  (`Vincular*`, sync de atividade) para impedir uso de ID de habilidade privada alheia.
- **Migration em produção:** coluna nullable sem backfill, sem lock relevante. Deploy do backend
  antes do frontend é seguro (frontend novo depende de `ehPropria` e `cadastro` retornando objeto;
  frontend antigo ignora o campo novo).
- **Mobile:** passa a receber apenas globais + próprias. Sem mudança de contrato quebrante.
- **Duplicidade de nome:** não há unicidade em `Descricao`; não introduzir restrição agora.

## Verificação (comandos para a usuária rodar; não serão executados automaticamente)

- Backend: `dotnet ef migrations add HabilidadeIdProfessor` (revisão do SQL gerado) e `dotnet build`.
- Frontend web-app: typecheck, lint e testes existentes de `PlanejamentosPage` /
  `PlanejamentoDetailPage` / `habilidadeService`, mais casos novos para o dialog e para
  criação inline com vínculo automático.
- Manual: professora A cria habilidade; professora B não a vê em nenhum seletor nem consegue
  vincular por ID; A edita/desativa a própria; globais sem ações de edição; admin vê tudo.
