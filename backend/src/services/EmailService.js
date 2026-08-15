const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');

/**
 * EmailService - Envio de e-mails transacionais do sistema
 *
 * Envia via API do Gmail (HTTPS), não SMTP: alguns provedores de hospedagem
 * (ex.: Render) bloqueiam conexões SMTP de saída, então a API é usada no lugar.
 *
 * Configuração via .env:
 *   GMAIL_USER=seuemail@gmail.com
 *   GMAIL_CLIENT_ID=...apps.googleusercontent.com
 *   GMAIL_CLIENT_SECRET=GOCSPX-...
 *   GMAIL_REFRESH_TOKEN=...
 *   MAIL_FROM_NAME=Barbearia
 *   MAIL_FROM_ADDRESS=seuemail@gmail.com
 *
 * Se as credenciais não estiverem configuradas, o serviço entra em "modo console":
 * nenhum e-mail é enviado de verdade e o conteúdo é impresso no terminal.
 * Isso permite desenvolver sem credenciais, mas NUNCA deve ir para produção.
 */
class EmailService {
  static gmailClient = null;

  /**
   * Indica se as credenciais da API do Gmail estão presentes no ambiente
   * @returns {Boolean}
   */
  static isConfigured() {
    return Boolean(
      process.env.GMAIL_USER &&
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN
    );
  }

  /**
   * Cria (uma única vez) o cliente autenticado da API do Gmail
   * @returns {Object|null} cliente gmail ou null se não configurado
   */
  static getGmailClient() {
    if (!this.isConfigured()) {
      return null;
    }

    if (!this.gmailClient) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
      this.gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
    }

    return this.gmailClient;
  }

  /**
   * Monta o remetente no formato "Nome <email>"
   * @returns {String}
   */
  static getFrom() {
    const name = process.env.MAIL_FROM_NAME || 'Barbearia';
    const address = process.env.MAIL_FROM_ADDRESS || process.env.GMAIL_USER;
    return `"${name}" <${address}>`;
  }

  /**
   * Monta a mensagem MIME (assunto, texto e HTML) e retorna em base64url,
   * formato exigido pela API do Gmail.
   * @returns {Promise<String>}
   */
  static buildRawMessage({ to, subject, html, text }) {
    return new Promise((resolve, reject) => {
      const mail = new MailComposer({
        from: this.getFrom(),
        to,
        subject,
        text,
        html
      });

      mail.compile().build((error, message) => {
        if (error) return reject(error);

        const raw = message
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        resolve(raw);
      });
    });
  }

  /**
   * Enviar um e-mail genérico
   * @param {Object} options - {to, subject, html, text}
   * @returns {Boolean} true quando enviado (ou logado no modo console)
   */
  static async send({ to, subject, html, text }) {
    const gmail = this.getGmailClient();

    if (!gmail) {
      console.warn('\n⚠️  [EmailService] API do Gmail não configurada. E-mail NÃO foi enviado.');
      console.warn('   Para: ', to);
      console.warn('   Assunto: ', subject);
      console.warn('   Conteúdo:\n', text || html);
      console.warn('   Configure GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET e GMAIL_REFRESH_TOKEN no .env\n');
      return false;
    }

    const raw = await this.buildRawMessage({ to, subject, html, text });

    await gmail.users.messages.send(
      { userId: 'me', requestBody: { raw } },
      // Evita que a chamada fique pendurada indefinidamente em caso de instabilidade.
      { timeout: 15000 }
    );

    return true;
  }

  /**
   * Enviar o e-mail com o link de redefinição de senha
   * @param {Object} data - {to, name, resetUrl, expiresInMinutes}
   * @returns {Boolean}
   */
  static async sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes }) {
    const subject = 'Recuperação de senha - Barbearia';
    const greeting = name ? `Olá, ${name}!` : 'Olá!';

    const text = [
      greeting,
      '',
      'Recebemos um pedido para redefinir a senha da sua conta.',
      'Acesse o link abaixo para criar uma nova senha:',
      '',
      resetUrl,
      '',
      `Este link expira em ${expiresInMinutes} minutos e só pode ser usado uma vez.`,
      'Se você não pediu a recuperação, ignore este e-mail: sua senha continua a mesma.'
    ].join('\n');

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f5; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px;">
          <h1 style="margin: 0 0 16px; font-size: 22px; color: #18181b;">Recuperação de senha</h1>
          <p style="margin: 0 0 12px; font-size: 15px; color: #3f3f46;">${greeting}</p>
          <p style="margin: 0 0 24px; font-size: 15px; color: #3f3f46;">
            Recebemos um pedido para redefinir a senha da sua conta na Barbearia.
            Clique no botão abaixo para criar uma nova senha.
          </p>
          <p style="margin: 0 0 24px; text-align: center;">
            <a href="${resetUrl}"
               style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: bold;">
              Redefinir minha senha
            </a>
          </p>
          <p style="margin: 0 0 12px; font-size: 13px; color: #71717a;">
            Ou copie e cole este endereço no navegador:<br>
            <span style="word-break: break-all; color: #3f3f46;">${resetUrl}</span>
          </p>
          <p style="margin: 0 0 12px; font-size: 13px; color: #71717a;">
            Este link expira em <strong>${expiresInMinutes} minutos</strong> e só pode ser usado uma vez.
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
          <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
            Se você não solicitou a recuperação de senha, ignore este e-mail. Sua senha continua a mesma.
          </p>
        </div>
      </div>
    `;

    return this.send({ to, subject, html, text });
  }
}

module.exports = EmailService;
