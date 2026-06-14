# Fase 4 — PAEE: Registro de implementação

> **Branch:** `staging`  
> **Data de encerramento:** 14/06/2026

---

## Subfases implementadas

### 4.1 — Migration e seed do catálogo de objetivos

**Contexto:** O PAEE precisava de sugestões pré-definidas de objetivos (curto, médio e longo prazo) populadas automaticamente ao criar um plano a partir de um estudo de caso.

**Arquivos criados/alterados:**
- `apps/api/Migrations/20260614213816_PaeeObjetivosCatalogo.cs` — migration que cria a tabela `paee_objetivos_catalogo` com coluna `codigo` (unique)
- `apps/api/Migrations/20260614213816_PaeeObjetivosCatalogo.Designer.cs` — arquivo designer corrigido manualmente para incluir `b.HasIndex("Codigo").IsUnique()`
- `apps/api/Migrations/AppDbContextModelSnapshot.cs` — snapshot atualizado manualmente com o mesmo índice
- `apps/api/Data/AppDbContext.cs` — adicionado `HasIndex(o => o.Codigo).IsUnique()` na configuração da entidade
- `apps/api/Data/SeedData/PaeeObjetivosCatalogoSeed.cs` — seed com objetivos padrão (curto/médio/longo)

**Como rodar a migration:**
```bash
cd apps/api
dotnet ef database update
```

---

### 4.2 — Endpoint `/Planejamento/objetivos-catalogo`

**Contexto:** Frontend precisa listar os objetivos do catálogo para o picker de objetivos.

**Arquivos:**
- `apps/api/Controllers/PlanejamentoController.cs` — endpoint GET `objetivos-catalogo`
- `apps/api/Services/PlanejamentoService.cs` — método `BuscarObjetivosCatalogo`
- `apps/web-app/src/services/planejamentoService.ts` — função `buscarObjetivosPaeeCatalogo`

---

### 4.3 — Tab "Objetivos" com picker do catálogo (`PlanejamentoObjetivosTab`)

**Contexto:** Aba do PAEE que permite ao professor definir/editar objetivos usando o catálogo ou texto livre.

**Arquivos:**
- `apps/web-app/src/pages/planejamento/PlanejamentoObjetivosTab.tsx` — componente extraído

---

### 4.4 — Tab "Revisão" (`PlanejamentoRevisaoTab`)

**Contexto:** Aba de prévia do documento PAEE antes da exportação.

**Arquivos:**
- `apps/web-app/src/pages/planejamento/PlanejamentoRevisaoTab.tsx` — componente extraído

---

### 4.5 — Remoção dos avisos "RASCUNHO AUTOMÁTICO" nos estudos de caso

**Contexto:** Os documentos gerados pela IA tinham disclaimers de rascunho que confundiam os usuários ao imprimir/exportar.

**Backend:**
- `apps/api/Services/EstudoDeCasoService.cs` — removidas as linhas que adicionavam `*** RASCUNHO AUTOMÁTICO ***` e o rodapé de rascunho no método `MontarTextoSimulado`. Mensagem de atualização alterada de "…rascunho simulado…" para "…documento…"

**Frontend:**
- `apps/web-app/src/lib/sanitizarTextoEstudoCaso.ts` — utilidade que filtra avisos legados de documentos já salvos no banco
- `apps/web-app/src/lib/exportEstudoCasoDocx.ts` — integra `sanitizarTextoEstudoCaso` antes da geração DOCX
- `apps/web-app/src/lib/exportEstudoCasoPdf.ts` — integra `sanitizarTextoEstudoCaso` antes da geração PDF
- `apps/web-app/src/lib/baixarEstudoCaso.ts` — integra `sanitizarTextoEstudoCaso`
- `apps/web-app/src/lib/baixarFusaoEstudoCasoPaee.ts` — integra `sanitizarTextoEstudoCaso`

---

### 4.6 — Visualizador moderno do estudo de caso (`EstudoCasoDocumentoViewer`)

