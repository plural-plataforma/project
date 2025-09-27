# Plural Plataforma

Bem-vindo ao repositório `plural-plataforma`, um **monorepo** gerenciado com [TurboRepo](https://turbo.build/repo) que contém múltiplos projetos e pacotes, incluindo aplicações e bibliotecas compartilhadas. Este README fornece instruções para configurar, desenvolver e contribuir com o repositório.

## Estrutura do Repositório

A estrutura do monorepo é organizada da seguinte forma:

<<<<<<< HEAD
- `/monorepo`
  - `/apps`
    - `/api`: API backend
    - `/mobile`: Aplicação mobile
    - `/web`: Aplicação web
  - `/node_modules`: Dependências globais (gerenciadas pelo TurboRepo)
  - `/packages`
    - `/eslint-config`: Configurações de ESLint compartilhadas
    - `/typescript-config`: Configurações de TypeScript compartilhadas
    - `/ui`: Componentes de UI reutilizáveis
=======
/monorepo
├── /apps
│ ├── /api # API backend
│ ├── /mobile # Aplicação mobile
│ ├── /web # Aplicação web
├── /node_modules # Dependências globais (gerenciadas pelo TurboRepo)
├── /packages
│ ├── /eslint-config # Configurações de ESLint compartilhadas
│ ├── /typescript-config # Configurações de TypeScript compartilhadas
│ ├── /ui # Componentes de UI reutilizáveis
>>>>>>> bf71cd9 (feat: orientações de uso do repositório do monorepo para dev [PLUR-23])

Cada pasta em `/apps` e `/packages` contém um projeto ou pacote independente com instruções específicas em seu próprio `README.md` (se disponível).

## Pré-requisitos

Para trabalhar neste monorepo, você precisará das seguintes ferramentas instaladas:

- [Node.js](https://nodejs.org/) (versão 18.x ou superior, recomendada pela TurboRepo)
- [NPM](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/) (versão compatível com TurboRepo)
- [TurboRepo CLI](https://turbo.build/repo/docs/installation) (instale globalmente com `npm install -g turbo`)
- Um editor de código como [VS Code](https://code.visualstudio.com/)

Certifique-se de clonar o repositório:

```bash
git clone https://github.com/plural-plataforma/project.git
cd project
```

## Configuração do Ambiente

### 1. Instale o TurboRepo (se ainda não instalado)

```bash
npm install -g turbo
```

### 2. Instale as dependências

- Na raiz do repositório, execute:

  ```bash
  npm install
  ```

Isso instalará todas as dependências dos pacotes em /apps e /packages usando o cache do TurboRepo.

### 3. Configure variáveis de ambiente

- Copie o arquivo .env.example (se existir) para .env e ajuste as variáveis conforme necessário:

  ```bash
  cp .env.example .env
  ```

### 4. Inicie o desenvolvimento

- Para iniciar todos os projetos em modo de desenvolvimento paralelo:

  ```bash
  npm run dev
  ```

- Ou inicie um projeto específico, por exemplo, o app web:

  ```bash
  turbo run dev --filter=web
  ```

## Scripts Disponíveis

O `package.json` define os seguintes scripts no monorepo:

`npm run build`: Compila todos os projetos.

`npm run dev`: Inicia todos os projetos em modo de desenvolvimento paralelo.

`npm run lint`: Executa verificações de lint em todos os pacotes.

`npm run format`: Formata os arquivos .ts, .tsx e .md com Prettier.

`npm run check-types`: Verifica os tipos TypeScript em todos os pacotes.

Para scripts específicos de um pacote ou app, consulte o README.md na pasta correspondente (ex.: /apps/web/README.md).

Esse repositório está com `Automerge de Pull Requests`, isso quer dizer que ao solicitar uma pull request já executa um merge e ao aprovar a pull já é excluida a branch criada pelo Jira e mergeado automaticamente com a branch `staging`.
