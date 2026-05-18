# Plural Plataforma — Escopo de Evolução Pedagógica (PDI → PAEE)

**Documento para:** alinhamento com a cliente, priorização e controle de escopo por sprint.  
**Última atualização:** abril/2026  
**Prazo comercial:** a definir com a cliente (este arquivo descreve **esforço técnico** e **ordem lógica**, não datas fixas).

---

## 1. Visão e resultado esperado

A plataforma deixa de centralizar o **PDI** como documento isolado e passa a oferecer um **fluxo pedagógico integrado**:

1. **Cadastro do aluno** (dados gerais, atendimento AEE, perfil pedagógico)  
2. **Avaliação diagnóstica** (já existente — passa a alimentar outros módulos)  
3. **Estudo de caso** (novo — eixos estruturados, texto e documento gerados)  
4. **PAEE** (substitui o PDI — geração assistida a partir do cadastro, avaliação e estudo de caso)  
5. **Relato de atendimento** (novo — alinhado à frequência e ao planejamento)

**Resultado para a usuária:** documentação integrada, menos retrabalho, padronização e documentos prontos para impressão/compartilhamento.

---

## 2. Arquitetura de produto (repositório)

| Aplicação | Papel |
|-----------|--------|
| `apps/web-app` | Plataforma web **principal** da cliente (professoras) |
| `apps/mobile` | App mobile (mesmo público) |
| `apps/api` | Backend (.NET + EF Core + PostgreSQL) |
| `apps/web` | **Administrativo** — evoluir apenas onde o admin precise dos novos conceitos/dados |

**Regra de escopo:** priorizar **web-app + api + mobile**; alterações em `apps/web` apenas quando necessário ao administrativo.

---

## 3. Decisões já validadas

| Tema | Decisão |
|------|---------|
| PDI → PAEE | **Renomear** e **preservar 100% dos registros históricos** (migração de dados, sem “corte limpo”). |
| Motor de texto pedagógico (Estudo de Caso) | **Ainda não existe** no produto. Hoje: exportação **PDI em .docx** no **front** (`docx`); **PDF da avaliação diagnóstica** na **API**. A implementação do Estudo de Caso pode seguir o padrão híbrido ou **centralizar geração na API** para web e mobile não duplicarem regras — **decisão técnica a fechar na Sprint 0 / kickoff**. |
| Prazo | **Flexível** — fechamento de datas com a cliente. |

---

## 4. Escopo funcional consolidado

### 4.1 Transformação PDI → PAEE (prioridade)

- Substituir nomenclatura e conceitos: **PDI → PAEE**; objetivos/habilidades do PDI → **objetivos/habilidades do PAEE** (UI, exportações, relatórios, mobile).
- **PAEE não é criado “do zero” manual** como único caminho: fluxo preferencial **Cadastro → Avaliação diagnóstica → Estudo de caso → geração/sugestão do PAEE**.
- Integração: puxar do **estudo de caso** potencialidades, necessidades, barreiras; sugerir **objetivos**, **habilidades**, **intervenções** (conforme especificação da cliente).

**Critérios de aceite (resumo):**

- [ ] Todo histórico de planejamentos existentes permanece acessível e vinculado aos mesmos alunos.
- [ ] Exportações e telas refletem **PAEE** (sem referências residuais críticas a PDI em fluxo principal).
- [ ] Fluxo “sem estudo de caso” (legado ou exceção) tem comportamento definido e comunicado na UI (não bloquear uso indevidamente).

---

### 4.2 Cadastro do aluno — nova estrutura

**Dados gerais**

- Nome, data de nascimento, escola, ano escolar, etapa de ensino (e demais campos já acordados com a cliente).

**Informações do atendimento** (base para planejamento e relatos)

- Quantas vezes por semana é atendido  
- **Dias da semana**  
- Duração de cada atendimento  
- Tipo de atendimento: individual, grupo, colaborativo, itinerante  

**Substituição pedagógica do foco em “laudo”**

