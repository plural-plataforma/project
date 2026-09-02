# Fase 6 — Relatórios Pedagógicos do AEE: Escopo e sprints

**Documento para:** alinhamento com a cliente, priorização e controle de escopo por sprint.
**Última atualização:** 31/08/2026
**Prazo comercial:** a definir com a cliente (este arquivo descreve **esforço técnico** e **ordem lógica**, não datas fixas).
**Fontes:** doc "Nova funcionalidade Plural: Relatórios Pedagógicos do AEE" (implementação) + modelo "RELATÓRIO PEDAGÓGICO DO ATENDIMENTO EDUCACIONAL ESPECIALIZADO" (template final, 15 seções) + respostas da cliente às dúvidas levantadas (25/08/2026).

---

## 0. Status de implementação (atualizado em 26/08/2026)

**Branch:** `feature/fase-6-relatorios-pedagogicos` (criada a partir da `staging`).

**Concluído — S1 a S4 (backend apenas, nenhum frontend em `apps/web-app` foi tocado ainda):**

- **S1 — Base de dados:** `apps/api/Models/Relatorio.cs`, `apps/api/Models/RelatorioSecao.cs` (enums `RelatorioTipoPeriodo`, `RelatorioStatus`, `RelatorioSecaoChave` com as 14 chaves — Identificação fica de fora, é preenchida direto do cadastro na exportação). `TipoDocumentoIA.RelatorioPedagogico = 4` adicionado. Relacionamentos em `apps/api/Data/AppDbContext.cs`. Migration `apps/api/Migrations/20260826001632_AddRelatorioPedagogico.cs` (cria `relatorios_pedagogicos` e `relatorio_pedagogico_secoes` + seed do prompt inicial em `prompt_sistema_ia`). Vínculo `RelatoAtendimento.PlanejamentoId` passou a ser **obrigatório para registros novos** (`RelatoAtendimentoService.ValidarNegocioAsync`, parâmetro `exigirPlanejamento`, só `true` em `Cadastrar`) — não é `NOT NULL` no banco, registros antigos continuam válidos.
- **S2 — Levantamento automático:** `apps/api/Services/RelatorioService.cs` → `MontarInsumosAsync` agrega Aluno+Escola, Estudo de Caso mais recente, PAEEs vigentes no período (com habilidades/estratégias/objetivos), Relatos de Atendimento no período, Avaliações Diagnósticas no período. Endpoint `GET /api/Relatorio/preview-insumos?alunoId=&dataInicio=&dataFim=` retorna contagens e avisos por seção sem dado suficiente, sem gravar nada.
- **S3 — Geração via IA:** `MontarPromptRelatorio` monta um prompt único com todos os insumos + regra do período ≥ 3 meses pra seção Evolução (segmenta início/meio/fim) vs. < 3 meses (sintetiza sem segmentar). `GerarSecoesAsync` chama `IGeradorTextoIA` **uma única vez**, faz parse do JSON de resposta (tolera cercas ```json```), cria as 14 `RelatorioSecao` (seção sem dado = `null` da IA = "informação insuficiente", nunca texto inventado). `CriarAsync` (`POST /api/Relatorio/cadastro`) cria o relatório e já gera; se a IA falhar, o relatório fica salvo sem seções e pode ser reprocessado via `GerarNovamenteAsync` (`POST /api/Relatorio/{id}/gerar-novamente`) — **mas só enquanto não existir nenhuma seção ainda** (trava a regra de "sem regeneração por seção" depois da primeira geração bem-sucedida). Log em `GeracaoIALog` a cada tentativa.
- **S4 — Revisão/edição/status (backend):** `AtualizarSecaoAsync` (`PATCH /api/Relatorio/{id}/secoes`) edita `TextoEditado`/`NotasManuais` de uma seção, bloqueado se `Status == Finalizado`. `FinalizarAsync` (`POST /api/Relatorio/{id}/finalizar`) exige que já tenha sido gerado. `ReabrirAsync` (`POST /api/Relatorio/{id}/reabrir`) volta pra Rascunho **sobrescrevendo o mesmo registro** (sem versionamento, decisão da cliente). `BuscarPorIdAsync` (`GET /api/Relatorio/{id}`) retorna o relatório com as seções.

