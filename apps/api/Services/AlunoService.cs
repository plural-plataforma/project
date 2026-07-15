using api.DTOs.Aluno;
using api.DTOs.Avaliacao;
using api.DTOs.Estrategia;
using api.DTOs.Habilidade;
using api.DTOs.Laudo;
using api.DTOs.Planejamento;
using api.DTOs.Responsavel;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace api.Services
{
    public class AlunoService
    {
        private static readonly JsonSerializerOptions JsonDiasOptions = new() { PropertyNameCaseInsensitive = true };

        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public AlunoService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
        }

        private static readonly HashSet<string> DiasUteisPermitidos = new(StringComparer.Ordinal)
        {
            "Segunda", "Terça", "Quarta", "Quinta", "Sexta",
        };

        private static List<string> DeserializeDiasSemana(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return [];
            try
            {
                return JsonSerializer.Deserialize<List<string>>(json, JsonDiasOptions) ?? [];
            }
            catch
            {
                return [];
            }
        }

        private static string? SerializeDiasSemana(List<string> dias)
        {
            if (dias == null || dias.Count == 0)
                return null;
            return JsonSerializer.Serialize(dias);
        }

        /// <summary>Converte entrada da UI para rótulos canônicos (pt-BR).</summary>
        private static bool TryCanonizarDiaSemana(string entrada, out string canonico)
        {
            canonico = "";
            if (string.IsNullOrWhiteSpace(entrada))
                return false;
            var k = entrada.Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD);
            // remove combining marks for robust compare
            var chars = k.Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark).ToArray();
            k = new string(chars);
            canonico = k switch
            {
                "segunda" or "segunda-feira" => "Segunda",
                "terca" or "terça" or "terca-feira" or "terça-feira" => "Terça",
                "quarta" or "quarta-feira" => "Quarta",
                "quinta" or "quinta-feira" => "Quinta",
                "sexta" or "sexta-feira" => "Sexta",
                _ => ""
            };
            return !string.IsNullOrEmpty(canonico);
        }

        private static List<string> CanonizarDiasSemana(List<string> dias)
        {
            var resultado = new List<string>();
            foreach (var d in dias)
            {
                if (TryCanonizarDiaSemana(d, out var c))
                    resultado.Add(c);
                else
                    throw new ArgumentException($"Dia da semana inválido: \"{d}\". Use Segunda, Terça, Quarta, Quinta ou Sexta.");
            }
            return resultado;
        }

        private static void ValidarAtendimento(int frequenciaSemanal, List<string> diasCanon)
        {
            if (frequenciaSemanal < 1 || frequenciaSemanal > 5)
                throw new ArgumentException("Frequência semanal deve ser entre 1 e 5 (dias úteis).");
            if (diasCanon.Count != frequenciaSemanal)
                throw new ArgumentException($"Informe exatamente {frequenciaSemanal} dia(s) da semana, conforme a frequência de atendimento.");
            if (diasCanon.Distinct(StringComparer.Ordinal).Count() != diasCanon.Count)
                throw new ArgumentException("Não repita o mesmo dia da semana na lista.");
            if (diasCanon.Any(d => !DiasUteisPermitidos.Contains(d)))
                throw new ArgumentException("Selecione apenas dias úteis (Segunda a Sexta).");
        }

        private static void ValidarTipoAtendimento(TipoAtendimentoAee tipo)
        {
            if (tipo == TipoAtendimentoAee.Itinerante)
                throw new ArgumentException("Tipo de atendimento Itinerante não está disponível.");
            if (!Enum.IsDefined(typeof(TipoAtendimentoAee), tipo) || (int)tipo > (int)TipoAtendimentoAee.Colaborativo)
                throw new ArgumentException("Tipo de atendimento inválido.");
        }

        private static string? NormalizarPerfilPedagogico(string? valor) =>
            string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

        private static string? ResolverPerfilPedagogico(string? perfil, string? legadoPot, string? legadoNec)
        {
            var atual = NormalizarPerfilPedagogico(perfil);
            if (!string.IsNullOrEmpty(atual))
                return atual;

            var partes = new[] { legadoPot, legadoNec }
                .Select(NormalizarPerfilPedagogico)
                .Where(p => !string.IsNullOrEmpty(p))
                .ToList();

            return partes.Count == 0 ? null : string.Join("\n\n", partes!);
        }

        private static void HydratePerfilPedagogicoDto(AlunoBuscarDTO dto)
        {
            dto.PerfilPedagogico = ResolverPerfilPedagogico(
                dto.PerfilPedagogico,
                dto.PerfilPedagogicoPotencialidades,
                dto.PerfilPedagogicoNecessidades);
            dto.PerfilPedagogicoPotencialidades = null;
            dto.PerfilPedagogicoNecessidades = null;
        }

        private static string? ValidarDataNascimentoObrigatoria(DateOnly data)
        {
            if (data == default)
                return "Data de nascimento é obrigatória.";
            var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
            if (data > hoje)
                return "Data de nascimento não pode ser futura.";
            if (data.Year < 1900)
                return "Data de nascimento inválida.";
            return null;
        }

        private static void HydrateDiasSemanaDto(AlunoBuscarDTO dto)
        {
            dto.DiasSemanaAtendimento = DeserializeDiasSemana(dto.DiasSemanaAtendimentoJson);
            dto.DiasSemanaAtendimentoJson = null;
        }

        public async Task<ServiceResponse<AlunoCadastroDTO>> Cadastro(AlunoCadastroDTO alunoDTO, Usuario usuario)
        {
            var resposta = new ServiceResponse<AlunoCadastroDTO>();
            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    List<string> diasCanon;
                    try
                    {
                        diasCanon = CanonizarDiasSemana(alunoDTO.DiasSemanaAtendimento);
                        ValidarAtendimento(alunoDTO.FrequenciaSemanalAtendimento, diasCanon);
                        ValidarTipoAtendimento(alunoDTO.TipoAtendimentoAee);
                    }
                    catch (ArgumentException ex)
                    {
                        resposta.SetFalha(ex.Message);
                        return resposta;
                    }

                    var errDnCadastro = ValidarDataNascimentoObrigatoria(alunoDTO.DataNascimento);
                    if (errDnCadastro != null)
                    {
                        resposta.SetFalha(errDnCadastro);
                        return resposta;
                    }

                    Responsavel responsavel = new Responsavel()
                    {
                        NomeCompleto = alunoDTO.Responsavel.NomeCompleto,
                        Telefone = alunoDTO.Responsavel.Telefone,
                        Email = alunoDTO.Responsavel.Email ?? ""
                    };

                    _contexto.Responsaveis.Add(responsavel);
                    await _contexto.SaveChangesAsync();

                    Aluno aluno = new Aluno
                    {
                        NomeCompleto = alunoDTO.NomeCompleto,
                        DataNascimento = alunoDTO.DataNascimento,
                        FrequenciaSemanalAtendimento = alunoDTO.FrequenciaSemanalAtendimento,
                        DiasSemanaAtendimentoJson = SerializeDiasSemana(diasCanon),
                        DuracaoAtendimentoMinutos = alunoDTO.DuracaoAtendimentoMinutos,
                        TipoAtendimentoAee = alunoDTO.TipoAtendimentoAee,
                        PerfilPedagogico = NormalizarPerfilPedagogico(alunoDTO.PerfilPedagogico),
                        PerfilPedagogicoPotencialidades = null,
                        PerfilPedagogicoNecessidades = null,
                        Cep = alunoDTO.Cep,
                        Logradouro = alunoDTO.Logradouro,
                        Numero = alunoDTO.Numero.HasValue ? (int)alunoDTO.Numero : 0,
                        Complemento = alunoDTO.Complemento,
                        Bairro = alunoDTO.Bairro,
                        Estado = alunoDTO.Estado,
                        Cidade = alunoDTO.Cidade,
                        Telefone = alunoDTO.Telefone,
                        NivelEnsino = alunoDTO.NivelEnsino,
                        Ano = alunoDTO.Ano,
                        Turno = alunoDTO.Turno,
                        Sexo = alunoDTO.Sexo,
                        IdEscola = alunoDTO.IdEscola,
                        IdProfessor = usuario.ProfessorId ?? 0,
                        IdResponsavel = responsavel.Id
                    };
                    _contexto.Alunos.Add(aluno);
                    await _contexto.SaveChangesAsync();

                    if (alunoDTO.Laudos != null && alunoDTO.Laudos.Any())
                    {
                        var laudos = alunoDTO.Laudos.Select(l => new Laudo
                        {
                            CodigoCid = l.CodigoCid,
                            NomeMedico = l.NomeMedico,
                            Descricao = l.Descricao,
                            IdAluno = aluno.Id
                        }).ToList();

                        _contexto.Laudos.AddRange(laudos);
                        await _contexto.SaveChangesAsync();
                    }

                    await transacao.CommitAsync();
                    resposta.Sucesso = true;
                    return resposta;
                }
                catch (Exception)
                {

                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar aluno.");
                    throw;
                }
            }

        }
        
        public async Task<ServiceResponse<AlunoAtualizarDTO>> Atualizar(Usuario usuario, AlunoAtualizarDTO alunoDTO)
        {
            var resposta = new ServiceResponse<AlunoAtualizarDTO>();

            try
            {
                Aluno aluno = await _contexto.Alunos.FirstOrDefaultAsync(a => a.Id == alunoDTO.Id && a.IdProfessor == usuario.ProfessorId);
                if (aluno == null)
                {
                    resposta.SetFalha("Aluno não encontrado.");
                    return resposta;
                }

                if (alunoDTO.DataNascimento.HasValue)
                {
                    var errDnAtual = ValidarDataNascimentoObrigatoria(alunoDTO.DataNascimento.Value);
                    if (errDnAtual != null)
                    {
                        resposta.SetFalha(errDnAtual);
                        return resposta;
                    }
                }
                else if (!aluno.DataNascimento.HasValue)
                {
                    resposta.SetFalha("Data de nascimento é obrigatória. Informe no cadastro do aluno.");
                    return resposta;
                }

                if (!string.IsNullOrEmpty(alunoDTO.NomeCompleto))
                {
                    aluno.NomeCompleto = alunoDTO.NomeCompleto;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Cep))
                {
                    aluno.Cep = alunoDTO.Cep;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Logradouro))
                {
                    aluno.Logradouro = alunoDTO.Logradouro;
                }

                if (alunoDTO.Numero.HasValue)
                {
                    aluno.Numero = (int)alunoDTO.Numero;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Complemento))
                {
                    aluno.Complemento = alunoDTO.Complemento;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Bairro))
                {
                    aluno.Bairro = alunoDTO.Bairro;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Estado))
                {
                    aluno.Estado = alunoDTO.Estado;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Cidade))
                {
                    aluno.Cidade = alunoDTO.Cidade;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Telefone))
                {
                    aluno.Telefone = alunoDTO.Telefone;
                }

                if (!string.IsNullOrEmpty(alunoDTO.NivelEnsino))
                {
                    aluno.NivelEnsino = alunoDTO.NivelEnsino;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Ano))
                {
                    aluno.Ano = alunoDTO.Ano;
                }
                if (!string.IsNullOrEmpty(alunoDTO.Turno))
                {
                    aluno.Turno = alunoDTO.Turno;
                }
                if (alunoDTO.IdEscola != 0)
                {
                    aluno.IdEscola = (int)alunoDTO.IdEscola;
                }
                if (!string.IsNullOrEmpty(alunoDTO.Sexo))
                {
                    aluno.Sexo = alunoDTO.Sexo;
                }

                if (alunoDTO.DataNascimento.HasValue)
                    aluno.DataNascimento = alunoDTO.DataNascimento;

                if (alunoDTO.FrequenciaSemanalAtendimento.HasValue && alunoDTO.DiasSemanaAtendimento != null)
                {
                    try
                    {
                        var diasCanon = CanonizarDiasSemana(alunoDTO.DiasSemanaAtendimento);
                        ValidarAtendimento(alunoDTO.FrequenciaSemanalAtendimento.Value, diasCanon);
                        aluno.FrequenciaSemanalAtendimento = alunoDTO.FrequenciaSemanalAtendimento;
                        aluno.DiasSemanaAtendimentoJson = SerializeDiasSemana(diasCanon);
                    }
                    catch (ArgumentException ex)
                    {
                        resposta.SetFalha(ex.Message);
                        return resposta;
                    }
                }

                if (alunoDTO.DuracaoAtendimentoMinutos.HasValue)
                    aluno.DuracaoAtendimentoMinutos = alunoDTO.DuracaoAtendimentoMinutos;

                if (alunoDTO.TipoAtendimentoAee.HasValue)
                {
                    try
                    {
                        ValidarTipoAtendimento(alunoDTO.TipoAtendimentoAee.Value);
                        aluno.TipoAtendimentoAee = alunoDTO.TipoAtendimentoAee;
                    }
                    catch (ArgumentException ex)
                    {
                        resposta.SetFalha(ex.Message);
                        return resposta;
                    }
                }

                if (alunoDTO.PerfilPedagogico != null)
                {
                    aluno.PerfilPedagogico = NormalizarPerfilPedagogico(alunoDTO.PerfilPedagogico);
                    aluno.PerfilPedagogicoPotencialidades = null;
                    aluno.PerfilPedagogicoNecessidades = null;
                }

                if (alunoDTO.Responsavel != null && aluno.IdResponsavel.HasValue)
                {
                    var resp = await _contexto.Responsaveis.FirstOrDefaultAsync(r => r.Id == aluno.IdResponsavel.Value);
                    if (resp != null)
                    {
                        if (!string.IsNullOrWhiteSpace(alunoDTO.Responsavel.NomeCompleto))
                            resp.NomeCompleto = alunoDTO.Responsavel.NomeCompleto;
                        if (!string.IsNullOrWhiteSpace(alunoDTO.Responsavel.Telefone))
                            resp.Telefone = alunoDTO.Responsavel.Telefone;
                        if (alunoDTO.Responsavel.Email != null)
                            resp.Email = alunoDTO.Responsavel.Email;
                    }
                }

                if (alunoDTO.Laudos != null)
                {
                    var existentes = await _contexto.Laudos.Where(l => l.IdAluno == aluno.Id).ToListAsync();
                    _contexto.Laudos.RemoveRange(existentes);
                    var novos = alunoDTO.Laudos
                        .Where(l =>
                            !string.IsNullOrWhiteSpace(l.CodigoCid)
                            || !string.IsNullOrWhiteSpace(l.NomeMedico)
                            || !string.IsNullOrWhiteSpace(l.Descricao))
                        .Select(l => new Laudo
                        {
                            CodigoCid = l.CodigoCid ?? "",
                            NomeMedico = l.NomeMedico ?? "",
                            Descricao = l.Descricao ?? "",
                            IdAluno = aluno.Id
                        })
                        .ToList();
                    if (novos.Count > 0)
                        await _contexto.Laudos.AddRangeAsync(novos);
                }

                await _contexto.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }

            resposta.AdicionaMensagem("Cadastro de aluno atualizado com sucesso.");
            return resposta;
        }



        public async Task<ServiceResponse<List<AlunoBuscarDTO>>> Buscar(Usuario usuario)
        {
            var resposta = new ServiceResponse<List<AlunoBuscarDTO>>();
            try
            {
                var alunos = await _contexto.Alunos
                    .AsNoTracking()
                    .Where(a => a.IdProfessor == usuario.ProfessorId)
                    .Select(a => new AlunoBuscarDTO
                    {
                        Id = a.Id,
                        NomeCompleto = a.NomeCompleto,
                        Cep = a.Cep,
                        Logradouro = a.Logradouro,
                        Numero = a.Numero,
                        Complemento = a.Complemento,
                        Bairro = a.Bairro,
                        Estado = a.Estado,
                        Cidade = a.Cidade,
                        Telefone = a.Telefone,
                        IdEscola = a.IdEscola,
                        NivelEnsino = a.NivelEnsino,
                        Ano = a.Ano,
                        Turno = a.Turno,
                        Sexo = a.Sexo,
                        DataNascimento = a.DataNascimento,
                        FrequenciaSemanalAtendimento = a.FrequenciaSemanalAtendimento,
                        DiasSemanaAtendimentoJson = a.DiasSemanaAtendimentoJson,
                        DuracaoAtendimentoMinutos = a.DuracaoAtendimentoMinutos,
                        TipoAtendimentoAee = a.TipoAtendimentoAee,
                        PerfilPedagogico = a.PerfilPedagogico,
                        PerfilPedagogicoPotencialidades = a.PerfilPedagogicoPotencialidades,
                        PerfilPedagogicoNecessidades = a.PerfilPedagogicoNecessidades,

                        Responsavel = a.Responsavel != null
                            ? new ResponsavelCadastroSimplificadoDTO
                            {
                                NomeCompleto = a.Responsavel.NomeCompleto,
                                Telefone = a.Responsavel.Telefone,
                                Email = a.Responsavel.Email
                            }
                            : null,

                        Laudos = a.Laudos != null
                            ? a.Laudos.Select(l => new LaudoCadastroSimplificadoDTO
                            {
                                CodigoCid = l.CodigoCid,
                                NomeMedico = l.NomeMedico,
                                Descricao = l.Descricao
                            }).ToList()
                            : new List<LaudoCadastroSimplificadoDTO>(),
                        Planejamentos = a.AlunosXPlanejamentos != null
                            ? a.AlunosXPlanejamentos.Select(axp => new PlanejamentoBuscarSimplificadoDTO
                            {
                                Id = axp.Planejamento.ID,
                                Apelido = axp.Planejamento.Apelido,
                                DataInicio = axp.Planejamento.DataInicio,
                                DataFim = axp.Planejamento.DataFim,
                                Habilidades = axp.Planejamento.HabilidadesXPlanejamentos
                                    .Select(hxp => new HabilidadeBuscarDTO
                                    {
                                        Id = hxp.Habilidade.Id,
                                        Descricao = hxp.Habilidade.Descricao
                                    })
                                    .ToList(),
                                Estrategias = axp.Planejamento.EstrategiasXPlanejamentos
                                    .Select(hxp => new EstrategiaBuscarDTO
                                    {
                                        Id = hxp.Estrategia.Id,
                                        Descricao = hxp.Estrategia.Descricao
                                    })
                                    .ToList(),
                                Avaliacao = axp.Planejamento.AvaliacaoXPlanejamentos
                                    .Select(hxp => new AvaliacaoBuscarDTO
                                    {
                                        Id = hxp.Avaliacao.Id,
                                        Descricao = hxp.Avaliacao.Descricao,
                                        Resumo = hxp.Avaliacao.Resumo
                                    })
                                    .ToList()
                            }).ToList()
                            : new List<PlanejamentoBuscarSimplificadoDTO>()
                    })
                    .ToListAsync();
                foreach (var item in alunos)
                {
                    HydrateDiasSemanaDto(item);
                    HydratePerfilPedagogicoDto(item);
                }
                resposta.AdicionaObjeto(alunos);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar alunos.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<AlunoBuscarDTO>> Buscar(Usuario usuario, int idAluno)
        {
            var resposta = new ServiceResponse<AlunoBuscarDTO>();
            try
            {
                var aluno = await _contexto.Alunos
                    .AsNoTracking()
                    .Where(a => a.IdProfessor == usuario.ProfessorId && a.Id == idAluno)
                    .Select(a => new AlunoBuscarDTO
                    {
                        Id = a.Id,
                        NomeCompleto = a.NomeCompleto,
                        Cep = a.Cep,
                        Logradouro = a.Logradouro,
                        Numero = a.Numero,
                        Complemento = a.Complemento,
                        Bairro = a.Bairro,
                        Estado = a.Estado,
                        Cidade = a.Cidade,
                        Telefone = a.Telefone,
                        IdEscola = a.IdEscola,
                        NivelEnsino = a.NivelEnsino,
                        Ano = a.Ano,
                        Turno = a.Turno,
                        Sexo = a.Sexo,
                        DataNascimento = a.DataNascimento,
                        FrequenciaSemanalAtendimento = a.FrequenciaSemanalAtendimento,
                        DiasSemanaAtendimentoJson = a.DiasSemanaAtendimentoJson,
                        DuracaoAtendimentoMinutos = a.DuracaoAtendimentoMinutos,
                        TipoAtendimentoAee = a.TipoAtendimentoAee,
                        PerfilPedagogico = a.PerfilPedagogico,
                        PerfilPedagogicoPotencialidades = a.PerfilPedagogicoPotencialidades,
                        PerfilPedagogicoNecessidades = a.PerfilPedagogicoNecessidades,

                        Responsavel = a.Responsavel != null
                            ? new ResponsavelCadastroSimplificadoDTO
                            {
                                NomeCompleto = a.Responsavel.NomeCompleto,
                                Telefone = a.Responsavel.Telefone,
                                Email = a.Responsavel.Email
                            }
                            : null,

                        Laudos = a.Laudos != null
                            ? a.Laudos.Select(l => new LaudoCadastroSimplificadoDTO
                            {
                                CodigoCid = l.CodigoCid,
                                NomeMedico = l.NomeMedico,
                                Descricao = l.Descricao
                            }).ToList()
                            : new List<LaudoCadastroSimplificadoDTO>(),

                        Planejamentos = a.AlunosXPlanejamentos != null
                            ? a.AlunosXPlanejamentos.Select(axp => new PlanejamentoBuscarSimplificadoDTO
                            {
                                Id = axp.Planejamento.ID,
                                Apelido = axp.Planejamento.Apelido,
                                DataInicio = axp.Planejamento.DataInicio,
                                DataFim = axp.Planejamento.DataFim,
                                Habilidades = axp.Planejamento.HabilidadesXPlanejamentos
                                    .Select(hxp => new HabilidadeBuscarDTO
                                    {
                                        Id = hxp.Habilidade.Id,
                                        Descricao = hxp.Habilidade.Descricao
                                    })
                                    .ToList(),
                                Estrategias = axp.Planejamento.EstrategiasXPlanejamentos
                                    .Select(hxp => new EstrategiaBuscarDTO
                                    {
                                        Id = hxp.Estrategia.Id,
                                        Descricao = hxp.Estrategia.Descricao
                                    })
                                    .ToList(),
                                Avaliacao = axp.Planejamento.AvaliacaoXPlanejamentos
                                    .Select(hxp => new AvaliacaoBuscarDTO
                                    {
                                        Id = hxp.Avaliacao.Id,
                                        Descricao = hxp.Avaliacao.Descricao
                                    })
                                    .ToList()
                            }).ToList()
                            : new List<PlanejamentoBuscarSimplificadoDTO>()
                    })
                    .FirstOrDefaultAsync();

                if (aluno == null)
                {
                    resposta.SetFalha("Aluno não encontrado.");
                    return resposta;
                }

                HydrateDiasSemanaDto(aluno);
                HydratePerfilPedagogicoDto(aluno);

                resposta.AdicionaObjeto(aluno);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar aluno.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<bool>> Excluir(Usuario usuario, int idAluno)
        {
            var resposta = new ServiceResponse<bool>();

            try
            {
                using var transacao = await _contexto.Database.BeginTransactionAsync();

                var aluno = await _contexto.Alunos
                    .FirstOrDefaultAsync(a => a.Id == idAluno && a.IdProfessor == usuario.ProfessorId);

                if (aluno == null)
                {
                    resposta.SetFalha("Aluno não encontrado.");
                    return resposta;
                }

                var idResponsavel = aluno.IdResponsavel;

                // Remove dependências explícitas do aluno para evitar falha de FK ao excluir.
                var historicos = await _contexto.ObservacoesAlunosAvaliacaoHistorico
                    .Where(o => o.AlunoId == idAluno)
                    .ToListAsync();
                _contexto.ObservacoesAlunosAvaliacaoHistorico.RemoveRange(historicos);

                var desempenhos = await _contexto.DesempenhosAtividades
                    .Where(d => d.AlunoId == idAluno)
                    .ToListAsync();
                _contexto.DesempenhosAtividades.RemoveRange(desempenhos);

                var avaliacoesAluno = await _contexto.AvaliacoesAlunos
                    .Where(a => a.AlunoId == idAluno)
                    .ToListAsync();
                _contexto.AvaliacoesAlunos.RemoveRange(avaliacoesAluno);

                var diagnosticosFinais = await _contexto.DiagnosticosFinais
                    .Where(d => d.AlunoId == idAluno)
                    .ToListAsync();
                _contexto.DiagnosticosFinais.RemoveRange(diagnosticosFinais);

                var vinculosPlanejamento = await _contexto.AlunosXPlanejamentos
                    .Where(v => v.AlunoId == idAluno)
                    .ToListAsync();
                _contexto.AlunosXPlanejamentos.RemoveRange(vinculosPlanejamento);

                var laudos = await _contexto.Laudos
                    .Where(l => l.IdAluno == idAluno)
                    .ToListAsync();
                _contexto.Laudos.RemoveRange(laudos);

                _contexto.Alunos.Remove(aluno);
                await _contexto.SaveChangesAsync();

                if (idResponsavel.HasValue)
                {
                    var responsavelAindaEmUso = await _contexto.Alunos.AnyAsync(a => a.IdResponsavel == idResponsavel.Value);
                    if (!responsavelAindaEmUso)
                    {
                        var responsavel = await _contexto.Responsaveis.FindAsync(idResponsavel.Value);
                        if (responsavel != null)
                        {
                            _contexto.Responsaveis.Remove(responsavel);
                            await _contexto.SaveChangesAsync();
                        }
                    }
                }

                await transacao.CommitAsync();
                resposta.Sucesso = true;
                resposta.AdicionaObjeto(true);
                resposta.AdicionaMensagem("Aluno excluído com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }
        }
    }
}
