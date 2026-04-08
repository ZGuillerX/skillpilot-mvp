import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { comparePassword, generateToken, generateId, getTokenExpiration } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

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

        if (password.length < 6 || password.length > 20) {
            return NextResponse.json(
                { error: 'La contraseña debe tener entre 6 y 20 caracteres' },
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

        let workspaceId = null;
        let workspaceRole = null;

        try {
            const [memberships] = await pool.query(
                `
                SELECT
                    COALESCE(u.current_workspace_id, wm.workspace_id) AS workspace_id,
                    wm.role
                FROM users u
                LEFT JOIN workspace_members wm
                  ON wm.user_id = u.id
                 AND wm.status = 'active'
                 AND (wm.workspace_id = u.current_workspace_id OR u.current_workspace_id IS NULL)
                WHERE u.id = ?
                ORDER BY FIELD(wm.role, 'owner', 'admin', 'member', 'viewer')
                LIMIT 1
                `,
                [user.id]
            );

            workspaceId = memberships?.[0]?.workspace_id || null;
            workspaceRole = memberships?.[0]?.role || null;
        } catch (workspaceError) {
            console.warn('No se pudo resolver workspace en login:', workspaceError?.message || workspaceError);
        }

        // Crear sesión
        const token = generateToken(user.id, user.email, workspaceId, workspaceRole);
        const sessionId = generateId();
        const expiresAt = getTokenExpiration();

        await pool.query(
            'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [sessionId, user.id, token, expiresAt]
        );

        await logAuditEvent({
            workspaceId,
            userId: user.id,
            action: 'auth.login',
            targetType: 'user',
            targetId: user.id,
            status: 'success',
            metadata: { email: user.email },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() || null,
            userAgent: request.headers.get('user-agent') || null,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
                learning_goal: user.learning_goal,
                preferred_language: user.preferred_language,
                workspaceId,
                role: workspaceRole,
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