**Bug legado corrigido (não relacionado à feature):** `apps/api/Migrations/20251125025256_tabelasEstrategias.cs` readicionava a coluna `devealterarsenha` que `20251025140303_novoCampoUsuario.cs` já tinha criado — quebrava bootstrap de banco novo do zero. Corrigido removendo a `AddColumn`/`DropColumn` duplicada. **Atenção:** ao testar bootstrap completo em banco vazio local, apareceu pelo menos **mais um bug legado similar e não corrigido** (`20260219040542_FixProfessorUsuarioNavigation` recria um índice `ix_aspnetusers_professorid` que já existe) — não foi tratado por estar fora do escopo desta feature; só afeta bootstrap do zero, não os bancos reais de teste/prod (que já têm o histórico aplicado).

**Pendente antes de tudo:**
- ~~Rodar `dotnet ef database update` nos ambientes de teste/prod~~ — não é manual: `Program.cs` já chama `context.Database.Migrate()` no startup, a pipeline aplica sozinha ao fazer deploy desta branch. Só é preciso rodar manualmente se for testar em banco local (ver nota de ambiente abaixo).
- ~~Configurar o conteúdo real do prompt de sistema pra `TipoDocumentoIA.RelatorioPedagogico`~~ — feito em 29/08/2026 via migration `UpdatePromptSistemaIARelatorioPedagogico` (segue o mesmo padrão de `UpdatePromptSistemaIAPaee`/`UpdatePromptSistemaIAEstudoCasoFormato`): define papel, modelo social da deficiência, as 5 categorias de barreira, e o conteúdo esperado de cada uma das 14 seções do JSON. Build local validado (0 erro). **Falta rodar `dotnet ef database update` local pra aplicar as duas migrations pendentes (`AddRelatorioPedagogico` + `UpdatePromptSistemaIARelatorioPedagogico`) se for testar a geração via IA localmente** — ver comando na nota de ambiente abaixo.

**Nota de ambiente (dotnet ef):** este projeto pode não ter o .NET SDK instalado por padrão (só o runtime) — instale via `winget install --id Microsoft.DotNet.SDK.9`. Rode `dotnet tool restore` em `apps/api` antes de usar `dotnet ef` (é uma local tool). `Program.cs` exige várias env vars mesmo pra comandos de design-time que não tocam banco de verdade (`migrations add`): `JWT_SECRET`, `HOTTOK`, `GEMINI_API_KEY`, `HOTMART_CLIENT_ID`, `HOTMART_CLIENT_SECRET`, `PRODUCT_ID` bastam pra `migrations add`; para `database update` contra um Postgres real, adicione também `USER_ID`, `DB_PASSWORD`, `SERVER_URL`, `PORT_API` (a connection string base sempre usa esse template de placeholders, independente do `ASPNETCORE_ENVIRONMENT`). Valores fictícios servem — não é preciso segredo real pra rodar essas ferramentas.

**S4 frontend + criação (29/08/2026):** `apps/web-app` ganhou o primeiro código tocando a feature:
- `src/types/relatorio.ts` — tipos alinhados aos DTOs/enums da API (`RelatorioTipoPeriodo`, `RelatorioStatus`, `RelatorioSecaoChave` com rótulos das 14 seções).
- `src/services/relatorioService.ts` — client dos 7 endpoints do `RelatorioController` (preview-insumos, cadastro, buscar, gerar-novamente, atualizar seção, finalizar, reabrir). Cadastro e gerar-novamente tratam o caso de sucesso parcial (relatório salvo mas IA falhou) sem lançar erro, já que a API devolve o objeto mesmo com `sucesso: false` nesse caso.
- `src/pages/relatorio/NovoRelatorioDialog.tsx` — diálogo de criação (tipo de período, datas, prévia de insumos ao vivo via `preview-insumos`), plugado como card "Relatórios Pedagógicos" em `AlunoProfilePage` (mesmo padrão dos cards de PAEE/Estudo de caso). Ao gerar, navega pro relatório criado.
- `src/pages/relatorio/RelatorioDetailPage.tsx` — tela de revisão pedida na S4: as 14 seções em cards editáveis (`TextoEditado` + `NotasManuais`), badge de "informação insuficiente" por seção, bloqueio de edição quando `Finalizado`, botões Finalizar/Reabrir/Gerar novamente. Rota `/relatorios-pedagogicos/:id`.

