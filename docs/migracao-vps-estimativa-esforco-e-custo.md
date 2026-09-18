# Migração para VPS própria: estimativa de esforço e custo

Data: 2026-09-17
Escopo: hospedagem de `apps/api`, `apps/web`, `apps/web-app`, `apps/mobile` (build web) e do banco de
produção.
Documento de estimativa para decisão. Nenhuma mudança de código ou de infraestrutura foi feita.

Origem: custo mensal da Vercel, pedido do Supabase para migrar para plano pago e API hospedada na
Alemanha (MonsterASP), longe dos usuários e do banco.

---

## 1. Situação atual

| Peça | Onde roda | O que é usado de fato |
| --- | --- | --- |
| `apps/api` (.NET 9, QuestPDF, MailKit, Serilog) | MonsterASP (Windows/IIS, Alemanha), `plural.runasp.net` | Deploy via GitHub Actions com `simply-web-deploy`. Dois jobs em background: `RelatorioGeracaoWorker` e `HotmartReconciliacaoAssinaturasJob` |
| PostgreSQL | Supabase (`sa-east-1`, via `pooler.supabase.com`) | Só Postgres. A API conecta direto com o usuário `postgres`. Nenhum app usa Supabase Auth, PostgREST, RLS com política ou functions (ver `docs/seguranca-rls-supabase.sql`) |
| Storage | Supabase Storage, bucket `artigos` | Upload direto do navegador com a anon key (`apps/web/src/lib/uploadToSupabaseStorage.ts`). A API guarda só a URL (`Models/Artigo.cs`) |
| `apps/web`, `apps/web-app`, `apps/mobile` (web) | Vercel | SPAs estáticas (Vite e `expo export -p web`) com rewrite para `index.html`. Sem serverless, sem Next.js |
| Imagens de atividades | ImgBB (`i.ibb.co`) | Externo. Fora do escopo da migração |
| Arquivos da biblioteca de documentos | Dentro do Postgres (`ConteudoArquivo`, `byte[]`) | Não precisa de storage, mas aumenta o tamanho do dump |
| DNS | HostGator | E-mail na Titan. `adm.pluralplataforma.com` aponta para a Vercel |

Conclusão: nenhuma peça depende de recurso exclusivo da Vercel ou do Supabase. O esforço está em banco,
storage de artigos, API em Linux e CI/CD.

Efeito colateral positivo: hoje toda query cruza o Atlântico (API na Alemanha, banco em São Paulo,
~180ms por comando nos logs — ver `docs/incidente-2026-09-17-timeout-login-rede-lenta.md`). Com API e
banco na mesma máquina em São Paulo, essa latência some e a distância até os usuários cai.

---

## 2. Arquitetura proposta

```
VPS em São Paulo (Ubuntu LTS)
└── Docker Compose
    ├── caddy     :80 / :443  TLS automático, compressão, fallback de SPA
    │     ├── app.pluralplataforma.com  -> arquivos estáticos do web-app
    │     ├── adm.pluralplataforma.com  -> arquivos estáticos do web (admin)
    │     ├── domínio do mobile web     -> arquivos estáticos do expo export
    │     └── api.pluralplataforma.com  -> api:8080 (+ arquivos de artigos)
    ├── api       .NET 9 em Linux
    └── postgres  mesma versão major do Supabase, volume persistente

Backup: pg_dump diário -> Cloudflare R2 (fora da VPS), com restore testado
CI/CD:  GitHub Actions (ubuntu) -> build -> deploy por SSH
```

### Decisões e trade-offs

- **Região São Paulo.** Reduz latência para usuários e elimina o tráfego API↔banco entre continentes.
- **Uma VPS só.** Mais barato e simples. Ponto único de falha, mitigado por backup externo testado.
  Separar banco em outra VPS fica para quando a carga pedir.
- **Docker Compose.** Ambiente reproduzível e versionado no repositório. Alternativa: `systemd` com
  `dotnet` e Postgres instalados direto, com menos coisa nova para aprender e menos reprodutibilidade.
