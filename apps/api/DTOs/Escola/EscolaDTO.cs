using api.Models;
namespace api.DTOs.Escola;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class EscolaDTO
{
    public string NomeInstituicao { get; set; }

    [MaxLength(45)]
    public string Tipo { get; set; }

    [MaxLength(9)]
    public string Cep { get; set; }

    [MaxLength(50)]
    public string Logradouro { get; set; }

    public int Numero { get; set; }

    [MaxLength(100)]
    public string Complemento { get; set; }

    [MaxLength(50)]
    public string Bairro { get; set; }

    [MaxLength(40)]
    public string Estado { get; set; }

    [MaxLength(40)]
    public string Cidade { get; set; }

}