**Decisão de escopo:** como a S5 (listagem por aluno) ainda não tem endpoint no backend, não há como listar relatórios já criados — só é possível chegar num relatório existente pela URL direta ou logo após criá-lo. O card em `AlunoProfilePage` deixa isso explícito pro usuário. Por esse mesmo motivo, **não** foi adicionada entrada no menu lateral (`Sidebar`/`PEDAGOGICAL_FLOW_STEPS`) — sem listagem, um item de menu apontaria pra uma página sem conteúdo próprio; entra junto da S5.

**Testes (29/08/2026):** `src/services/relatorioService.test.ts` cobre os 7 métodos do service (incluindo o caso de sucesso parcial do cadastro/gerar-novamente). `RelatorioDetailPage.test.tsx` e `NovoRelatorioDialog.test.tsx` são smoke tests (export check), seguindo o mesmo padrão já usado nas demais páginas do projeto (ex.: `PlanejamentoDetailPage.test.tsx`).

**Pendente:** rodar a suite e validar visualmente no navegador — não executado nesta sessão (sem `npm install`/dev server rodados, ver restrição de execução). Comandos: `npm install`, `npm run typecheck --workspace=@plural/web-app`, `npm run lint --workspace=@plural/web-app`, `npm run test:run --workspace=@plural/web-app`.

**S5 — listagem por aluno (29/08/2026, concluída):**
- Backend: `GET /api/Relatorio/listar?alunoId=&status=&dataInicio=&dataFim=` (`RelatorioController.Listar` → `RelatorioService.ListarAsync`), retorna `RelatorioResumoDTO` (sem as seções — payload leve), ordenado por `DataInicio` desc. Filtro de período é por sobreposição de intervalo (`DataFim >= dataInicio` e `DataInicio <= dataFim`), não exige exatidão de datas.
- Frontend: `listarRelatoriosPorAluno` em `relatorioService.ts` + testes. Card "Relatórios Pedagógicos" em `AlunoProfilePage` agora lista de verdade (filtro por status via `Select`, cada item com badge de status e botão "Abrir" pro `/relatorios-pedagogicos/:id`).
- Build da API validado (0 erro). Frontend não rodado nesta sessão (ver pendência de verificação acima).

**S5 — duplicação e export (31/08/2026, concluída):**
- Backend: `POST /api/Relatorio/{id}/duplicar` (`RelatorioController.Duplicar` → `RelatorioService.DuplicarAsync`) cria um novo relatório Rascunho pro mesmo aluno, com o período deslocado pra logo após o período original (mesma duração), **sem copiar seções** — decisão confirmada: texto sempre gerado do zero pela IA, a professora aciona "Gerar novamente" quando quiser. `RelatorioBuscarDTO` ganhou `AlunoDataNascimento`, `AlunoAno`, `EscolaNomeInstituicao`, `ProfessorNomeCompleto` (dados de identificação vindos direto do cadastro, sem passar por IA) pra alimentar o export.
- Frontend: `duplicarRelatorio` em `relatorioService.ts`. `src/lib/relatorioMetadados.ts` monta a seção de Identificação (fonte única, mesmo padrão de `estudoCasoMetadados.ts`). `src/lib/exportRelatorioDocx.ts` e `exportRelatorioPdf.ts` geram o documento com as 15 seções (Identificação + as 14 de `RelatorioSecaoChave`), espelhando `exportEstudoCasoDocx.ts`/`exportEstudoCasoPdf.ts`. Botões "Duplicar", "Baixar PDF" e "Baixar Word" em `RelatorioDetailPage` — export só aparece com o relatório **Finalizado**.
- Build da API e typecheck do frontend não rodados nesta sessão (ver restrição de execução).

