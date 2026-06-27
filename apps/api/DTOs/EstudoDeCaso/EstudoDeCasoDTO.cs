namespace api.DTOs.EstudoDeCaso;

public class EstudoDeCasoEixoCatalogoDTO
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Rotulo { get; set; } = string.Empty;
    public string? DescricaoHint { get; set; }
    public int OrdemExibicao { get; set; }
}

public class EstudoDeCasoItemEixoDTO
{
    public int EixoCatalogoId { get; set; }
    public string? Anotacao { get; set; }
}

public class EstudoDeCasoCadastroDTO
{
    public int AlunoId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string ContextoSituacao { get; set; } = string.Empty;
    public string? Potencialidades { get; set; }
    public List<EstudoDeCasoItemEixoDTO> ItensEixo { get; set; } = new();
}

/// <summary>Atualização de estudo existente (aluno não pode ser alterado).</summary>
public class EstudoDeCasoAtualizacaoDTO
{
    public string Titulo { get; set; } = string.Empty;
    public string ContextoSituacao { get; set; } = string.Empty;
    public string? Potencialidades { get; set; }
    public List<EstudoDeCasoItemEixoDTO> ItensEixo { get; set; } = new();
}

public class EstudoDeCasoItemDetalheDTO : EstudoDeCasoItemEixoDTO
{
    public string CodigoEixo { get; set; } = string.Empty;
    public string RotuloEixo { get; set; } = string.Empty;
}

public class EstudoDeCasoDetalheDTO
{
    public int Id { get; set; }
    public int AlunoId { get; set; }
    public string AlunoNomeCompleto { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string ContextoSituacao { get; set; } = string.Empty;
    public string? Potencialidades { get; set; }
    public string? TextoSimulado { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<EstudoDeCasoItemDetalheDTO> ItensEixo { get; set; } = new();
}

public class EstudoDeCasoListaItemDTO
{
    public int Id { get; set; }
    public int AlunoId { get; set; }
    public string AlunoNomeCompleto { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public bool PossuiTextoSimulado { get; set; }
}