- Nova seção: **Perfil pedagógico do aluno** — potencialidades e necessidades educacionais (texto e/ou seleção alinhada ao estudo de caso).

**Critérios de aceite (resumo):**

- [ ] Dados persistidos e **reutilizados automaticamente** em: Estudo de Caso, PAEE, Avaliação diagnóstica (onde aplicável).
- [ ] Migração para alunos já cadastrados sem perda de informação (mapeamento laudo → perfil, se necessário).

---

### 4.3 Avaliação diagnóstica — integração

- Manter fluxo atual; ampliar para **alimentar automaticamente** (onde o produto definir): competências atuais, necessidades iniciais, perfil pedagógico.
- Esses dados devem fluir para **Estudo de Caso** e **PAEE**.

**Critérios de aceite (resumo):**

- [ ] Avaliação concluída disponibiliza dados para pré-preenchimento nos módulos dependentes.
- [ ] Aluno **sem** avaliação: fluxo continua possível, com avisos/estado vazio nos blocos automáticos.

---

### 4.4 Estudo de caso — novo módulo

**Preenchimento:** eixos com campos estruturados (checkbox/seleção + observações onde couber).

**Eixos (referência do escopo da cliente — numerar na implementação conforme UX final):**

- Identificação (automático do cadastro)  
- Contexto familiar  
- Perfil de aprendizagem  
- Competências atuais (automático da avaliação diagnóstica)  
- Comunicação e interação  
- Aspectos comportamentais (e sensoriais, se mantidos no desenho)  
- Autonomia  
- Barreiras  
- Geração de: potencialidades, necessidades, barreiras, direcionamento / adequações / encaminhamentos e **síntese pedagógica** em texto corrido a partir das seleções.

**Documento final**

- Ação **Gerar estudo de caso**: documento estruturado + texto automático + **PDF** (e/ou impressão), padrão similar ao que a cliente exemplificou.

**Integração com PAEE**

- Ação **Gerar PAEE** após estudo de caso, importando insumos acordados.

**Critérios de aceite (resumo):**

- [ ] Rascunho, edição e versão final definidas (mínimo: salvar antes de gerar documento).
- [ ] PDF/documento contém todas as seções obrigatórias do escopo aprovado.
- [ ] Botão/fluxo para iniciar PAEE a partir do estudo de caso concluído.

---

### 4.5 PAEE — fluxo em etapas (versão ajustada)

1. Seleção do aluno → dados do cadastro e insumos do estudo de caso carregados automaticamente.  
2. Seleção de habilidades.  
3. Objetivos (curto / médio / longo prazo) — preferência por **seleção** (catálogo) com possibilidade de refinamento, a validar com a cliente.  
4. Seleção de estratégias pedagógicas.  
5. **Planejamento dos atendimentos** com base na frequência semanal + habilidades + estratégias + recurso/atividade sugerida por encontro.  
6. Formas de avaliação (a partir do cadastrado na plataforma).  
7. Geração do PAEE completo (documento organizado, impressão/acompanhamento).

**Critérios de aceite (resumo):**

- [ ] Wizard ou equivalente cobre as 7 etapas sem perder dados ao navegar (salvamento incremental).
- [ ] Planejamento por encontro reflete **dias e quantidade** do cadastro do aluno.

---

### 4.6 Relato de atendimento — novo módulo

- Geração da **grade de relatos** a partir da frequência e dias cadastrados (ex.: 2x/semana → dois “slots” por semana).
- Cada relato: data (presença/falta), habilidade trabalhada (ligação ao PAEE), estratégia/atividade (ligação ao PAEE), descrição livre, avanços e dificuldades (seleção).

**Critérios de aceite (resumo):**

- [ ] Lista por aluno/período; preenchimento por sessão.
- [ ] Falta/presença tratada de forma explícita (campos obrigatórios condicionais).

---

## 5. Mapa de dependências (ordem lógica)

