import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateId } from '@/lib/auth';
import { sendResetPasswordEmail } from '@/lib/email';

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email es requerido' },
                { status: 400 }
            );
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Email inválido' },
                { status: 400 }
            );
        }

        // Buscar usuario
        const [users] = await pool.query(
            'SELECT id FROM users WHERE email = ? AND is_active = true',
            [email]
        );

        // Por seguridad, no revelar si el email existe o no
        if (users.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Si el email existe, recibirás un enlace de recuperación'
            });
        }

        const user = users[0];

        // Generar token de reseteo único
        const resetToken = generateId();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hora

        // Guardar token en la tabla de usuarios
        await pool.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [resetToken, expiresAt, user.id]
        );

        // Enviar email con enlace de recuperación
        try {
            await sendResetPasswordEmail(email, resetToken);
            console.log(`✅ Email de recuperación enviado a ${email}`);
        } catch (emailError) {
            console.error(`❌ Error al enviar email a ${email}:`, emailError);
            // Continuar incluso si falla el email, el token ya está guardado
        }

        return NextResponse.json({
            success: true,
            message: 'Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada.'
        });
    } catch (error) {
        console.error('Error en forgot-password:', error);
        return NextResponse.json(
            { error: 'Error al procesar tu solicitud' },
            { status: 500 }
        );
    }
}
