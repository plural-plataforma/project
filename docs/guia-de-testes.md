# Guia de Testes — Plataforma Plural

> **Para quem é este guia?**
> Equipe de testes e gestão. Não é necessário conhecimento técnico. Basta seguir os passos em ordem e marcar o que funcionou ou não.

---

## Como usar este guia

- Siga a ordem das seções — cada uma prepara a próxima.
- Para cada passo, há o que fazer e o que deve aparecer na tela.
- Se algo diferente aparecer, anote o que estava fazendo e o que ocorreu.
- Use um navegador desktop (Chrome ou Edge atualizados).

---

## Seção 1 — Acesso: Cadastro, Login e Onboarding

### O que esta tela faz
É a porta de entrada da plataforma. Permite criar uma conta nova ou entrar com uma já existente.

---

### 1.1 Criar conta nova

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Acesse a URL da plataforma | Aparece a tela de login |
| 2 | Clique em **"Criar conta"** ou **"Cadastro"** | Abre o formulário de cadastro |
| 3 | Preencha nome completo, e-mail e senha (mínimo 6 caracteres) | Campos aceitam os dados digitados |
| 4 | Aceite os termos e clique em **"Criar conta"** | Mensagem de confirmação e redirecionamento para o dashboard |

> **Atenção:** Teste com e-mail inválido (ex.: `teste`) — o sistema deve bloquear o envio.

---

### 1.2 Login com conta existente

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Acesse a URL da plataforma | Aparece a tela de login |
| 2 | Preencha e-mail e senha corretos | Campos aceitam os dados |
| 3 | Clique em **"Entrar"** | Entra no dashboard |
| 4 | Tente entrar com senha errada | Mensagem de erro — não entra |

---

### 1.3 Onboarding (primeiro acesso)

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Entre pela primeira vez com uma conta nova | Aparece uma tela de boas-vindas com slides |
| 2 | Navegue pelos slides clicando em **"Próximo"** ou avançando | Cada slide apresenta uma funcionalidade da plataforma |
| 3 | Conclua o onboarding | Vai para o dashboard |

---

## Seção 2 — Dashboard (Início)

### O que esta tela faz
É a tela inicial após o login. Mostra um resumo do que está acontecendo: quantos alunos, PAEEs ativos, atendimentos do mês e porcentagem de documentação completa. Também exibe alertas e atalhos rápidos.

---

### O que testar

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Observe os 4 cards de métricas no topo | Cada card mostra um número (alunos, PAEE em vigor, atendimentos do mês, documentação completa) |
| 2 | Clique no card **"Alunos ativos"** | Navega para a página de alunos |
| 3 | Volte ao dashboard; clique no card **"PAEE em vigor"** | Navega para a lista de PAEEs |
| 4 | Observe a seção **"Jornada pedagógica"** | Mostra as 6 etapas: Escola, Alunos, Estudo de caso, Avaliação, PAEE, Atendimentos |
| 5 | Observe a seção **"Alertas"** (se houver) | Mostra avisos como "Alunos sem estudo de caso" ou "Documentação disponível para download" |
| 6 | Clique em um alerta que tenha o botão de ação | Navega para a página correspondente |
| 7 | Observe a seção **"Atividade recente"** | Mostra os últimos registros criados na plataforma |

---

## Seção 3 — Escolas

### O que esta tela faz
Cadastra e gerencia as escolas onde a professora atua. As escolas aparecem vinculadas aos alunos.

### Como acessar
Menu lateral → **Escolas** (ou clique no passo "Escola" da jornada no dashboard)

---

### O que testar

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Clique em **"Nova escola"** | Abre um formulário |
| 2 | Preencha o nome da escola e o CEP | O endereço é preenchido automaticamente após o CEP |
| 3 | Salve | A escola aparece na lista |
| 4 | Clique nos três pontos ou no ícone de edição da escola | Abre o formulário com os dados preenchidos |
| 5 | Altere o nome e salve | Nome atualizado na lista |

---

## Seção 4 — Alunos

### O que esta tela faz
Lista todos os alunos cadastrados. Permite cadastrar, buscar, filtrar por escola e acessar o perfil completo de cada aluno.

### Como acessar
Menu lateral → **Alunos**

---

### 4.1 Cadastrar aluno

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Clique em **"Novo aluno"** | Abre o formulário de cadastro |
| 2 | Preencha: nome completo, escola, nível de ensino, turno, ano/série | Campos aceitam os dados |
| 3 | Preencha dados de atendimento: frequência semanal, dias da semana, duração em minutos | Campos opcionais — preencha para testar sugestão de datas no PAEE depois |
| 4 | Preencha dados do responsável: nome, telefone, e-mail | Opcional |
| 5 | Salve | Aluno aparece na lista |