**Validação contra os docs oficiais da cliente (31/08/2026):** a cliente respondeu as 10 dúvidas de escopo levantadas no discovery e enviou os dois documentos-fonte (`Nova funcionalidade Plural_ Relatórios Pedagógicos do AEE.docx` e o template `RELATÓRIO PEDAGÓGICO DO ATENDIMENTO EDUCACIONAL ESPECIALIZADO.docx`, lidos na íntegra nesta sessão). Todas as 10 respostas confirmam decisões já implementadas (vínculo obrigatório, reabrir sobrescreve, geração sem dado incompleto não bloqueia, evolução só segmenta com ≥3 meses, geração única sem regeneração por seção, sem exclusão — só Rascunho/Finalizado, funciona com dados históricos, duplicar é pro mesmo aluno/período seguinte). Conferindo a exportação contra o template oficial, corrigido nesta sessão:
- **Bloco de assinatura** (Local e data / Professor(a) do AEE / Assinatura) — faltava, adicionado no fim do docx e do pdf.
- **Seção 1 (Identificação)** — faltavam campos que o template pede: Idade (calculada), Organização do atendimento (Individual/Grupo, de `Aluno.TipoAtendimentoAee`), Frequência dos atendimentos e Carga horária (de `Aluno.FrequenciaSemanalAtendimento`/`DuracaoAtendimentoMinutos`). `RelatorioBuscarDTO` ganhou os 3 campos novos; `relatorioMetadados.ts` reescrito pra seguir a ordem e os rótulos exatos do template.
- **Nomes e numeração das 15 seções** — os rótulos de `RELATORIO_SECAO_LABELS` foram trocados pro texto literal do template (ex.: "Conclusão" → "Síntese conclusiva", "Motor e sensorial" → "Aspectos motores, sensoriais e de acessibilidade"); numeração 1–15 adicionada (`RELATORIO_SECAO_NUMERO`) nos títulos do export e nos cards da tela de revisão.
- **Prompt de sistema da IA** reforçado (mesma migration `UpdatePromptSistemaIARelatorioPedagogico`, ainda não aplicada em nenhum banco) com regras do doc original que faltavam: não presumir diagnóstico/causa clínica, diferenciar observação de interpretação, evitar julgamento de valor, e não escrever "sem dificuldade" pra `motor_sensorial` só por falta de registro (ausência de registro ≠ ausência da característica).

**Gap de escopo identificado e resolvido:** o doc original de funcionalidade (seções 2, 3 e 25) pede uma aba própria "Relatórios" no menu lateral, com listagem **entre alunos** (filtros por aluno/escola/ano/período/tipo) — hoje só existe listagem **por aluno**, dentro do perfil (`AlunoProfilePage`). Decisão confirmada com a cliente: fica pra Fase 7 (ver seção 5) — a listagem por aluno já cobre o MVP1.

**Itens de baixa prioridade, não bloqueantes:** rastreabilidade de fontes por seção (doc original item 19 — auditoria interna, não visível pra professora, útil mas não essencial sem regeneração por seção); ação "Imprimir" separada de Baixar PDF (o PDF já pode ser impresso direto pelo navegador).

**Ainda pendente:** validar o layout exato do export (fontes, espaçamento, eventual timbre/logotipo da escola) com a Morgana antes de liberar pra cliente — a estrutura de conteúdo agora segue o template linha a linha (validado end-to-end, ver abaixo), mas o *visual* (cores, fontes) segue o mesmo padrão já usado no export de Estudo de Caso, não o Word original da cliente.

**Verificação completa end-to-end (31/08/2026):** com autorização explícita, rodado nesta sessão: `npm run typecheck`/`lint`/`test:run` no web-app (244 testes passando; 6 falhas em 2 arquivos pré-existentes não relacionados — `professorService.test.ts`, `input.test.tsx`; relatório: 21/21 verde), `dotnet build` na API (0 erro), migrations `AddRelatorioPedagogico` + `UpdatePromptSistemaIARelatorioPedagogico` aplicadas no banco de dev (Supabase dev, separado de produção), e teste manual completo no navegador (API + web-app local, conta de teste "Plural Plataforma teste"):
- **Bug real encontrado e corrigido:** `MontarInsumosAsync` (`RelatorioService.cs`) quebrava com `System.ArgumentException: Cannot write DateTime with Kind=Unspecified to PostgreSQL type 'timestamp with time zone'` sempre que o aluno tinha Avaliação Diagnóstica no período — `DateOnly.ToDateTime()` gera `DateTimeKind.Unspecified` e a coluna `avaliacoes_diagnosticas.dataaplicacao` é `timestamptz`. Esse bug **bloqueava toda geração de relatório** pra qualquer aluno com avaliação diagnóstica no período (praticamente todos) — nunca tinha sido pego porque a suíte de testes não cobre a API e o fluxo nunca tinha sido exercitado no navegador. Corrigido com `DateTime.SpecifyKind(..., DateTimeKind.Utc)`, mesmo padrão já usado em `AvaliacaoDiagnosticaService.cs`. Pré-existente do S2, não introduzido nesta sessão — só foi pego porque desta vez o fluxo foi testado de ponta a ponta.
- **Fluxo completo validado com dado real** (aluna Beatriz Andrade Souza, Estudo de Caso + PAEE + 2 Avaliações + Relato no período): criar relatório → preview de insumos → geração via IA (Gemini, chamada real) → revisão das 14 seções → Finalizar → Baixar PDF → Baixar Word → Duplicar (via API, testado à parte pra não disparar o `window.confirm()` do navegador em automação) → Reabrir (idem). Tudo funcionou como esperado: PDF/Word batem exatamente com o template (15 seções numeradas, Identificação completa, bloco de assinatura), seção "Evolução" segmentou início/meio/fim corretamente (período de 7 meses, ≥3 meses), Duplicar criou relatório id novo com período deslocado (mesma duração) e sem seções, Reabrir voltou pra Rascunho preservando as 14 seções (sobrescreve, sem duplicar registro).

