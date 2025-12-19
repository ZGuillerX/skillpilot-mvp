import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Eliminar sesión
        await pool.query('DELETE FROM sessions WHERE token = ?', [token]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error en logout:', error);
        return NextResponse.json(
            { error: 'Error al cerrar sesión' },
            { status: 500 }
        );
    }
}
