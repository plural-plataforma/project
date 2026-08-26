# Fase 6 — Relatórios Pedagógicos do AEE: Escopo e sprints

**Documento para:** alinhamento com a cliente, priorização e controle de escopo por sprint.
**Última atualização:** 25/08/2026
**Prazo comercial:** a definir com a cliente (este arquivo descreve **esforço técnico** e **ordem lógica**, não datas fixas).
**Fontes:** doc "Nova funcionalidade Plural: Relatórios Pedagógicos do AEE" (implementação) + modelo "RELATÓRIO PEDAGÓGICO DO ATENDIMENTO EDUCACIONAL ESPECIALIZADO" (template final, 15 seções) + respostas da cliente às dúvidas levantadas (25/08/2026).

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
