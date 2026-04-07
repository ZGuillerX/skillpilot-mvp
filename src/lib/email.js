import nodemailer from 'nodemailer';

// Configurar transporte de email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD, // App Password, no contraseña normal
    },
});

/**
 * Enviar email de recuperación de contraseña
 * @param {string} email - Email del usuario
 * @param {string} resetToken - Token de reseteo
 * @returns {Promise}
 */
export async function sendResetPasswordEmail(email, resetToken) {
    try {
        // URL de reseteo (cambiar dominio según ambiente)
        const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'SkillPilot - Recupera tu contraseña',
            html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { padding: 30px 20px; }
                .content p { color: #333; line-height: 1.6; }
                .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; font-weight: bold; }
                .footer { background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; }
                .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; color: #856404; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚡ SkillPilot</h1>
                    <p>Recupera tu contraseña</p>
                </div>
                <div class="content">
                    <p>Hola,</p>
                    <p>Recibimos una solicitud para recuperar tu contraseña en SkillPilot. Si no fue tu, ignora este email.</p>
                    <p>Para establecer una nueva contraseña, haz clic en el botón de abajo:</p>
                    <center>
                        <a href="${resetUrl}" class="button">Cambiar Contraseña</a>
                    </center>
                    <p>O copia este enlace en tu navegador:</p>
                    <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;">
                        ${resetUrl}
                    </p>
                    <div class="warning">
                        <strong>⚠️ Importante:</strong> Este enlace expira en 1 hora. Si no lo usas en ese tiempo, tendrás que solicitar otro.
                    </div>
                    <p>El enlace es personal y no debe ser compartido con otros.</p>
                    <p>¡Gracias por usar SkillPilot!</p>
                </div>
                <div class="footer">
                    <p>© 2026 SkillPilot. Todos los derechos reservados.</p>
                    <p>Este es un email automático, no responder a este correo.</p>
                </div>
            </div>
        </body>
        </html>
      `,
            text: `
        Hola,\n\n
        Recibimos una solicitud para recuperar tu contraseña en SkillPilot.\n\n
        Para establecer una nueva contraseña, abre este enlace:\n
        ${resetUrl}\n\n
        Este enlace expira en 1 hora.\n\n
        Si no solicitaste este cambio, ignora este email.\n\n
        ¡Gracias por usar SkillPilot!
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error al enviar email:', error);
        throw error;
    }
}

/**
 * Enviar email de bienvenida al registrarse
 * @param {string} email - Email del usuario
 * @param {string} name - Nombre del usuario
 * @returns {Promise}
 */
export async function sendWelcomeEmail(email, name) {
    try {
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: '¡Bienvenido a SkillPilot!',
            html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { padding: 30px 20px; }
                .content p { color: #333; line-height: 1.6; }
                .footer { background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚡ SkillPilot</h1>
                    <p>¡Bienvenido ${name}!</p>
                </div>
                <div class="content">
                    <p>Hola ${name},</p>
                    <p>¡Gracias por registrarte en SkillPilot! Tu cuenta ha sido creada exitosamente.</p>
                    <p>Ahora puedes:</p>
                    <ul>
                        <li>📚 Crear planes de aprendizaje personalizados con IA</li>
                        <li>💻 Resolver desafíos de programación progresivos</li>
                        <li>🎯 Recibir retroalimentación inteligente en tiempo real</li>
                        <li>📊 Seguimiento de tu progreso con analytics</li>
                        <li>🏆 Ganar logros y insignias</li>
                    </ul>
                    <p>¡Comienza tu viaje de aprendizaje hoy mismo!</p>
                    <p>¡Gracias por elegir SkillPilot!</p>
                </div>
                <div class="footer">
                    <p>© 2026 SkillPilot. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email de bienvenida enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error al enviar email de bienvenida:', error);
        throw error;
    }
}

/**
 * Verificar conexión con Gmail
 * @returns {Promise}
 */
export async function verifyEmailConnection() {
    try {
        await transporter.verify();
        console.log('✅ Conexión con Gmail verificada');
        return true;
    } catch (error) {
        console.error('❌ Error al verificar conexión con Gmail:', error);
        return false;
    }
}
