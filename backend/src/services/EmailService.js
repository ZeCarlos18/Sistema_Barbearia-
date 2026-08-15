const nodemailer = require('nodemailer');

/**
 * EmailService - Envio de e-mails transacionais do sistema
 *
 * Configuração via .env (padrão: Gmail SMTP):
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_SECURE=true
 *   SMTP_USER=seuemail@gmail.com
 *   SMTP_PASS=senha_de_app_de_16_digitos
 *   MAIL_FROM_NAME=Barbearia
 *   MAIL_FROM_ADDRESS=seuemail@gmail.com
 *
 * Se o SMTP não estiver configurado, o serviço entra em "modo console":
 * nenhum e-mail é enviado de verdade e o conteúdo é impresso no terminal.
 * Isso permite desenvolver sem credenciais, mas NUNCA deve ir para produção.
 */
class EmailService {
  static transporter = null;

  /**
   * Indica se as credenciais SMTP estão presentes no ambiente
   * @returns {Boolean}
   */
  static isConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  /**
   * Cria (uma única vez) o transporter do Nodemailer
   * @returns {Object|null} transporter ou null se não configurado
   */
  static getTransporter() {
    if (!this.isConfigured()) {
      return null;
    }

    if (!this.transporter) {
      const port = Number(process.env.SMTP_PORT || 465);

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        // porta 465 usa SSL direto; 587 usa STARTTLS
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        // Evita que o envio fique pendurado indefinidamente caso a porta esteja
        // bloqueada ou o servidor SMTP não responda (tempos em ms).
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        // Força IPv4: alguns provedores de hospedagem (ex: Render) não têm rota de
        // saída IPv6 funcional, e o Node tenta o endereço IPv6 do Gmail primeiro,
        // o que causa ENETUNREACH/ETIMEDOUT mesmo com a porta correta.
        family: 4
      });
    }

    return this.transporter;
  }

  /**
   * Monta o remetente no formato "Nome <email>"
   * @returns {String}
   */
  static getFrom() {
    const name = process.env.MAIL_FROM_NAME || 'Barbearia';
    const address = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;
    return `"${name}" <${address}>`;
  }

  /**
   * Enviar um e-mail genérico
   * @param {Object} options - {to, subject, html, text}
   * @returns {Boolean} true quando enviado (ou logado no modo console)
   */
  static async send({ to, subject, html, text }) {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn('\n⚠️  [EmailService] SMTP não configurado. E-mail NÃO foi enviado.');
      console.warn('   Para: ', to);
      console.warn('   Assunto: ', subject);
      console.warn('   Conteúdo:\n', text || html);
      console.warn('   Configure SMTP_HOST, SMTP_USER e SMTP_PASS no .env\n');
      return false;
    }

    await transporter.sendMail({
      from: this.getFrom(),
      to,
      subject,
      text,
      html
    });

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