**Próximo passo:** validar layout visual do export com a Morgana — é a única pendência restante antes de considerar o MVP1 pronto pra cliente. Depois disso falta só a S6 (hardening: mais testes com alunos de dados históricos incompletos, regressão do fluxo Relato→PAEE, ajustes finais de UX).

---

## 1. Visão e resultado esperado

A plataforma passa a fechar o ciclo pedagógico do AEE com um documento consolidado por período:

```
Cadastro do aluno → Avaliação diagnóstica → Estudo de caso → PAEE → Relato de atendimento → Relatório Pedagógico
```

O **Relatório Pedagógico** é gerado por IA a partir de tudo que já está registrado para o aluno num período (semestral ou trimestral), organizado nas 15 seções do template da cliente, com revisão/edição manual da professora antes de finalizar.

**Resultado para a usuária:** menos trabalho manual pra montar o relatório de período, aproveitando o que ela já preenche no dia a dia (registros de atendimento, PAEE, estudo de caso), com liberdade de complementar manualmente onde a plataforma não tiver dado suficiente.

---

## 2. Arquitetura de produto (repositório)

| Aplicação | Papel |
|-----------|--------|
| `apps/web-app` | Onde a funcionalidade é construída — nova aba/tela "Relatórios" |
| `apps/api` | Novos modelos (`Relatorio`, `RelatorioSecao`), serviço de geração via IA, exports |
| `apps/mobile` | Fora do escopo desta fase (fluxo de geração/revisão é de tela cheia, melhor em desktop/tablet) |
| `apps/web` | Sem alteração nesta fase (coordenação/admin fica pra Fase 7, ver seção 5) |

---

## 3. Decisões já validadas com a cliente

| Tema | Decisão |
|------|---------|
| Vínculo Relato de Atendimento ↔ PAEE | Passa a ser **obrigatório para registros novos** daqui pra frente. Registros antigos continuam com `PlanejamentoId` opcional (sem migração retroativa) — ver seção 4.5. |
| "Reabrir para edição" de relatório finalizado | **Sobrescreve** o mesmo relatório. Sem versionamento/histórico de versões. |
| Seção sem dado suficiente | Relatório pode ser gerado mesmo com cadastro incompleto (aluno/estudo de caso/PAEE/registros). Seção sem base vira **texto manual da professora** (a IA não inventa; sinaliza "informação insuficiente" e abre campo livre) — mesma regra de ouro já definida no doc de implementação da cliente. |
| Comparação temporal (seção "Evolução") | Só faz a divisão início/meio/fim quando o período for **≥ 3 meses**. Abaixo disso, gera síntese da evolução sem segmentar em fases. |
| Geração por IA | **Uma chamada gera o relatório inteiro** (15 seções via JSON estruturado). **Sem regeneração por seção** — a professora edita manualmente o que quiser ajustar. Reduz custo de IA (que é da cliente) e simplifica o fluxo. |
| Exclusão de relatório | **Sem ação de excluir**, nem rascunho nem finalizado. Só os status Rascunho/Finalizado. |
| Dados históricos | O relatório precisa funcionar também para alunos com registros antigos (anteriores a esta funcionalidade, possivelmente menos estruturados). |
| Ação "Duplicar" | Duplica para o **mesmo aluno**, como base pro próximo período (não é template pra outro aluno). |
| Loop "sugestão de revisão do PAEE" a partir do relatório | Confirmado pela cliente (31/08/2026) que fica fora do MVP1 — mantido na Fase 7 (ver seção 5). Recomendação técnica que ela pediu: MVP1 já é grande (15 seções, vínculo obrigatório, dados históricos, export fiel ao template); acoplar ao PAEE agora aumenta risco de atraso e faz mais sentido com dado real de uso do relatório em produção. |
| Acesso de coordenação/gestão escolar | Cliente confirmou (31/08/2026) que coordenação **deve** ter acesso — deixa de ser hipótese e vira necessidade confirmada, mas continua fora do MVP1 (Fase 7): hoje o sistema só tem os papéis `Professor`/`Admin`, não existe usuário vinculado à escola vendo dados de vários professores — é uma camada de controle de acesso nova, não específica de Relatórios. |