**Contexto:** Substituição do `<pre>` por um componente estruturado com header da marca, seções numeradas e destaque de placeholders.

**Arquivos:**
- `apps/web-app/src/lib/parseEstudoCasoDocumento.ts` — parser que converte texto em objeto estruturado
- `apps/web-app/src/lib/sanitizarTextoEstudoCaso.test.ts` — testes unitários da sanitização
- `apps/web-app/src/lib/parseEstudoCasoDocumento.test.ts` — testes unitários do parser
- `apps/web-app/src/components/estudo-caso/EstudoCasoDocumentoViewer.tsx` — componente de exibição com cores da marca (`--color-primary: #276678`, `--color-amber: #FFBE33`)
- `apps/web-app/src/pages/estudo-caso/EstudoCasoDetalheDialog.tsx` — substituído `<pre>` pelo viewer; adicionado import de `useState`
- `apps/web-app/src/pages/estudo-caso/steps/EstudoCasoStep4Resultado.tsx` — substituído `<motion.pre>` pelo viewer

---

### 4.7 — CTA "Gerar PAEE" no perfil do aluno + limpeza de copy

**Contexto:** O perfil do aluno não tinha atalho para criar um PAEE a partir de um estudo concluído. Além disso, vários pontos da interface ainda usavam o termo "rascunho" em vez de "documento".

**CTA Gerar PAEE (`AlunoProfilePage`):**
- `apps/web-app/src/pages/aluno/AlunoProfilePage.tsx`:
  - Importa `criarPaeeAPartirDoEstudoDeCaso` e `estudoCasoEstaConcluidoAsync`
  - Importa `buscarEstudoCasoPorId`
  - Adiciona `gerarPaeeMutation` que valida o estudo, cria o PAEE e navega para o detalhe
  - Exibe botão "Gerar PAEE" (ícone Lightning) apenas para estudos com `possuiTextoSimulado = true` quando o aluno não tem nenhum PAEE
  - Badges atualizados: "Rascunho disponível" → "Documento gerado" / "Sem rascunho automático" → "Sem documento"

**Limpeza de copy (7 pontos):**

| Arquivo | Texto antigo | Texto novo |
|---|---|---|
| `EstudoCasoDetalheDialog.tsx` L132 | "O rascunho anterior foi removido…" | "O documento anterior foi removido…" |
| `EstudoCasoDetalheDialog.tsx` L228 | "…rascunho gerado)…" | "…documento gerado)…" |
| `EstudoCasoDetalheDialog.tsx` L283 | "…o rascunho simulado atual será removido…" | "…o documento gerado atual será removido…" |
| `EstudoCasoExcluirDialog.tsx` L33 | "…incluindo o rascunho simulado…" | "…incluindo o documento gerado…" |
| `EstudosCasoPage.tsx` L155–156 | "Rascunho disponível" / "Sem rascunho" | "Documento gerado" / "Sem documento" |
| `DocGeracaoAnimation.tsx` L20 | "Finalizando o rascunho…" | "Finalizando o documento…" |
| `EstudoDeCasoService.cs` L329 | "…rascunho simulado se precisar." | "…documento se precisar." |

---

### 4.8 — Extração das abas inline do `PlanejamentoDetailPage`

**Contexto:** O arquivo tinha 987 linhas com 3 abas (Visão Geral, Encontros, Assinatura) totalmente inline. Foram extraídas para componentes dedicados.

**Arquivos criados:**
- `apps/web-app/src/pages/planejamento/PlanejamentoVisaoGeralTab.tsx` — overview editável + grid Alunos/Habilidades/Estratégias/Critérios
- `apps/web-app/src/pages/planejamento/PlanejamentoEncontrosTab.tsx` — grade de encontros + sugestão de datas; exporta o tipo `LinhaPaeeEnc`
- `apps/web-app/src/pages/planejamento/PlanejamentoAssinaturaTab.tsx` — checkbox + nome + cargo

