import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, generateToken, generateId, getTokenExpiration } from '@/lib/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Datos recibidos:', body);

        const { email, password, name } = body;

        // Validaciones
        if (!email || !password || !name) {
            console.log(' Campos faltantes:', { email: !!email, password: !!password, name: !!name });
            return NextResponse.json(
                { error: 'Todos los campos son requeridos' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            console.log(' Contraseña muy corta:', password.length);
            return NextResponse.json(
                { error: 'La contraseña debe tener entre 6 y 20 caracteres' },
                { status: 400 }
            );
        }

        if (password.length > 20) {
            console.log(' Contraseña muy larga:', password.length);
            return NextResponse.json(
                { error: 'La contraseña no puede exceder 20 caracteres' },
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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log(' Email inválido:', email);
            return NextResponse.json(
                { error: 'Email inválido' },
                { status: 400 }
            );
        }

        // Verificar si el usuario ya existe
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return NextResponse.json(
                { error: 'Este email ya está registrado' },
                { status: 400 }
            );
        }

        // Crear usuario
        const userId = generateId();
        const passwordHash = await hashPassword(password);

        await pool.query(
            'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
            [userId, email, passwordHash, name]
        );

        // Crear sesión
        const token = generateToken(userId, email);
        const sessionId = generateId();
        const expiresAt = getTokenExpiration();

        await pool.query(
            'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [sessionId, userId, token, expiresAt]
        );

        // Crear progreso inicial
        const progressId = generateId();
        await pool.query(
            'INSERT INTO user_progress (id, user_id) VALUES (?, ?)',
            [progressId, userId]
        );

        return NextResponse.json({
            success: true,
            user: {
                id: userId,
                email,
                name,
            },
            token,
        });
    } catch (error) {
        console.error('Error en registro:', error);
        return NextResponse.json(
            { error: 'Error al crear la cuenta' },
            { status: 500 }
        );
    }
}
