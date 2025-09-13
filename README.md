# Plural Plataforma

Bem-vindo ao repositório **Plural Plataforma**, um monorepo Nx contendo um aplicativo web (`apps/web`), um aplicativo mobile (`apps/mobile`) e uma API .NET (`apps/server/api`). O projeto mobile usa **Expo SDK 53** com **Vite** como bundler e integra com a biblioteca `@plural-plataforma/utils` para chamadas à API. Este README fornece instruções para configurar, rodar e testar o projeto.

## Estrutura do Projeto

- **apps/**
  - `web/`: Aplicativo web em React com Vite.
  - `mobile/`: Aplicativo mobile em React Native com Expo SDK 53.
  - `server/api/`: API backend em .NET.
- **packages/**
  - `utils/`: Biblioteca compartilhada com funções utilitárias (ex.: chamadas à API com `axios`).
  - `types/`: Tipos TypeScript compartilhados.
- **node_modules/**: Dependências hoistadas na raiz do monorepo.
- **nx.json**: Configuração do Nx para gerenciar o monorepo.
- **package.json**: Configuração do monorepo e scripts principais.

## Pré-requisitos

- **Node.js**: v18.x recomendado (v20.13.1 funciona, mas pode gerar avisos com `expo-cli`).
  - Instale com `nvm install 18` e use `nvm use 18`.
- **npm**: >=8.0.0 (verifique com `npm --version`).
- **Expo CLI**: >=6.3.10 (instale com `npm install -g @expo/cli@latest`).
- **.NET SDK**: Para rodar a API (verifique com `dotnet --version`).
- **Android Studio** ou **Xcode**: Para emuladores (opcional; use **Expo Go** para testes rápidos).
- **Git**: Para clonar e gerenciar o repositório.
- **Postman**: Para testar a API.

## Configuração

1. **Clonar o Repositório**:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd D:\repos\plural-plataforma
   ```

2. **Instalar Dependências**:
   ```bash
   npm install
   ```
   - Se houver conflitos de dependências, tente:
     ```bash
     npm install --legacy-peer-deps
     ```
   - Verifique dependências:
     ```bash
     npm ls expo react-native
     ```
     - Esperado: `expo@53.0.0` e `react-native@0.74.5` listados em `mobile`.

3. **Compilar o Pacote `@plural-plataforma/utils`**:
   ```bash
   cd packages/utils
   npm run build
   ```
   - Confirme que `dist/index.js` foi gerado:
     ```bash
     dir packages\utils\dist
     ```

4. **Configurar a API .NET**:
   - Verifique CORS em `apps/server/api/Program.cs`:
     ```csharp
     var builder = WebApplication.CreateBuilder(args);

     builder.Services.AddCors(options =>
     {
         options.AddPolicy("AllowAll", policy =>
         {
             policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
         });
     });

     var app = builder.Build();
     app.UseCors("AllowAll");
     ```

5. **Configurar Variáveis de Ambiente**:
   - Para dispositivos físicos, edite `apps/mobile/app.json` com o IP da máquina:
     ```json
     "extra": {
       "apiUrl": "http://192.168.1.x:5191/api"
     }
     ```
   - Para emulador Android, use `http://10.0.2.2:5191/api`.

## Rodando o Projeto

### 1. Rodar a API .NET
```bash
cd apps/server/api
dotnet run --launch-profile http
```
- Teste com Postman: `POST http://localhost:5191/api/auth/login` com:
  ```json
  {
    "email": "teste@exemplo.com",
    "password": "senha123"
  }
  ```

### 2. Rodar o Aplicativo Mobile
1. **Iniciar o Metro Bundler**:
   ```bash
   cd D:\repos\plural-plataforma
   npm run start:mobile
   ```
   - Isso executa `expo start --dev-client -c` e exibe um QR code.

2. **Testar no Expo Go**:
   - Instale o **Expo Go** no celular (iOS/Android).
   - Escaneie o QR code.
   - Insira credenciais (ex.: `teste@exemplo.com`, `senha123`) e clique em "Login".

3. **Testar no Emulador**:
   - Android:
     ```bash
     cd apps/mobile
     npx expo start --android
     ```
   - iOS (requer Xcode):
     ```bash
     npx expo start --ios
     ```

### 3. Rodar o Aplicativo Web
```bash
cd D:\repos\plural-plataforma
npm run start:web
```
- Acesse `http://localhost:4200`.

## Solução de Problemas

- **Erro: `Unable to find expo`**:
  - Reinstale dependências:
    ```bash
    cd D:\repos\plural-plataforma
    npm install
    ```
  - Verifique:
    ```bash
    npm ls expo react-native
    ```

- **Erro de Metro Bundler**:
  - Limpe o cache:
    ```bash
    cd apps/mobile
    npx expo start -c
    ```

- **Erro de CORS**:
  - Confirme CORS no backend .NET (veja acima).

- **Aviso de Node.js v20.13.1**:
  - Mude para Node.js v18.x:
    ```bash
    nvm install 18
    nvm use 18
    npm install
    ```

- **Dependências Ausentes**:
  - Execute:
    ```bash
    npm audit
    npm audit fix
    ```
  - Compartilhe o log se houver erros:
    ```bash
    type C:\Users\Carla Reis\AppData\Local\npm-cache\_logs\*.log
    ```

## Desenvolvimento

- **Adicionar Navegação**:
  - Use `@react-navigation` para criar telas (ex.: Dashboard, Formulário de Aluno).
  - Exemplo: Adicione uma tela em `apps/mobile/src/screens/Dashboard.tsx`.

- **Testes**:
  - Configure Jest:
    ```bash
    npm install --save-dev @testing-library/react-native jest-expo
    ```

- **Build para Produção**:
  - Gere APK com EAS:
    ```bash
    cd apps/mobile
    npx eas build --platform android
    ```

## Contribuição

- Autor: Carla Reis <47834995+carla-reis-cr@users.noreply.github.com>
- Licença: MIT
- Para contribuir, crie um PR com descrição clara das mudanças.

## Próximos Passos

- Testar o login no aplicativo mobile.
- Implementar navegação para telas adicionais.
- Configurar testes automatizados com Jest.
- Monitorar vulnerabilidades com `npm audit`.