---

## 4. Escopo funcional consolidado (MVP1)

### 4.1 Novo modelo de dados

- `reports` (`Relatorio`): `Id`, `AlunoId`, `ProfessorId`, `EscolaId`, `DataInicio`, `DataFim`, `TipoRelatorio` (semestral/trimestral), `Status` (Rascunho/Finalizado), `CreatedAt`, `UpdatedAt`.
- `report_sections` (`RelatorioSecao`): `Id`, `RelatorioId`, `SecaoChave` (contextualizacao, potencialidades, comunicacao, cognicao, academico, interacao, autonomia, motor_sensorial, barreiras, estrategias, evolucao, necessidades, encaminhamentos, conclusao — 14 chaves + identificação tratada à parte, ver 4.3), `TextoGerado`, `TextoEditado`, `NotasManuais`, `GeradoEm`, `EditadoEm`.
- Novo valor no enum `TipoDocumentoIA`: `RelatorioPedagogico`.
- Nova entrada em `PromptSistemaIA` para `RelatorioPedagogico` (prompt configurável, mesmo padrão já usado pelos outros documentos).
- Novo registro em `GeracaoIALog` a cada geração/[edição manual não gera log de IA].

**Critérios de aceite:**
- [ ] Migration cria as duas tabelas com FKs pra `Aluno`, `Professor`, `Escola`.
- [ ] `TipoDocumentoIA.RelatorioPedagogico` adicionado sem quebrar os valores existentes (enum aditivo).

---

### 4.2 Levantamento automático de dados por período

Fonte de dados por seção, cruzando `DataInicio`/`DataFim` do relatório com:

- `Aluno` — identificação (nome, escola, ano, frequência/tipo de atendimento).
- `EstudoDeCaso` + `EstudoDeCasoItemEixo` — potencialidades, necessidades, contextualização, barreiras.
- `Planejamento` (PAEE) — objetivos, habilidades, estratégias vigentes no período.
- `RelatoAtendimento` filtrados por `DataSessao` no período — presença, avanços/dificuldades (`AvancosJson`/`DificuldadesJson`), base principal pra Evolução e Estratégias (conforme observação da própria cliente no doc original).
- `AvaliacaoDiagnostica` com `DataAplicacao` no período — aspectos acadêmicos/cognitivos.

**Critérios de aceite:**
- [ ] Tela de criação: seleção de aluno + período → preview do que foi encontrado por fonte antes de gerar (transparência do que vai virar insumo da IA).
- [ ] Ausência de uma fonte não bloqueia a geração (ver regra da seção 3).

---

### 4.3 Geração via IA (15 seções, uma chamada)

- Serviço novo (`RelatorioService`, seguindo o padrão de `RelatoAtendimentoService.GerarTextoIAAsync`) monta um único prompt com todos os dados levantados e pede retorno estruturado (JSON com as 14 chaves de seção + identificação).
- Reaproveita `IGeradorTextoIA` / `GeminiGeradorTextoIA` já existente — sem novo provider.
- Regra de ouro aplicada no prompt: nunca declarar algo sobre o aluno que não esteja nos dados enviados; seção sem base retorna marcador de "informação insuficiente" em vez de texto genérico.
- Grava `GeracaoIALog` (1 log por geração de relatório, não por seção).

