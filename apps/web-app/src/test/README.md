# Plano de cobertura de testes — web-app

Ordem sugerida para chegar perto de **100% de cobertura** no web-app.

---

## Fase 1 — Base (já feito)

| # | Arquivo | Status |
|---|---------|--------|
| 1 | `lib/utils.ts` | ✅ |
| 2 | `services/avaliacaoDiagnosticaService.ts` | ✅ |
| 3 | `components/common/EmptyState.tsx` | ✅ |

---

## Fase 2 — Services (maior ROI, mock de API) ✅

| # | Arquivo | Status |
|---|---------|--------|
| 4 | `services/alunoService.ts` | ✅ |
| 5 | `services/escolasService.ts` | ✅ |
| 6 | `services/professorService.ts` | ✅ |
| 7 | `services/planejamentoService.ts` | ✅ |
| 8 | `services/blocosService.ts` | ✅ |
| 9 | `services/habilidadeService.ts` | ✅ |
| 10 | `services/estrategiasService.ts` | ✅ |
| 11 | `services/avaliacaoService.ts` | ✅ |

---

## Fase 3 — Stores (Zustand, sem DOM) ✅

| # | Arquivo | Status |
|---|---------|--------|
| 12 | `stores/themeStore.ts` | ✅ |
| 13 | `stores/toastStore.ts` | ✅ |
| 14 | `stores/avaliacaoWizardStore.ts` | ✅ |
| 14b | `stores/onboardingStore.ts` | ✅ |

---

## Fase 4 — Componentes UI (shadcn, pouco estado) ✅

| # | Arquivo | Status |
|---|---------|--------|
| 15 | `components/ui/button.tsx` | ✅ |
| 16 | `components/ui/input.tsx` | ✅ |
| 17 | `components/ui/card.tsx` | ✅ |
| 18 | `components/ui/badge.tsx` | ✅ |
| 19 | `components/ui/select.tsx` | ✅ |
| 20 | `components/ui/dialog.tsx` | ✅ |
| 21 | `components/ui/avatar.tsx` | ✅ |
| 22 | `components/ui/dropdown-menu.tsx` | ✅ |
| 23 | `components/ui/tabs.tsx` | ✅ |
| 24 | `components/ui/toast.tsx` | ✅ |

---

## Fase 5 — Componentes comuns ✅

| # | Arquivo | Status |
|---|---------|--------|
| 25 | `components/common/PageHeader.tsx` | ✅ |
| 26 | `components/common/SkeletonCard.tsx` | ✅ |
| 27 | `components/common/StepProgressBar.tsx` | ✅ |
| 28 | `components/common/LoadingScreen.tsx` | ✅ |

---

## Fase 6 — Hooks e context ✅

| # | Arquivo | Status |
|---|---------|--------|
| 29 | `hooks/useTheme.ts` | ✅ |
| 30 | `hooks/useToast.ts` | ✅ |
| 31 | `context/AuthContext.tsx` | ✅ |

---

## Fase 7 — Layout ✅

| # | Arquivo | Status |
|---|---------|--------|
| 32 | `components/layout/Sidebar.tsx` | ✅ |
| 33 | `components/layout/AppShell.tsx` | ✅ |

---

## Fase 8 — Rotas e guards ✅

| # | Arquivo | Status |
|---|---------|--------|
| 34 | `routes/PublicRoute.tsx` | ✅ |
| 35 | `routes/ProtectedRoute.tsx` | ✅ |
| 36 | `routes/index.tsx` | ✅ |

---

## Fase 9 — Páginas (mais complexas) ✅

**Nota:** Renderização completa não é testada devido a múltiplas instâncias de React no monorepo (Invalid hook call). Estratégia: schemas/helpers exportados + smoke tests (verificação de export).

| # | Arquivo | Status |
|---|---------|--------|
| 37 | `pages/auth/LoginPage.tsx` | ✅ schema + smoke |
| 38 | `pages/auth/RegisterPage.tsx` | ✅ schema + smoke |
| 39 | `pages/auth/ChangePasswordPage.tsx` | ✅ schema + smoke |
| 40 | `pages/dashboard/DashboardPage.tsx` | ✅ smoke |
| 41 | `pages/escola/EscolasPage.tsx` | ✅ schema + smoke |
| 42 | `pages/aluno/AlunosPage.tsx` | ✅ smoke |
| 43 | `pages/aluno/AlunoFormDialog.tsx` | ✅ smoke |
| 44 | `pages/aluno/AlunoProfilePage.tsx` | ✅ smoke |
| 45 | `pages/planejamento/PlanejamentosPage.tsx` | ✅ smoke |
| 46 | `pages/planejamento/PlanejamentoDetailPage.tsx` | ✅ smoke |
| 47 | `pages/avaliacao/AvaliacoesPage.tsx` | ✅ statusConfig + smoke |
| 48 | `pages/avaliacao/AvaliacaoWizardPage.tsx` | ✅ smoke |
| 49 | `pages/avaliacao/steps/WizardStep1Identificacao.tsx` | ✅ smoke |
| 50 | `pages/avaliacao/steps/WizardStep2Alunos.tsx` | ✅ smoke |
| 51 | `pages/avaliacao/steps/WizardStep3Areas.tsx` | ✅ smoke |
| 52 | `pages/avaliacao/steps/WizardStep4Preview.tsx` | ✅ smoke |
| 53 | `pages/relatorios/RelatoriosPage.tsx` | ✅ classifyPdi, computePercentual + smoke |
| 54 | `pages/professor/PerfilPage.tsx` | ✅ smoke |
| 54b | `pages/onboarding/OnboardingPage.tsx` | ✅ smoke |
| 54c | `components/onboarding/StoriesOnboarding.tsx` | ✅ smoke |

---

## Fase 10 — Entrada da aplicação ✅

| # | Arquivo | Status |
|---|---------|--------|
| 55 | `App.tsx` | ✅ smoke |
| 56 | `main.tsx` | ✅ bootstrap (dependências do mount) |

---

## Resumo

| Fases | Descrição |
|-------|-----------|
| **1–3** | Base para o resto (services e stores) |
| **4–5** | Componentes reutilizáveis, boa cobertura com pouco esforço |
| **6–8** | Hooks, context e layout, precisam de mocks |
| **9–10** | Páginas e App, mais setup e mais custo |

---

## Comandos

```bash
npm run test        # watch mode
npm run test:run    # execução única (CI)
npm run test:run -- --coverage   # com relatório de cobertura
```
