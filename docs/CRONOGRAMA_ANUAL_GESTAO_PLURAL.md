# Plural Plataforma — Cronograma de desenvolvimento (visão até 12 meses)

**Documento para:** gestão e cliente — visão de produto, prioridades e alinhamento de capacidade.  
**Referência de escopo pedagógico:** `ESCOPO_E_SPRINTS_PLURAL_PAEE.md`.  
**Última atualização:** abril/2026.

---

## 1. Acordo, capacidade e expectativa ao longo do período

**Duração inicial:** 12 meses (renovável ou revisável conforme contrato).

**Capacidade contratada (referência):** 40 horas por mês (~10 horas por semana). Isso **não permite** paralelizar no mesmo ritmo que um time em dedicação integral: o cronograma abaixo é uma **ordem lógica de prioridades**; prazos reais de cada bloco precisam ser calibrados em conjunto (incluindo outros desenvolvedores, se houver).

**Lógica do período (alinhamento comercial):**

- Nos **primeiros meses** a tendência é **mais volume de desenvolvimento** (novas peças, LP, base do produto).
- Depois, o trabalho tende a **refinamento, melhorias e estabilização**.
- O **faturamento** pode crescer com mais força a partir do **final do ano e início do seguinte**; o esforço inicial prepara terreno para essa fase.

Ou seja: concentra-se esforço no início útil; a maturidade do produto e da operação acompanha o tempo.

---

## 2. Papel combinado (escopo de atuação)

Dentro do período, o trabalho pode envolver, conforme priorização acordada:

- Desenvolvimento da **plataforma** (web-app, mobile quando aplicável).
- **Implementação de novas funcionalidades** e **melhorias/ajustes** contínuos.
- **Correções técnicas** e **suporte técnico** quando necessário.
- Desenvolvimento das **páginas institucionais** da Plural e da **landing page (LP)**.
- **SEO:** otimização e estrutura para ranqueamento nas buscas.
- **Performance** e **experiência de uso** da plataforma (e do site institucional, quando couber).

---

## 3. Ordem de prioridades (o que vem antes no cronograma)

| Ordem | Bloco | Observação |
|-------|--------|------------|
| **1ª** | **Landing page e site institucional** (incluindo base de SEO) | **Prioridade antes de tudo** o que está no escopo PAEE/plataforma abaixo — presença digital, conversão e descoberta na busca. |
| **2ª** | **MVP pedagógico** | Conforme `ESCOPO_E_SPRINTS_PLURAL_PAEE.md` (S1–S8): PAEE, cadastro, avaliação, estudo de caso, relato, etc. |
| **3ª** | **Fase plataforma** | Conta (esqueci senha, reset pelo admin com e-mail, etc.), logs para diagnóstico, auditoria de boas práticas — após MVP pedagógico estável. |
| **4ª** | **ADM** para gestão da cliente | Evolução contínua; reforço como “centro de gestão” conforme maturidade do produto. |

A **API** permanece o **backend único** de regra de negócio para **ADM** e **plataforma**; o trabalho nela distribui-se ao longo dos blocos acima, não como uma “fase isolada” depois do front.

---

## 4. Como o desenvolvimento está organizado (aplicações)

| Camada | Aplicação no repositório | Papel |
|--------|-------------------------|--------|
| **Institucional / LP** | A definir com o time (site de marketing ou rotas dedicadas) | Páginas públicas, LP, SEO — **prioridade 1** neste plano. |
| **Administrativo** | `apps/web` (ADM) | Gestão para a **cliente**: usuários, operação, o que for necessário para administrar sem depender só do desenvolvimento. |
| **Produto principal** | `apps/web-app` + `apps/mobile` | Experiência da **professora** — fluxo pedagógico. |
| **Regras de negócio** | `apps/api` | Um único backend para ADM e plataforma. |

---

## 5. Linha do tempo sugerida (até 1 ano)

A divisão abaixo é **lógica**, não um compromisso de datas. Com ~10 h/semana, **um trimestre no papel pode corresponder a mais tempo de calendário** se a LP e o institucional consumirem boa parte das horas no início.

