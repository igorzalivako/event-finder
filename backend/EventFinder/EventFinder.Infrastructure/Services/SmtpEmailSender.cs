using EventFinder.Application.Interfaces;
using EventFinder.Infrastructure.Options;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using SmtpClient = MailKit.Net.Smtp.SmtpClient;

namespace EventFinder.Infrastructure.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;

    public SmtpEmailSender(IOptions<SmtpOptions> options)
    {
        _options = options.Value;
    }

    public async Task SendVerificationEmailAsync(string toEmail, string verificationLink, CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();

        message.From.Add(MailboxAddress.Parse(_options.SmtpUser));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Подтверждение email";

        var builder = new BodyBuilder
        {
            TextBody =
$@"Привет!

Спасибо за регистрацию.
Для активации аккаунта перейдите по ссылке:

{verificationLink}

Ссылка действует 24 часа.",
            HtmlBody =
$@"
<h2>Привет!</h2>
<p>Спасибо за регистрацию.</p>
<p>Для активации аккаунта перейдите по ссылке:</p>
<p><a href=""{verificationLink}"">{verificationLink}</a></p>
<p>Ссылка действует 24 часа.</p>"
        };

        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();

        await client.ConnectAsync(_options.SmtpHost, _options.SmtpPort, SecureSocketOptions.StartTls, cancellationToken);
        await client.AuthenticateAsync(_options.SmtpUser, _options.SmtpPassword, cancellationToken);
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    public async Task SendResetPasswordEmailAsync(string? email, string verificationLink, CancellationToken cancellationToken)
    {
        var message = new MimeMessage();

        message.From.Add(MailboxAddress.Parse(_options.SmtpUser));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "Сброс пароля";

        var builder = new BodyBuilder
        {
            TextBody =
$@"Привет!

С вашего аккаунта выполнен запрос на сброс пароля.
Для сброса пароля перейдите по ссылке:

{verificationLink}

Ссылка действует 24 часа.",
            //            HtmlBody =
            //$@"
            //<h2>Привет!</h2>
            //<p>Спасибо за регистрацию.</p>
            //<p>Для активации аккаунта перейдите по ссылке:</p>
            //<p><a href=""{verificationLink}"">{verificationLink}</a></p>
            //<p>Ссылка действует 24 часа.</p>"
        };

        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();

        await client.ConnectAsync(_options.SmtpHost, _options.SmtpPort, SecureSocketOptions.StartTls, cancellationToken);
        await client.AuthenticateAsync(_options.SmtpUser, _options.SmtpPassword, cancellationToken);
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}