# Estágio de build (instala SDK e publica)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["api.csproj", "."]  
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/dist

# Estágio de runtime (imagem leve para deploy)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/dist .
EXPOSE 80  # Porta padrão para Render
ENTRYPOINT ["dotnet", "api.dll"]  