- **Caddy em vez de Nginx.** Certificado e renovação automáticos, configuração curta.
- **Storage de artigos.** Endpoint de upload na API gravando em volume local, servido pelo Caddy.
  Alternativa: Cloudflare R2, se não quiserem arquivo na VPS. Em ambos os casos a anon key do Supabase
  sai do front.
- **Preview deploys por PR deixam de existir** ao sair da Vercel.

---

## 3. Estimativa de esforço

Considera um dev sênior dedicado.

| # | Etapa | Detalhes | Esforço |
| --- | --- | --- | --- |
| 1 | Provisionar e proteger a VPS | Usuário sem root, SSH só por chave, `ufw`, `fail2ban`, updates automáticos, Docker | 0,5–1d |
| 2 | Caddy | Domínios, TLS, compressão, fallback de SPA, headers de segurança | 0,5d |
| 3 | API em Linux | Dockerfile; fontes e dependências nativas do QuestPDF; diretório de trabalho correto (`EmailService` lê `Templates/` por caminho relativo); `ForwardedHeaders` para o Caddy (hoje configurado para IIS/ARR, `Program.cs`); volume de logs do Serilog; variáveis de ambiente | 1–1,5d |
| 4 | Postgres | Subir e ajustar configuração; dump/restore só do schema `public` (sem `auth`, `storage` e demais schemas do Supabase); conferir `__EFMigrationsHistory`; backup diário para R2 com restore testado | 1,5–2d |
| 5 | Storage de artigos | Endpoint de upload na API; trocar upload do admin; copiar arquivos do bucket; atualizar URLs em `Artigo` | 1–1,5d |
| 6 | Frontends | Build com a nova `VITE_API_URL` / `API_URL` e publicação dos 3 apps | 0,5–1d |
| 7 | CI/CD | Reescrever `build_monster_desenv.yaml` e `build_monster_production.yaml` para Linux com deploy por SSH, dev e prod | 1–1,5d |
| 8 | DNS e integrações | Registros na HostGator, CORS em `Program.cs`, URL do webhook da Hotmart, saída SMTP liberada na VPS | 0,5d |
| 9 | Monitoramento | Uptime externo, alerta de disco, rotação de logs | 0,5d |
| 10 | Virada | Ensaio em staging, janela de manutenção, dump final, smoke test, plano de rollback | 1d |

**Total: 8 a 11 dias úteis. Com margem de 25%: 10 a 14 dias úteis (2 a 3 semanas de calendário).**

Fora da estimativa:

- Ambiente de dev em VPS separada: +1d.
- Preview deploy por PR (equivalente ao da Vercel): +1 a 2d.

---

## 4. Custo mensal

Preços consultados em 17/09/2026.

### Opção recomendada: Hostinger, datacenter no Brasil

| Plano | vCPU | RAM | NVMe | Tráfego | Promoção (contrato de 24 meses) | Renovação |
| --- | --- | --- | --- | --- | --- | --- |
| KVM 2 | 2 | 8 GB | 100 GB | 8 TB | R$ 43,99/mês | R$ 77,99/mês |
| KVM 4 | 4 | 16 GB | 200 GB | 16 TB | R$ 59,99/mês | R$ 149,99/mês |

- O preço promocional exige pagar os 24 meses adiantados. No KVM 2, cerca de R$ 1.056 à vista.
- A renovação custa de 1,8x a 2,5x o valor promocional. Orçar pelo valor de renovação.
- O backup incluído é semanal. Para banco de produção não basta: o backup diário externo continua
  obrigatório.

**Recomendação: KVM 2.** 8 GB comportam Postgres, API e Caddy com a carga atual, e o upgrade de plano
é feito sem migrar de servidor. O KVM 4 só se justifica se o banco for grande, já que os arquivos da
biblioteca ficam dentro dele e 100 GB de disco podem apertar (ver pendência 1).

### Custos adicionais