---

### 4.2 Buscar e filtrar

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Digite parte do nome no campo de busca | Lista filtra em tempo real |
| 2 | Selecione uma escola no filtro | Lista mostra só alunos daquela escola |
| 3 | Limpe os filtros | Lista volta completa |

---

### 4.3 Perfil do aluno

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Clique no nome de um aluno | Abre a página de perfil |
| 2 | Verifique as seções: **Informações**, **Atendimento no AEE**, **Responsável** | Dados cadastrados aparecem corretamente |
| 3 | Clique em **"Editar"** no topo | Abre o formulário com dados para edição |
| 4 | Altere algum dado e salve | Dado atualizado no perfil |

---

## Seção 5 — Estudo de Caso

### O que esta tela faz
O estudo de caso é o documento pedagógico que descreve o aluno: contexto, barreiras, potencialidades e necessidades educacionais. É criado em 4 etapas com apoio da Plural IA para gerar o texto final.

### Como acessar
Menu lateral → **Estudo de caso** — ou — no perfil do aluno, clique em **"Novo estudo"**

---

### 5.1 Criar novo estudo de caso (wizard)

| # | O que fazer | O que deve acontecer |
|---|---|---|
| **Etapa 1 — Aluno** | Selecione o aluno na lista ou busque pelo nome | Aluno selecionado aparece destacado |
| | Clique em **"Próximo"** | Avança para a etapa 2 |
| **Etapa 2 — Contexto** | Preencha o título do estudo e a situação observada sobre o aluno | Campos aceitam texto |
| | Clique em **"Próximo"** | Avança para a etapa 3 |
| **Etapa 3 — Eixos** | Marque os eixos pedagógicos obrigatórios (ex.: identificação, barreiras, avaliação, necessidades, planejamento) | Cada eixo marcado pode receber anotações |
| | Preencha anotações nos eixos marcados | Texto salvo no eixo |
| | Clique em **"Próximo"** | Avança para a etapa 4 |
| **Etapa 4 — Conclusão** | Clique em **"Gerar documento"** | Aparece uma animação de geração (Plural IA) |
| | Aguarde a geração concluir | O documento completo aparece formatado com seções |
| | Verifique que não há textos de "RASCUNHO" ou avisos de revisão | Documento deve aparecer limpo |
| | Clique em **"Baixar PDF"** | Download do arquivo .pdf |
| | Clique em **"Baixar Word"** | Download do arquivo .docx |

---

### 5.2 Detalhe do estudo de caso (dialog)

Acesse a partir da lista de estudos ou do perfil do aluno, clicando em **"Ver detalhes"**.

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Abra o detalhe de um estudo | Dialog abre com o documento formatado |
| 2 | Clique no botão de copiar texto | Mensagem de confirmação "Copiado" |
| 3 | Clique em **"Editar"** | Formulário de edição aparece |
| 4 | Altere o título e salve | Título atualizado; aviso de que o documento precisará ser regenerado |
| 5 | Clique em **"Regenerar documento"** | Animação de geração; novo documento aparece |
| 6 | Clique em **"Excluir"** | Dialog de confirmação aparece |
| 7 | Cancele a exclusão | Dialog fecha, estudo permanece |

---

### 5.3 Gerar PAEE a partir do estudo (perfil do aluno)

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Acesse o perfil de um aluno que tenha estudo com **"Documento gerado"** e ainda **não tenha PAEE** | Na seção "Estudos de caso", aparece o botão **"Gerar PAEE"** ao lado do estudo |
| 2 | Clique em **"Gerar PAEE"** | Botão entra em loading; PAEE é criado automaticamente |
| 3 | Aguarde o processamento | Navega automaticamente para o detalhe do PAEE criado |

---

## Seção 6 — Avaliação Diagnóstica

### O que esta tela faz
Permite criar avaliações de desempenho para um grupo de alunos, selecionando atividades por área de conhecimento. Após a aplicação, é possível lançar o desempenho de cada aluno e obter um perfil de autonomia.

### Como acessar
Menu lateral → **Avaliação diagnóstica**

---

### 6.1 Criar nova avaliação (wizard)

