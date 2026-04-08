import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, generateToken, generateId, getTokenExpiration } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

function shouldAutoCreateWorkspace() {
    const value = String(process.env.AUTO_CREATE_WORKSPACE_ON_REGISTER || '').toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
}

function slugifyWorkspace(name) {
    const base = String(name || 'workspace')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 40) || 'workspace';

    return `${base}-${Date.now().toString().slice(-6)}`;
}

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

        let workspaceId = null;
        let workspaceRole = 'member';

        if (shouldAutoCreateWorkspace()) {
            try {
                workspaceId = generateId();
                const workspaceSlug = slugifyWorkspace(`${name}-workspace`);
                const membershipId = generateId();

                await pool.query(
                    'INSERT INTO workspaces (id, name, slug, owner_user_id, plan_tier) VALUES (?, ?, ?, ?, ?)',
                    [workspaceId, `${name}'s Workspace`, workspaceSlug, userId, 'free']
                );

                await pool.query(
                    'INSERT INTO workspace_members (id, workspace_id, user_id, role, status) VALUES (?, ?, ?, ?, ?)',
                    [membershipId, workspaceId, userId, workspaceRole, 'active']
                );

                await pool.query(
                    'UPDATE users SET current_workspace_id = ? WHERE id = ?',
                    [workspaceId, userId]
                );
            } catch (workspaceError) {
                console.warn('No se pudo crear workspace por defecto:', workspaceError?.message || workspaceError);
                workspaceId = null;
            }
        }

        // Crear sesión
        const token = generateToken(userId, email, workspaceId, workspaceRole);
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

        await logAuditEvent({
            workspaceId,
            userId,
            action: 'auth.register',
            targetType: 'user',
            targetId: userId,
            status: 'success',
            metadata: { email },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() || null,
            userAgent: request.headers.get('user-agent') || null,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: userId,
                email,
                name,
                workspaceId,
                role: workspaceRole,
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