```text
Cadastro do aluno (novos campos + perfil)
        ↓
Avaliação diagnóstica (integração de saída)
        ↓
Estudo de caso (novo)
        ↓
PAEE (substitui PDI + novo fluxo)
        ↓
Relato de atendimento (aproveita cadastro + PAEE)
```

**Observação de planejamento:** a renomeação **PDI → PAEE** pode começar cedo para reduzir dívida de nomenclatura, mas o **comportamento novo** do PAEE depende do **Estudo de caso** e do **cadastro** enriquecidos.

---

## 6. Sprints sugeridas (escopo por timebox)

Cada sprint assume **~2 semanas**; quantidade total e datas são **negociáveis com a cliente**.

| Sprint | Foco | Entregas principais |
|--------|------|---------------------|
| **S1** | PDI → PAEE (base) | Migração preservando histórico; API + web-app + mobile + exportações com nomenclatura PAEE; ajustes em relatórios. |
| **S2** | Cadastro do aluno | Novos campos de atendimento; perfil pedagógico; migração de dados legados; consumo nos pontos de integração preparados. |
| **S3** | Avaliação → outros módulos | APIs e contratos para competências/perfil alimentarem Estudo de Caso e PAEE. |
| **S4** | Estudo de caso — backend | Modelos, persistência, endpoints, pré-preenchimento (cadastro + avaliação). |
| **S5** | Estudo de caso — front + geração | UI por eixos; motor de texto; documento/PDF; “Gerar PAEE”. |
| **S6** | PAEE — fluxo completo | 7 etapas; importação do estudo de caso; planejamento por encontro; documento final. |
| **S7** | Relato de atendimento | Grade automática; telas; vínculos com PAEE. |
| **S8** | Integração e hardening | Fluxo ponta a ponta; mobile em paridade crítica; testes; ajustes admin (`apps/web`) se necessário. |

**Definição de pronto (DoD) sugerida por sprint:** código revisado, migrations aplicáveis em ambiente de homologação, checklist de regressão do fluxo tocado, sem erros críticos de lint/build nos apps alterados.

---

## 7. Riscos e premissas

| Risco | Mitigação |
|-------|-----------|
| Migração PDI → PAEE com dados legados complexos | Script idempotente, backup, rollback documentado, homologação com base anonimizada. |
| Duplicação de regras de texto (web vs mobile) | Preferir **serviço único** (API) para geração pedagógica, se o time optar por isso no kickoff. |
| Escopo do “motor de frases” crescer sem limite | Catálogo versionado de templates + critérios de aceite por eixo. |
| `apps/web` atrasar se misturado ao escopo da professora | Tratar admin como **stream separada** com critérios próprios. |

**Premissas:** acesso a ambiente de homologação, decisão explícita sobre **onde** roda a geração de texto longo (API vs cliente), e validação UX das 7 etapas do PAEE com a cliente antes de congelar UI.

---

## 8. Glossário rápido

| Termo | Significado |
|-------|-------------|
| **PDI** | Plano de Desenvolvimento Individual — modelo atual na plataforma. |
| **PAEE** | Plano de Atendimento Educacional Especializado — modelo alvo. |
| **Estudo de caso** | Módulo novo que consolida eixos pedagógicos e gera insumos para o PAEE. |
| **Relato de atendimento** | Registro por sessão de AEE, amarrado ao planejamento e à frequência. |

---

## 9. Próximos passos (fora deste arquivo)

1. Apresentar este documento à cliente e **marcar o que é MVP vs fase 2**.  
2. **Sprint 0 / kickoff:** decidir geração de texto (API vs front), formato oficial do PDF, e lista fechada de eixos/campos.  
3. Atualizar este arquivo com **datas**, **responsáveis** e **mudanças de escopo** (changelog no rodapé).

---

### Changelog

| Data | Autor | Alteração |
|------|-------|-----------|
| 2026-04-12 | Time | Versão inicial — consolidação dos documentos da cliente e decisões validadas. |