| # | O que fazer | O que deve acontecer |
|---|---|---|
| **Etapa 1 — Identificação** | Preencha título, data de aplicação, escola e objetivo | Campos aceitam os dados |
| | Clique em **"Próximo"** | Avança |
| **Etapa 2 — Alunos** | Selecione os alunos que participarão | Alunos marcados aparecem destacados |
| | Clique em **"Próximo"** | Avança |
| **Etapa 3 — Áreas** | Filtre por eixo, nível de ensino ou etapa; selecione blocos e atividades | Atividades selecionadas aparecem na lista |
| | Clique em **"Próximo"** | Avança |
| **Etapa 4 — Revisão** | Confira o resumo: título, alunos, atividades | Dados corretos mostrados |
| | Clique em **"Salvar avaliação"** | Avaliação criada; opções de download aparecem |
| | Baixe o PDF | Download do arquivo |

---

### 6.2 Lançar desempenho

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Na lista de avaliações, clique em **"Lançar desempenho"** | Abre a página de lançamento |
| 2 | Para cada aluno, selecione o nível em cada atividade: **Autonomia**, **Com ajuda** ou **Não realizou** | Seleção salva por item |
| 3 | Clique em **"Salvar"** | Confirmação de salvamento |
| 4 | Observe a seção **"Perfil de autonomia"** | Resumo do desempenho do aluno com sugestões para o PAEE |
| 5 | Clique em **"Finalizar avaliação"** | Status muda para "Concluída" |

---

## Seção 7 — PAEE (Plano de Atendimento Educacional Especializado)

### O que esta tela faz
O PAEE é o documento oficial de planejamento pedagógico para o aluno com necessidades educacionais específicas. É organizado em 5 abas: Visão geral, Objetivos, Encontros, Assinatura e Revisão.

### Como acessar
Menu lateral → **PAEE**

---

### 7.1 Criar novo PAEE (wizard)

| # | O que fazer | O que deve acontecer |
|---|---|---|
| **Etapa 1 — Dados** | Preencha nome do PAEE, data de início e fim, e descrição | Campos aceitam os dados |
| | Clique em **"Próximo"** | Avança |
| **Etapa 2 — Alunos** | Selecione o(s) aluno(s) | Alunos marcados |
| **Etapa 3 — Habilidades** | Filtre por nível de ensino; selecione habilidades | Habilidades marcadas |
| **Etapa 4 — Estratégias** | Selecione estratégias pedagógicas | Estratégias marcadas |
| **Etapa 5 — Critérios** | Selecione critérios avaliativos e clique em **"Criar PAEE"** | PAEE criado; navega para o detalhe |

---

### 7.2 Aba Visão geral

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | No detalhe do PAEE, veja a aba **Visão geral** | Mostra dados básicos e os 4 cards: Alunos, Habilidades, Estratégias, Critérios |
| 2 | Clique em **"Editar dados"** no topo da página | Formulário de edição abre |
| 3 | Altere o nome do PAEE e salve | Nome atualizado |
| 4 | No card **"Alunos"**, clique em **"Adicionar"** | Modal de busca abre |
| 5 | Busque um aluno e clique nele | Aluno vinculado; aparece no card |
| 6 | Repita para **Habilidades**, **Estratégias** e **Critérios** | Todos vinculados corretamente |

---

### 7.3 Aba Objetivos

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Clique na aba **Objetivos** | Aparece o formulário com 3 campos: curto, médio e longo prazo |
| 2 | Selecione um objetivo do catálogo no campo "curto prazo" | Texto do catálogo é preenchido automaticamente |
| 3 | Edite o texto se necessário | Campo de texto editável |
| 4 | Preencha médio e longo prazo (catálogo ou texto livre) | Campos aceitam os dados |
| 5 | Clique em **"Salvar objetivos"** | Confirmação de salvamento |

---

### 7.4 Aba Encontros

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Clique na aba **Encontros** | Aparece a grade de encontros |
| 2 | Clique em **"Sugestão de datas"** | Datas são adicionadas automaticamente com base nos dias de atendimento do aluno |
| 3 | Verifique as datas sugeridas | Datas dentro do período do PAEE |
| 4 | Clique em **"Nova linha"** | Uma nova linha em branco é adicionada |
| 5 | Preencha a data, o conteúdo planejado e selecione uma habilidade | Campos aceitam os dados |
| 6 | Clique em **"Salvar encontros"** | Confirmação de salvamento |
| 7 | Recarregue a página e abra a aba Encontros novamente | Dados permanecem salvos |

---

### 7.5 Aba Assinatura

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Clique na aba **Assinatura** | Aparece o formulário de assinatura |
| 2 | Marque a caixa **"Documento declarado como assinado"** | Caixa marcada |
| 3 | Preencha nome do responsável e cargo | Campos aceitam texto |
| 4 | Clique em **"Salvar assinatura"** | Confirmação de salvamento |

---