**Critérios de aceite:**
- [ ] 1 chamada de IA por geração de relatório (não 15).
- [ ] Seção sem dado vem marcada para preenchimento manual, nunca com texto inventado.

---

### 4.4 Revisão, edição e status

- Tela de revisão com as 15 seções, texto gerado editável por seção (`TextoEditado`), campo de notas manuais.
- Sem botão de regeneração por seção (decisão da seção 3).
- Fluxo de status: Rascunho → Finalizado, com ação "Reabrir para edição" que volta pra Rascunho e permite sobrescrever.
- Relatório finalizado é fotografia do período: dados subjacentes podem mudar depois sem afetar o relatório já finalizado (não há recálculo automático).

**Critérios de aceite:**
- [ ] Editar e salvar seção não perde as demais.
- [ ] Finalizar trava edição até "Reabrir".
- [ ] Reabrir sobrescreve o mesmo `RelatorioId` (sem criar novo registro).

---

### 4.5 Vínculo obrigatório Relato de Atendimento → PAEE

- Validação no backend: novo `RelatoAtendimento` exige `PlanejamentoId` preenchido.
- `PlanejamentoId` continua nullable no banco (não quebra registros antigos, mantém suporte a dados históricos — seção 3).

**Critérios de aceite:**
- [ ] Criar relato novo sem `PlanejamentoId` retorna erro de validação.
- [ ] Relatos antigos sem `PlanejamentoId` continuam consultáveis e entram no levantamento de dados do relatório (com o que tiverem disponível).

---

### 4.6 Listagem, duplicação e export

- Nova aba "Relatórios" (por aluno): lista com filtros por período/status.
- Ação "Duplicar": cria novo relatório (Rascunho) pro mesmo aluno, período seguinte, sem copiar texto gerado (só reaproveita como ponto de partida pra nova geração — a definir em detalhe na sprint de UI: se copia texto anterior editável ou já dispara nova geração).
- Export Word/PDF do relatório finalizado, seguindo o layout do template de 15 seções da cliente (mesmo padrão de export já usado em Estudo de Caso/PAEE).

**Critérios de aceite:**
- [ ] Export reflete exatamente as 15 seções do template, incluindo bloco de assinatura (local/data, professor(a), assinatura) — mesmo padrão já usado no PAEE (`DocumentoDeclaradoAssinado`).
- [ ] Duplicar não afeta o relatório original.

---

## 5. Fora do MVP1 — fica para Fase 7

| Item | Motivo |
|------|--------|
| **Loop "sugestão de revisão do PAEE"** a partir do relatório finalizado | MVP1 já é grande (geração 15 seções, vínculo obrigatório, dados históricos, export). Acoplar ao PAEE agora aumenta o acoplamento entre módulos e o risco de atraso. Faz mais sentido com dado real de uso do relatório em produção. |
| **Acesso de coordenação/gestão escolar** | Hoje o sistema só tem os papéis `Professor` e `Admin` (via Identity) — não existe usuário vinculado à escola que enxergue dados de vários professores. Isso é uma camada de controle de acesso nova, não específica de Relatórios — vale nascer como feature própria, pensada pra escola como um todo. |
| **Aba "Relatórios" própria no menu lateral, com listagem cross-aluno** (filtros por aluno/escola/ano/período/tipo — pedida no doc original de funcionalidade, seções 2/3/25) | Decisão confirmada com a cliente (31/08/2026): fica pra depois. A listagem por aluno (dentro do perfil, já entregue na S5) cobre o uso real do MVP1. Endpoint sem `alunoId` obrigatório + filtros por escola/ano/tipo + página nova + entrada no `Sidebar`/`PEDAGOGICAL_FLOW_STEPS` é esforço não trivial, melhor avaliar depois de validar o uso real do relatório por aluno. |

---

## 6. Mapa de dependências

```text
Relato de Atendimento (vínculo PAEE obrigatório)
        ↓
Modelo de dados do Relatório (reports / report_sections)
        ↓
Levantamento automático por período (Aluno + Estudo de Caso + PAEE + Relatos + Avaliação)
        ↓
Geração via IA (1 chamada, 15 seções)
        ↓
Revisão/edição + status (Rascunho → Finalizado)
        ↓
Listagem, duplicação, export
```

---

