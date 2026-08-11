namespace api.Services.IA
{
    public interface IGeradorTextoIA
    {
        Task<string> GerarTextoAsync(string systemPrompt, string prompt);
    }
}
