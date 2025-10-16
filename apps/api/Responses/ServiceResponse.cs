using api.DTOs.Professor;

namespace api.Responses
{
    public class ServiceResponse<T>
    {
        public bool Sucesso { get; set; } = true;

        public List<string> Mensagens { get; set; } = new();

        public T? Objeto { get; set; }
        public List<T>? ListaObjetos { get; set; } = new();

        public void AdicionaMensagem(string mensagem)
        {
            Mensagens.Add(mensagem);
        }

        public void AdicionaMensagem(IEnumerable<string> mensagens)
        {
            Mensagens.AddRange(mensagens);
        }

        public void AdicionaObjeto(T objeto)
        {
            Objeto = objeto;
        }

        public void AdicionaObjetos(IEnumerable<T> objetos)
        {
            ListaObjetos.AddRange(objetos);
        }

        public void SetFalha(string mensagem)
        {
            Sucesso = false;
            AdicionaMensagem(mensagem);
        }
    }

}