### 7.6 Aba Revisão

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Clique na aba **Revisão** | Aparece o checklist de completude do PAEE |
| 2 | Observe o percentual de preenchimento | Quanto mais itens preenchidos nas outras abas, maior a porcentagem |
| 3 | Itens não preenchidos aparecem em vermelho ou pendentes | Indica o que ainda falta |
| 4 | Clique em **"Baixar Word"** | Download do arquivo .docx com todo o PAEE |

---

### 7.7 Download na lista de PAEEs

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Volte para a lista de PAEEs (menu → PAEE) | Lista exibida |
| 2 | Clique no ícone de download ao lado de um PAEE | Opções PDF e Word aparecem |
| 3 | Baixe PDF e Word | Downloads iniciam |

---

## Seção 8 — Registro de Atendimento

### O que esta tela faz
Registra as sessões de atendimento AEE realizadas com cada aluno. Permite controlar presença, conteúdo planejado e realizado, e exportar um relatório consolidado.

### Como acessar
Menu lateral → **Registro de atendimento**

---

### O que testar

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Clique em **"Novo registro"** | Abre o formulário |
| 2 | Selecione o aluno, o PAEE vinculado, a data e marque presença | Campos preenchidos |
| 3 | Preencha habilidade trabalhada, estratégia usada e observações | Opcional, mas preencha para testar |
| 4 | Salve | Registro aparece na lista |
| 5 | Filtre por período (data início e fim) | Lista filtra corretamente |
| 6 | Filtre por aluno específico | Mostra apenas os registros do aluno |
| 7 | Clique em **"Exportar"** ou **"Baixar relatório"** | Download do arquivo .docx consolidado |
| 8 | Abra o registro criado e edite um campo | Alteração salva corretamente |

---

## Seção 9 — Estudo de caso + PAEE (Documentação consolidada)

### O que esta tela faz
Centraliza o download combinado do estudo de caso e do PAEE de cada aluno que possui os dois documentos. É o ponto final da jornada pedagógica.

### Como acessar
Menu lateral → **Estudo de caso + PAEE**

---

### O que testar

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Acesse a página | Lista de alunos com documentação completa |
| 2 | Compare o número da lista com o número no dashboard | Devem ser iguais |
| 3 | Para um aluno listado, clique em **"Baixar documentação"** | Download do arquivo combinado (estudo + PAEE) |
| 4 | Abra o arquivo baixado | Documento contém as seções do estudo de caso e do PAEE |
| 5 | Se a lista estiver vazia, volte e certifique-se de que um aluno tem estudo com documento gerado e um PAEE vinculado | O aluno deve aparecer na lista depois |

---

## Seção 10 — Perfil da Professora

### O que esta tela faz
Exibe e permite editar os dados pessoais e profissionais da professora cadastrada na plataforma.

### Como acessar
Menu lateral (ícone de usuário ou nome no rodapé) → **Perfil** — ou — barra superior → foto/nome

---

### O que testar

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Acesse o perfil | Dados da conta aparecem: nome, e-mail, escola(s) vinculada(s) |
| 2 | Clique em **"Editar"** na seção de dados pessoais | Formulário editável abre |
| 3 | Altere o nome e salve | Nome atualizado na página e no menu |
| 4 | Preencha dados profissionais (cargo, formação) e salve | Dados salvos |
| 5 | Clique em **"Alterar senha"** | Abre a tela de troca de senha |
| 6 | Preencha a senha atual e a nova (duas vezes) e salve | Confirmação de alteração |
| 7 | Faça logout e login com a nova senha | Acesso permitido |

---

## Resumo da jornada completa

Use esta sequência para um teste de ponta a ponta:

```
1. Criar conta
2. Cadastrar escola
3. Cadastrar aluno (com dias de atendimento)
4. Criar estudo de caso → gerar documento
5. Criar avaliação diagnóstica → lançar desempenho
6. Criar PAEE (ou usar "Gerar PAEE" no perfil do aluno)
   → Preencher todas as 5 abas
7. Criar registros de atendimento
8. Acessar "Estudo de caso + PAEE" e baixar documentação
9. Verificar dashboard: todos os números batem
```

---

## O que reportar quando algo não funcionar

Ao encontrar um problema, anote:

1. **Qual página estava** (ex.: "aba Encontros do PAEE")
2. **O que estava fazendo** (ex.: "cliquei em Salvar encontros")
3. **O que aconteceu** (ex.: "página ficou carregando e não confirmou")
4. **Mensagem de erro** se aparecer (copie o texto exato)
5. **Navegador e horário** do teste

---

*Versão: Fase 4 — 14/06/2026*