| Item | Custo |
| --- | --- |
| Backup diário do `pg_dump` no Cloudflare R2 | Grátis até 10 GB; acima disso, ~US$ 0,015/GB/mês |
| Monitoramento de uptime (UptimeRobot ou Better Stack, plano gratuito) | R$ 0 |
| Certificados TLS (Caddy + Let's Encrypt) | R$ 0 |
| Domínio e e-mail Titan | Sem mudança |

**Total estimado: R$ 50 a R$ 90 por mês** (VPS + backup), dependendo de promoção ou renovação.

### Alternativas avaliadas

| Provedor | Situação |
| --- | --- |
| Vultr (São Paulo) | Região disponível, cobrança em dólar por hora. Preço do plano de 8 GB na região não confirmado. Acima da Hostinger na renovação e sujeito a câmbio |
| Magalu Cloud | Cobra em reais. Preço só na calculadora do site, não extraído |
| HostMF | 4 vCPU, 8 GB, 80 GB NVMe a partir de R$ 109,90/mês. Mais caro e com menos disco |
| AWS Lightsail | US$ 44/mês no plano de 8 GB, mas sem região em São Paulo encontrada. Descartado |

### Custo que não aparece na fatura

Manutenção estimada em **2 a 4 horas por mês**: patches de segurança, conferência de restore do backup,
disco e logs. É o trabalho que Vercel e Supabase fazem hoje.

---

## 5. Riscos

| # | Risco | Mitigação |
| --- | --- | --- |
| 1 | `plural.runasp.net` é domínio da MonsterASP e para de responder ao cancelar o plano. App mobile publicado nas lojas com essa URL quebra | Publicar versão com `api.pluralplataforma.com` antes da virada, ou manter a MonsterASP fazendo proxy por algumas semanas |
| 2 | Webhook da Hotmart apontando para a URL antiga | Atualizar no painel da Hotmart na virada. O job de reconciliação diário ameniza, mas não substitui |
| 3 | Tamanho do banco define o tempo de indisponibilidade na virada | Medir antes (pendência 1) e ensaiar o dump/restore em staging |
| 4 | CI usa `setup-dotnet` 8.x com projeto `net9.0` (funciona hoje porque o runner Windows já traz o SDK 9) | Fixar `9.0.x` no workflow novo |
| 5 | Operação passa a ser da equipe: patches, disco cheio, backup | Monitoramento, alerta de disco e teste periódico de restore |
| 6 | VPS única fora do ar derruba tudo | Backup externo testado e runbook de reconstrução da VPS |

---

## 6. Pendências antes de fechar prazo e plano

| # | Item | Observação |
| --- | --- | --- |
| 1 | Tamanho do banco | Rodar no SQL Editor do Supabase: `select pg_size_pretty(pg_database_size('postgres'));` e somar o tamanho do bucket `artigos` |
| 2 | App mobile nas lojas | Confirmar se existe build nativo publicado e qual `API_URL` ele usa |
| 3 | Custos atuais | Levantar Vercel, plano pedido pelo Supabase e MonsterASP para comparar com R$ 50–90/mês |
| 4 | Mapa de domínios da Vercel | Confirmar quais projetos servem `pluralplataforma.com`, `www`, `app`, `adm`, `devs` e o domínio do mobile web |
| 5 | Escolha do provedor e plano | Hostinger KVM 2 recomendado, sujeito à pendência 1 |

## 7. Próximos passos (após aprovação)

1. Contratar a VPS.
2. Criar no repositório: `docker-compose.yml`, `Dockerfile` da API, `Caddyfile`, workflows novos de
   deploy e endpoint de upload de artigos.
3. Escrever runbook da virada (passo a passo, checklist de smoke test e rollback).
4. Ensaiar a migração completa em staging antes da janela de produção.

---

## Fontes de preço (consultadas em 17/09/2026)

- Hostinger – Servidor VPS: https://www.hostinger.com/br/servidor-vps
- Hostinger – VPS in Brazil: https://www.hostinger.com/vps/servers/brazil
- HostMF – VPS SSD 8GB 4vCPU: https://hostmf.com.br/vps-pro/vps-ssd-8gb-6vcpu
- Vultr – Pricing: https://www.vultr.com/pricing/
- Magalu Cloud – Preços: https://magalu.cloud/precos/
- CloudBurn – Amazon Lightsail Pricing 2026: https://cloudburn.io/blog/amazon-lightsail-pricing
