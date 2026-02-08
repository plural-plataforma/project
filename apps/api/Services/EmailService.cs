using api.DTOs.Email;
using api.Responses;
using MailKit.Net.Smtp;
using MimeKit;

namespace api.Services
{
    public class EmailService
    {

        private readonly string _origemEmail;
        private readonly string _senhaEmail;
        private readonly string _smtpServer;
        private readonly string _smtpPorta;
        private readonly string _senhaPadrao;
        public EmailService(IConfiguration config)
        {
            _origemEmail = config["ORIGEM_EMAIL"];
            _senhaEmail = config["SENHA_EMAIL"];
            _smtpServer = config["SMTP_SERVER"];
            _smtpPorta = config["SMTP_PORTA"];
            _senhaPadrao = config["SENHA_PADRAO"];
        }

        public async Task<ServiceResponse<bool>> EnviarEmail(EmailDTO dadosEmail)
        {
            var resposta = new ServiceResponse<bool>();

            MimeMessage email = new MimeMessage();

            email.From.Add(new MailboxAddress("Plural Plataforma", _origemEmail));
            email.To.Add(new MailboxAddress(dadosEmail.NomeDestinatario, dadosEmail.Destino));
            email.Subject = dadosEmail.Assunto;

            string template = File.ReadAllText("Templates/bemVindo.html");
            string mensagemHtml = template
                .Replace("{{NomeDestinatario}}", dadosEmail.NomeDestinatario)
                .Replace("{{SenhaPadrao}}", _senhaPadrao);

            email.Body = new TextPart(MimeKit.Text.TextFormat.Html)
            {
                Text = mensagemHtml
            };

            try
            {
                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(_smtpServer, int.Parse(_smtpPorta), MailKit.Security.SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(_origemEmail, _senhaEmail);

                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);
            }
            catch (Exception e)
            {
                resposta.SetFalha("Ocorreu um erro ao enviar o email para o usuário.");
                return resposta;
            }

            resposta.Sucesso = true;
            return resposta;

        }

    }
}
