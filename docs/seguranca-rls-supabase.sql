-- Correção dos 49 alertas "RLS Disabled in Public" do advisor do Supabase.
--
-- Contexto: o banco é acessado exclusivamente pela API .NET, via conexão Postgres direta
-- com o usuário `postgres` (owner das tabelas criadas pelo EF). Nenhum app do monorepo usa
-- o client do Supabase / PostgREST. Como o owner da tabela não é submetido a RLS (a menos
-- que se use FORCE ROW LEVEL SECURITY), habilitar RLS sem criar política nenhuma fecha o
-- acesso pela Data API e não afeta a API .NET.
--
-- Ordem de execução: bloco 1 (diagnóstico) -> bloco 2 (RLS) -> bloco 3 (revoke) -> bloco 4
-- (conferência). Rodar no SQL Editor do Supabase.

-- ---------------------------------------------------------------------------------------
-- 1. DIAGNÓSTICO — rodar ANTES de qualquer alteração.
--    Só siga adiante se o usuário da API aparecer com rolsuper = true OU rolbypassrls = true,
--    ou se ele for o tableowner de todas as tabelas listadas abaixo.
-- ---------------------------------------------------------------------------------------

select rolname, rolsuper, rolbypassrls
from pg_roles
where rolname in ('postgres', 'authenticator', 'anon', 'authenticated', 'service_role');

select tablename, tableowner, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- ---------------------------------------------------------------------------------------
-- 2. HABILITA RLS em todas as tabelas do schema public (idempotente).
--    Sem política criada = nenhum acesso via Data API (anon/authenticated).
-- ---------------------------------------------------------------------------------------

do $$
declare
    t record;
begin
    for t in
        select tablename
        from pg_tables
        where schemaname = 'public'
    loop
        execute format('alter table public.%I enable row level security', t.tablename);
    end loop;
end $$;

-- ---------------------------------------------------------------------------------------
-- 3. DEFESA EM PROFUNDIDADE — retira privilégios dos papéis expostos pela Data API.
--    Mesmo sem RLS, anon/authenticated deixam de ler e escrever qualquer tabela.
-- ---------------------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- ---------------------------------------------------------------------------------------
-- 4. CONFERÊNCIA — todas as linhas devem voltar com rowsecurity = true e sem política.
-- ---------------------------------------------------------------------------------------

select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and rowsecurity = false;

select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public';

-- ---------------------------------------------------------------------------------------
-- 5. ROLLBACK — usar apenas se a API parar de responder depois do bloco 2.
--    Reabre o acesso e devolve o banco ao estado inseguro atual; nesse caso o problema é
--    que o usuário da API não é owner nem tem BYPASSRLS, e a solução é criar políticas
--    em vez de desligar RLS.
-- ---------------------------------------------------------------------------------------

-- do $$
-- declare
--     t record;
-- begin
--     for t in
--         select tablename
--         from pg_tables
--         where schemaname = 'public'
--     loop
--         execute format('alter table public.%I disable row level security', t.tablename);
--     end loop;
-- end $$;
