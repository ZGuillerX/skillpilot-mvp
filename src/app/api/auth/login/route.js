import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { comparePassword, generateToken, generateId, getTokenExpiration } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        // Validaciones
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            );
        }

        // Buscar usuario
        const [users] = await pool.query(
            'SELECT id, email, password_hash, name, avatar_url, learning_goal, preferred_language FROM users WHERE email = ? AND is_active = true',
            [email]
        );

        if (users.length === 0) {
            return NextResponse.json(
                { error: 'Email o contraseña incorrectos' },
                { status: 401 }
            );
        }

        const user = users[0];

        // Verificar contraseña
        const isValidPassword = await comparePassword(password, user.password_hash);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Email o contraseña incorrectos' },
                { status: 401 }
            );
        }

        // Actualizar último login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Crear sesión
        const token = generateToken(user.id, user.email);
        const sessionId = generateId();
        const expiresAt = getTokenExpiration();

        await pool.query(
            'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [sessionId, user.id, token, expiresAt]
        );

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
                learning_goal: user.learning_goal,
                preferred_language: user.preferred_language,
            },
            token,
        });
    } catch (error) {
        console.error('Error en login:', error);
        return NextResponse.json(
            { error: 'Error al iniciar sesión' },
            { status: 500 }
        );
    }
}