### Trimestre 1 — Presença digital primeiro; arranque do produto

| Foco | Entrega em linguagem de negócio |
|------|----------------------------------|
| **LP e institucional** | Landing e páginas institucionais da Plural; estrutura técnica e de conteúdo pensada para **SEO**; performance e UX das páginas públicas. |
| **API / web-app / mobile** | Início do MVP pedagógico **após** ou **em paralelo mínimo** com a LP, conforme divisão de horas acordada — idealmente S1–S3 (base PAEE, cadastro, avaliação) quando a prioridade institucional permitir. |
| **ADM** | Somente o estritamente necessário para operação. |

### Trimestre 2 — Núcleo pedagógico: Estudo de caso e PAEE

| Foco | Entrega em linguagem de negócio |
|------|----------------------------------|
| **Web-app / mobile + API** | Estudo de caso e PAEE em fluxo completo (S4–S6). |
| **Institucional** | Iterações de SEO, novas seções ou ajustes conforme métricas e feedback. |
| **ADM** | Ajustes pontuais para gestão. |

### Trimestre 3 — Fechamento do MVP pedagógico + estabilização

| Foco | Entrega em linguagem de negócio |
|------|----------------------------------|
| **API / web-app / mobile** | Relato de atendimento, integração e hardening (S7–S8). |
| **ADM** | Suporte ao rollout (listas, status, demandas de go-live). |
| **Opcional** | Início da fase plataforma (conta, logs) se o MVP estiver estável. |

### Trimestre 4 — Plataforma madura, gestão e refinamento

| Foco | Entrega em linguagem de negócio |
|------|----------------------------------|
| **API** | Esqueci senha, reset pelo admin com e-mail, logs para diagnóstico, auditoria em ações sensíveis. |
| **Web-app / mobile** | Fluxos de conta alinhados ao backend. |
| **ADM** | Reforço como centro de gestão da cliente. |
| **Transversal** | Melhorias de performance e UX contínuas; refinamento pós-MVP. |

---

## 6. Relação com as sprints do documento de escopo (S1–S8)

O detalhamento técnico por sprint continua no arquivo de escopo:

| Sprint | Tema resumido |
|--------|----------------|
| S1 | PAEE base (migração, nomenclatura, exportações) |
| S2 | Cadastro do aluno enriquecido |
| S3 | Avaliação alimentando outros módulos |
| S4–S5 | Estudo de caso (API + interface + documento) |
| S6 | PAEE fluxo completo |
| S7 | Relato de atendimento |
| S8 | Integração, hardening, mobile, ajustes de ADM se necessário |

Com capacidade parcial, as S1–S8 podem se estender por **vários meses**; a **LP/institucional** pode **antecipar ou atrasar** o início efetivo de S1 conforme a priorização mensal de horas.

---

## 7. O que pode ficar para depois do “agora”

- **Esqueci senha**, **reset pelo admin**, **logs** e **auditoria** — após MVP pedagógico estável (fim do T3 ou T4, conforme ritmo).
- **ADM completo** — evolução por ondas; não como pré-requisito da LP.

---

## 8. Próximos passos úteis

1. Fechar **escopo da LP** (mensagem, seções, formulários, domínio) e **critérios mínimos de SEO** para a primeira versão.  
2. Definir **quanto das 40 h/mês** fica para **institucional + SEO** versus **produto (API + web-app)** no primeiro mês.  
3. Manter o `ESCOPO_E_SPRINTS_PLURAL_PAEE.md` como referência do **detalhe pedagógico**; este arquivo como **visão anual, prioridades e capacidade**.

---

### Changelog

| Data | Autor | Alteração |
|------|-------|-----------|
| 2026-04-16 | Time | Versão inicial — cronograma até 12 meses, três frentes (ADM, web-app, API) e priorização MVP pedagógico → fase plataforma. |
| 2026-04-16 | Time | Acordo 12 meses, 40 h/mês (~10 h/semana); LP e institucional como prioridade 1; papel combinado (produto, institucional, SEO, performance, suporte); narrativa de fases e ajuste de trimestres. |