## 7. Sprints sugeridas (escopo por timebox)

Cada sprint assume **~2 semanas**; quantidade total e datas são **negociáveis com a cliente**.

| Sprint | Foco | Entregas principais |
|--------|------|---------------------|
| **S1** | Base de dados | Migrations `reports`/`report_sections`; enum `RelatorioPedagogico`; validação de vínculo obrigatório Relato→PAEE; `PromptSistemaIA` inicial. |
| **S2** | Levantamento de dados | Serviço que agrega Aluno + Estudo de Caso + PAEE + Relatos + Avaliação por período; preview de fontes encontradas. |
| **S3** | Geração via IA | Prompt único das 15 seções; parsing do JSON estruturado; regra "informação insuficiente"; log em `GeracaoIALog`. |
| **S4** | Tela de revisão/edição | 15 seções editáveis; notas manuais; fluxo Rascunho → Finalizado → Reabrir (sobrescreve). |
| **S5** | Listagem, duplicação e export | Aba "Relatórios" por aluno; ação Duplicar; export Word/PDF no layout do template. |
| **S6** | Hardening | Testes com alunos de dados históricos incompletos; regressão do fluxo Relato→PAEE; ajustes finais de UX na revisão. |

**Definição de pronto (DoD) sugerida por sprint:** código revisado, migrations aplicáveis em ambiente de homologação, checklist de regressão do fluxo tocado, sem erros críticos de lint/build nos apps alterados.

---

## 8. Riscos e premissas

| Risco | Mitigação |
|-------|-----------|
| Alunos com poucos registros (professora nova na plataforma) geram relatório "vazio" | Seções sem dado viram campo manual em vez de bloquear a geração (regra já validada, seção 3). |
| Custo de IA por geração de relatório grande (15 seções num prompt só) | Monitorar tokens/custo real via `GeracaoIALog`; ajustar prompt se necessário antes de liberar geral. |
| Ambiguidade na ação "Duplicar" (copia texto ou só estrutura) | Definir em conjunto com UI na S5; default sugerido: copia estrutura/período seguinte, texto sempre gerado do zero. |
| Export não bater exatamente com o template Word da cliente | Validar layout com a Morgana antes de fechar a S5 (mesmo processo já usado nos outros exports). |

---

## 9. Glossário rápido

| Termo | Significado |
|-------|-------------|
| **Relatório Pedagógico** | Documento consolidado por período (semestral/trimestral), com 15 seções, gerado a partir dos dados já registrados do aluno. |
| **Seção com informação insuficiente** | Seção sem dado suficiente na plataforma para geração por IA; fica como campo manual pra professora preencher. |
| **Fotografia do período** | Princípio de que o relatório finalizado não muda mesmo que os dados subjacentes sejam alterados depois. |

---

## 10. Próximos passos (fora deste arquivo)

1. Validar layout de export (Word/PDF) com a Morgana antes de fechar a S5.
2. Confirmar com a cliente o comportamento exato da ação "Duplicar" (seção 8) durante a S5.
3. Ao final do MVP1, revisar com a cliente se o loop PAEE e o acesso de coordenação (Fase 7) seguem como planejado.

---

### Changelog

| Data | Autor | Alteração |
|------|-------|-----------|
| 2026-08-25 | Time | Versão inicial — consolidação dos dois documentos da cliente e das respostas às dúvidas levantadas. |
| 2026-08-31 | Time | S5 concluída: duplicação (decisão confirmada — só estrutura, sem texto) e export Word/PDF das 15 seções. |
| 2026-08-31 | Time | Cliente respondeu discovery (10 perguntas) e enviou os 2 docs-fonte oficiais. Validação: export corrigido pra bater com o template (assinatura, campos de identificação, nomes/numeração das seções); prompt de IA reforçado. Gap de escopo identificado (aba "Relatórios" com listagem cross-aluno) — confirmado com a cliente que fica pra Fase 7. |
| 2026-08-31 | Time | Verificação end-to-end completa: build/typecheck/lint/test rodados, migrations aplicadas em dev, fluxo testado no navegador com dado real. Bug real encontrado e corrigido (DateTime Kind=Unspecified quebrava geração pra alunos com Avaliação Diagnóstica no período — pré-existente do S2). MVP1 funcionalmente completo; falta só validação visual com a Morgana. |