**`PlanejamentoDetailPage.tsx`** passou de ~987 para ~660 linhas. Estados e mutations compartilhados (sincronização com API) permanecem no pai e são passados como props tipadas.

---

## Estrutura de arquivos novos (Fase 4)

```
apps/
├── api/
│   ├── Data/
│   │   └── SeedData/PaeeObjetivosCatalogoSeed.cs
│   ├── Migrations/
│   │   ├── 20260614213816_PaeeObjetivosCatalogo.cs
│   │   ├── 20260614213816_PaeeObjetivosCatalogo.Designer.cs
│   │   └── AppDbContextModelSnapshot.cs (atualizado)
│   └── Services/
│       └── EstudoDeCasoService.cs (atualizado)
└── web-app/src/
    ├── components/
    │   └── estudo-caso/
    │       └── EstudoCasoDocumentoViewer.tsx
    ├── lib/
    │   ├── sanitizarTextoEstudoCaso.ts
    │   ├── sanitizarTextoEstudoCaso.test.ts
    │   ├── parseEstudoCasoDocumento.ts
    │   └── parseEstudoCasoDocumento.test.ts
    └── pages/
        ├── aluno/
        │   └── AlunoProfilePage.tsx (atualizado)
        ├── estudo-caso/
        │   ├── EstudoCasoDetalheDialog.tsx (atualizado)
        │   ├── EstudoCasoExcluirDialog.tsx (atualizado)
        │   ├── EstudosCasoPage.tsx (atualizado)
        │   └── steps/EstudoCasoStep4Resultado.tsx (atualizado)
        └── planejamento/
            ├── PlanejamentoDetailPage.tsx (refatorado)
            ├── PlanejamentoVisaoGeralTab.tsx (novo)
            ├── PlanejamentoEncontrosTab.tsx (novo)
            └── PlanejamentoAssinaturaTab.tsx (novo)
```

---

## Smoke test checklist

### Estudos de caso

- [ ] Criar novo estudo de caso e percorrer o wizard até o passo 4 (geração do documento)
- [ ] Verificar que o visualizador exibe header teal + stripe amber, seções numeradas, sem texto de "RASCUNHO"
- [ ] Abrir um estudo de caso existente (via `EstudoCasoDetalheDialog`) — validar que avisos de rascunho legados não aparecem
- [ ] Copiar texto via botão de clipboard — texto deve estar limpo (sem disclaimers)
- [ ] Exportar PDF e Word — nenhum aviso de rascunho deve aparecer
- [ ] Confirmar que todos os labels de badge dizem "Documento gerado" / "Sem documento" (não "Rascunho")

### Perfil do aluno

- [ ] Aluno com estudo concluído (`possuiTextoSimulado = true`) e sem PAEE → deve exibir botão "Gerar PAEE"
- [ ] Clicar em "Gerar PAEE" → spinner durante processamento → navega para o detalhe do PAEE criado
- [ ] Aluno com estudo mas com PAEE já existente → botão "Gerar PAEE" **não** deve aparecer
- [ ] Aluno com estudo sem documento (`possuiTextoSimulado = false`) → botão "Gerar PAEE" **não** deve aparecer

### PAEE — Detalhe

- [ ] Abrir PAEE e navegar por todas as 5 abas: Visão geral, Objetivos, Encontros, Assinatura, Revisão
- [ ] Editar dados básicos na aba Visão geral e salvar
- [ ] Vincular aluno, habilidade, estratégia e critério via modal
- [ ] Aba Encontros: gerar sugestão de datas, adicionar linha manual, salvar
- [ ] Aba Assinatura: marcar como assinado, preencher nome/cargo, salvar
- [ ] Aba Objetivos: selecionar objetivo do catálogo e/ou editar texto livre, salvar
- [ ] Baixar Word na aba Revisão

### Migration

- [ ] `dotnet ef database update` sem erros de `PendingModelChangesWarning`
- [ ] Tabela `paee_objetivos_catalogo` criada com índice único em `codigo`
- [ ] Seed populou pelo menos 3 registros (curto, médio, longo prazo)
