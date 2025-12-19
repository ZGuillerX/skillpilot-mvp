import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Verificar token
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Token inválido' },
                { status: 401 }
            );
        }

        // Verificar sesión en BD
        const [sessions] = await pool.query(
            'SELECT user_id, expires_at FROM sessions WHERE token = ?',
            [token]
        );

        if (sessions.length === 0) {
            return NextResponse.json(
                { error: 'Sesión no válida' },
                { status: 401 }
            );
        }

        const session = sessions[0];

        // Verificar expiración
        if (new Date() > new Date(session.expires_at)) {
            await pool.query('DELETE FROM sessions WHERE token = ?', [token]);
            return NextResponse.json(
                { error: 'Sesión expirada' },
                { status: 401 }
            );
        }

        // Obtener usuario
        const [users] = await pool.query(
            'SELECT id, email, name, avatar_url, learning_goal, preferred_language, created_at FROM users WHERE id = ? AND is_active = true',
            [session.user_id]
        );

        if (users.length === 0) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user: users[0],
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return NextResponse.json(
            { error: 'Error al obtener usuario' },
            { status: 500 }
        );
    }
}
