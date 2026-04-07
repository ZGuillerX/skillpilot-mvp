import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token y contraseña son requeridos' },
                { status: 400 }
            );
        }

        if (password.length < 6 || password.length > 20) {
            return NextResponse.json(
                { error: 'La contraseña debe tener entre 6 y 20 caracteres' },
                { status: 400 }
            );
        }

        if (password.length <= 8) {
            return NextResponse.json(
                { error: 'La contraseña debe tener más de 8 caracteres' },
                { status: 400 }
            );
        }

        if (!/[A-Z]/.test(password)) {
            return NextResponse.json(
                { error: 'La contraseña debe contener al menos una mayúscula (A-Z)' },
                { status: 400 }
            );
        }

        if (!/[0-9]/.test(password)) {
            return NextResponse.json(
                { error: 'La contraseña debe contener al menos un número (0-9)' },
                { status: 400 }
            );
        }

        // Buscar usuario con token válido y no expirado
        const [users] = await pool.query(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW() AND is_active = true',
            [token]
        );

        if (users.length === 0) {
            return NextResponse.json(
                { error: 'Token inválido o expirado' },
                { status: 400 }
            );
        }

        const user = users[0];

        // Hashear nueva contraseña
        const passwordHash = await hashPassword(password);

        // Actualizar contraseña y limpiar token
        await pool.query(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [passwordHash, user.id]
        );

        return NextResponse.json({
            success: true,
            message: 'Contraseña actualizada correctamente. Redirigiendo a login...'
        });
    } catch (error) {
        console.error('Error en reset-password:', error);
        return NextResponse.json(
            { error: 'Error al restablecer contraseña' },
            { status: 500 }
        );
    }
}
