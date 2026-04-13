using api.DTOs.Bloco;
using System.ComponentModel.DataAnnotations;

namespace api.DTOs.AvaliacaoDiagnostica
{
    // DTO auxiliar para bloco + atividades selecionadas
    public class BlocoSelecionadoDTO
    {
        [Required]
        public int BlocoId { get; set; }

        [Required]
        public List<int> AtividadeIds { get; set; } = new List<int>();
    }

    // DTO para criação (POST cadastro) — agora com blocos aninhados
    public class AvaliacaoDiagnosticaDTO
    {
        [Required]
        [StringLength(150)]
        public string Titulo { get; set; } = string.Empty;

        public string? Objetivo { get; set; }

        public DateTime? DataAplicacao { get; set; }

        public int? EscolaId { get; set; }

        public List<int> AlunoIds { get; set; } = new List<int>();

        // Agora é uma lista de blocos com suas atividades selecionadas
        public List<BlocoSelecionadoDTO> Blocos { get; set; } = new List<BlocoSelecionadoDTO>();
    }

    // DTO para listagem simples (mantido)
    public class AvaliacaoDiagnosticaBuscarDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Objetivo { get; set; }
        public DateTime DataAplicacao { get; set; }
        public int? EscolaId { get; set; }
        public bool Concluida { get; set; }
        public int? ProfessorId { get; set; }
    }

    // DTO detalhado — agora retorna blocos com atividades selecionadas
    public class AvaliacaoDiagnosticaAlunoParticipanteDTO
    {
        public int AlunoId { get; set; }
        public AvaliacaoDiagnosticaAlunoDTO? Aluno { get; set; }
    }

    public class AvaliacaoDiagnosticaAlunoDTO
    {
        public int Id { get; set; }
        public string NomeCompleto { get; set; } = string.Empty;
    }

    public class AvaliacaoDiagnosticaRegistroDesempenhoDTO
    {
        public int Id { get; set; }
        public int AlunoId { get; set; }
        public int AtividadeId { get; set; }
        public string NivelRealizacao { get; set; } = "NaoAvaliado";
        public string? Observacao { get; set; }
        public DateTime DataRegistro { get; set; }
    }

    public class AvaliacaoDiagnosticaObservacaoAlunoDTO
    {
        public int AlunoId { get; set; }
        public string? Observacao { get; set; }
    }

    public class AvaliacaoDiagnosticaDetailDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Objetivo { get; set; }
        public DateTime DataAplicacao { get; set; }
        public int? EscolaId { get; set; }

        /// <summary>Nome da escola (preenchido ao montar o detalhe; usado em PDF e telas).</summary>
        public string? EscolaNome { get; set; }

        public bool Concluida { get; set; }
        public List<int> AlunoIds { get; set; } = new();
        public List<AvaliacaoDiagnosticaAlunoParticipanteDTO> AlunosParticipantes { get; set; } = new();
        public List<AvaliacaoDiagnosticaRegistroDesempenhoDTO> RegistrosDesempenho { get; set; } = new();
        public List<AvaliacaoDiagnosticaObservacaoAlunoDTO> ObservacoesAlunos { get; set; } = new();
        public List<BlocoComAtividadesDTO> BlocosComAtividades { get; set; } = new(); // usa o DTO que você já tem
    }

    // DTO para atualização (PUT) — mesmo formato aninhado
    public class UpdateAvaliacaoDiagnosticaDTO
    {
        public int Id { get; set; }

        [StringLength(150)]
        public string? Titulo { get; set; }

        public string? Objetivo { get; set; }

        public DateTime? DataAplicacao { get; set; }

        public int? EscolaId { get; set; }

        public bool? Concluida { get; set; }

        public List<int>? AlunoIds { get; set; }

        public List<BlocoSelecionadoDTO>? Blocos { get; set; } // se enviado, substitui tudo
    }
}